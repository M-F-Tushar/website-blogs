begin;

alter table public.contact_messages
  add column if not exists submission_fingerprint text;

update public.contact_messages
set submission_fingerprint =
  lower(btrim(email)) || '|' ||
  lower(regexp_replace(btrim(message), '[[:space:]]+', ' ', 'g')) || '|' ||
  coalesce(source_ip, '') || '|' ||
  coalesce(user_agent, '')
where submission_fingerprint is null;

create index if not exists contact_messages_fingerprint_created_idx
  on public.contact_messages (submission_fingerprint, created_at desc)
  where submission_fingerprint is not null;

create index if not exists contact_messages_canonical_email_created_idx
  on public.contact_messages (lower(email), created_at desc);

create index if not exists contact_messages_email_message_created_idx
  on public.contact_messages (lower(email), message, created_at desc);

create or replace function public.submit_contact_message_atomic(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_source_ip text,
  p_user_agent text,
  p_fingerprint text,
  p_base_score integer,
  p_base_flags text[]
)
returns table (spam_score integer, spam_flags text[])
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_email text := lower(btrim(p_email));
  v_ip_count integer := 0;
  v_email_count integer := 0;
  v_duplicate_count integer := 0;
  v_fingerprint_count integer := 0;
  v_score integer := greatest(p_base_score, 0);
  v_flags text[] := coalesce(p_base_flags, array[]::text[]);
begin
  perform pg_advisory_xact_lock(hashtextextended(locks.lock_key, 0))
  from (
    select distinct item.lock_key
    from unnest(
      array[
        'contact:email:' || v_email,
        'contact:fingerprint:' || coalesce(p_fingerprint, ''),
        'contact:ip:' || coalesce(p_source_ip, '')
      ]
    ) as item(lock_key)
    where item.lock_key not in (
      'contact:email:',
      'contact:fingerprint:',
      'contact:ip:'
    )
    order by item.lock_key
  ) as locks
  order by locks.lock_key;

  if nullif(p_source_ip, '') is not null then
    select count(*)
      into v_ip_count
    from public.contact_messages
    where source_ip = nullif(p_source_ip, '')
      and created_at >= timezone('utc', now()) - interval '1 hour';
  end if;

  select count(*)
    into v_email_count
  from public.contact_messages
  where lower(email) = v_email
    and created_at >= timezone('utc', now()) - interval '1 day';

  select count(*)
    into v_duplicate_count
  from public.contact_messages
  where lower(email) = v_email
    and message = p_message
    and created_at >= timezone('utc', now()) - interval '7 days';

  select count(*)
    into v_fingerprint_count
  from public.contact_messages
  where submission_fingerprint = p_fingerprint
    and created_at >= timezone('utc', now()) - interval '1 day';

  if v_ip_count >= 5 or v_email_count >= 6 then
    raise exception 'CONTACT_RATE_LIMIT' using errcode = 'P0001';
  end if;

  if v_duplicate_count > 0 then
    v_score := v_score + 30;
    v_flags := array_append(v_flags, 'duplicate_message');
  end if;

  if v_email_count >= 3 then
    v_score := v_score + 20;
    v_flags := array_append(v_flags, 'high_email_velocity');
  end if;

  if v_fingerprint_count >= 2 then
    v_score := v_score + 20;
    v_flags := array_append(v_flags, 'fingerprint_reuse');
  end if;

  if v_score >= 70 then
    raise exception 'CONTACT_REJECTED' using errcode = 'P0001';
  end if;

  insert into public.contact_messages (
    name,
    email,
    subject,
    message,
    status,
    spam_score,
    spam_flags,
    source_ip,
    user_agent,
    submission_fingerprint
  )
  values (
    p_name,
    v_email,
    p_subject,
    p_message,
    'new',
    v_score,
    v_flags,
    nullif(p_source_ip, ''),
    nullif(p_user_agent, ''),
    p_fingerprint
  );

  return query select v_score, v_flags;
end;
$$;

create or replace function public.save_post_with_taxonomy(
  p_id uuid,
  p_author_profile_id uuid,
  p_title text,
  p_slug text,
  p_excerpt text,
  p_body_markdown text,
  p_status text,
  p_featured boolean,
  p_published_at text,
  p_cover_asset_id text,
  p_meta_title text,
  p_meta_description text,
  p_canonical_url text,
  p_categories jsonb,
  p_tags jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_post_id uuid := coalesce(p_id, gen_random_uuid());
  v_item jsonb;
begin
  insert into public.posts (
    id,
    title,
    slug,
    excerpt,
    body_markdown,
    status,
    featured,
    published_at,
    cover_asset_id,
    meta_title,
    meta_description,
    canonical_url,
    author_profile_id
  )
  values (
    v_post_id,
    p_title,
    p_slug,
    p_excerpt,
    p_body_markdown,
    p_status::public.content_status,
    p_featured,
    nullif(p_published_at, '')::timestamptz,
    nullif(p_cover_asset_id, '')::uuid,
    nullif(p_meta_title, ''),
    nullif(p_meta_description, ''),
    nullif(p_canonical_url, ''),
    p_author_profile_id
  )
  on conflict (id) do update
  set
    title = excluded.title,
    slug = excluded.slug,
    excerpt = excluded.excerpt,
    body_markdown = excluded.body_markdown,
    status = excluded.status,
    featured = excluded.featured,
    published_at = excluded.published_at,
    cover_asset_id = excluded.cover_asset_id,
    meta_title = excluded.meta_title,
    meta_description = excluded.meta_description,
    canonical_url = excluded.canonical_url,
    deleted_at = null;

  for v_item in select value from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb))
  loop
    insert into public.categories (name, slug, sort_order)
    values (
      v_item ->> 'name',
      v_item ->> 'slug',
      coalesce((v_item ->> 'sort_order')::integer, 0)
    )
    on conflict (slug) do update
    set
      name = excluded.name,
      sort_order = excluded.sort_order;
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(p_tags, '[]'::jsonb))
  loop
    insert into public.tags (name, slug)
    values (v_item ->> 'name', v_item ->> 'slug')
    on conflict (slug) do update
    set name = excluded.name;
  end loop;

  delete from public.post_categories where post_id = v_post_id;
  delete from public.post_tags where post_id = v_post_id;

  insert into public.post_categories (post_id, category_id)
  select v_post_id, category.id
  from public.categories as category
  join (
    select value ->> 'slug' as slug
    from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb))
  ) as requested on requested.slug = category.slug
  on conflict do nothing;

  insert into public.post_tags (post_id, tag_id)
  select v_post_id, tag.id
  from public.tags as tag
  join (
    select value ->> 'slug' as slug
    from jsonb_array_elements(coalesce(p_tags, '[]'::jsonb))
  ) as requested on requested.slug = tag.slug
  on conflict do nothing;

  return v_post_id;
end;
$$;

create or replace function public.delete_media_asset_record(p_asset_id uuid)
returns setof public.media_assets
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_asset public.media_assets%rowtype;
begin
  select *
    into v_asset
  from public.media_assets
  where id = p_asset_id
  for update;

  if not found then
    raise exception 'MEDIA_NOT_FOUND' using errcode = 'P0001';
  end if;

  if
    exists (
      select 1 from public.site_settings
      where default_og_image_asset_id = p_asset_id
    )
    or exists (select 1 from public.pages where og_image_asset_id = p_asset_id)
    or exists (select 1 from public.profiles where avatar_asset_id = p_asset_id)
    or exists (select 1 from public.posts where cover_asset_id = p_asset_id)
    or exists (
      select 1 from public.academic_entries where cover_asset_id = p_asset_id
    )
    or exists (
      select 1 from public.recommendations where cover_asset_id = p_asset_id
    )
    or exists (
      select 1 from public.page_sections where image_asset_id = p_asset_id
    )
  then
    raise exception 'MEDIA_IN_USE' using errcode = 'P0001';
  end if;

  delete from public.media_assets where id = p_asset_id;
  return next v_asset;
end;
$$;

revoke all on function public.submit_contact_message_atomic(
  text, text, text, text, text, text, text, integer, text[]
) from public, anon, authenticated;
grant execute on function public.submit_contact_message_atomic(
  text, text, text, text, text, text, text, integer, text[]
) to service_role;

revoke all on function public.save_post_with_taxonomy(
  uuid, uuid, text, text, text, text, text, boolean, text, text,
  text, text, text, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.save_post_with_taxonomy(
  uuid, uuid, text, text, text, text, text, boolean, text, text,
  text, text, text, jsonb, jsonb
) to service_role;

revoke all on function public.delete_media_asset_record(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_media_asset_record(uuid) to service_role;

commit;
