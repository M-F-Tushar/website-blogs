-- Security hardening: tighten storage MIME types, RLS, and grants.

-- C2: Disallow SVG uploads in both public and admin buckets to prevent stored XSS.
update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']
where id in ('site-public', 'site-admin');

-- H6: Replace schema-wide blanket default privileges with per-table grants so that
-- any newly created table must be explicitly granted to anon. A future
-- forgotten `enable row level security` no longer leaks data to anon by default.
alter default privileges in schema public revoke select on tables from anon, authenticated;
alter default privileges in schema public revoke insert, update, delete on tables from authenticated;

-- Re-grant only on tables that actually have public read policies (defense in depth
-- in case RLS is ever disabled or a policy regresses).
revoke select on all tables in schema public from anon;

grant select on
  public.site_settings,
  public.navigation_items,
  public.pages,
  public.page_sections,
  public.categories,
  public.tags,
  public.recommendation_categories,
  public.posts,
  public.post_categories,
  public.post_tags,
  public.academic_entries,
  public.recommendations,
  public.media_assets
to anon;

-- H5: Tighten policy role targeting for consistency. The previous policies used
-- `to public` (everyone) implicitly; constrain to the roles we actually expect.
drop policy if exists "Public reads site settings" on public.site_settings;
create policy "Public reads site settings" on public.site_settings
for select to anon, authenticated
using (true);

drop policy if exists "Public reads visible navigation" on public.navigation_items;
create policy "Public reads visible navigation" on public.navigation_items
for select to anon, authenticated
using (is_visible = true);

-- H7: Restrict public reads of taxonomies to ones referenced by at least one
-- published, non-deleted post / recommendation. Prevents draft-only taxonomy
-- names from leaking via the public taxonomy lists.
drop policy if exists "Public reads categories" on public.categories;
create policy "Public reads referenced categories" on public.categories
for select to anon, authenticated
using (
  exists (
    select 1
    from public.post_categories pc
    join public.posts p on p.id = pc.post_id
    where pc.category_id = categories.id
      and p.status = 'published'
      and p.deleted_at is null
  )
);

drop policy if exists "Public reads tags" on public.tags;
create policy "Public reads referenced tags" on public.tags
for select to anon, authenticated
using (
  exists (
    select 1
    from public.post_tags pt
    join public.posts p on p.id = pt.post_id
    where pt.tag_id = tags.id
      and p.status = 'published'
      and p.deleted_at is null
  )
);

drop policy if exists "Public reads recommendation categories" on public.recommendation_categories;
create policy "Public reads referenced recommendation categories" on public.recommendation_categories
for select to anon, authenticated
using (
  exists (
    select 1
    from public.recommendations r
    where r.category_id = recommendation_categories.id
      and r.status = 'published'
      and r.deleted_at is null
  )
);
