begin;

-- SEC-01: Profiles may be read by authenticated callers, but direct profile
-- mutation is limited to display fields. Privileged identity/role mutations
-- remain available to the service-role client and security-definer triggers.
revoke select (id, email, full_name, headline, bio, role, created_at, updated_at, avatar_asset_id),
       insert (id, email, full_name, headline, bio, role, created_at, updated_at, avatar_asset_id),
       update (id, email, full_name, headline, bio, role, created_at, updated_at, avatar_asset_id),
       references (id, email, full_name, headline, bio, role, created_at, updated_at, avatar_asset_id)
  on public.profiles
  from authenticated;
revoke all privileges on public.profiles from authenticated;

grant select (
  id,
  email,
  full_name,
  headline,
  bio,
  role,
  created_at,
  updated_at,
  avatar_asset_id
) on public.profiles to authenticated;

grant update (full_name, headline, bio, avatar_asset_id)
  on public.profiles
  to authenticated;

drop policy if exists "Profiles can update own record" on public.profiles;
create policy "Profiles can update own record" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = public.current_user_role()
);

create or replace function public.protect_profile_role_changes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Only the service role may change profile roles'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role_changes on public.profiles;
create trigger protect_profile_role_changes
before update of role on public.profiles
for each row
when (old.role is distinct from new.role)
execute function public.protect_profile_role_changes();

-- INF-06: Keep one canonical row for each navigation location and href before
-- enforcing the natural key. No other table references navigation row IDs.
lock table public.navigation_items in share row exclusive mode;

with ranked_navigation_items as (
  select
    id,
    row_number() over (
      partition by location, href
      order by is_visible desc, updated_at desc, created_at asc, id
    ) as duplicate_rank
  from public.navigation_items
)
delete from public.navigation_items as navigation_item
using ranked_navigation_items
where navigation_item.id = ranked_navigation_items.id
  and ranked_navigation_items.duplicate_rank > 1;

alter table public.navigation_items
  add constraint navigation_items_location_href_key
  unique (location, href);

-- PERF-06: Match the public listing filters and sort order without forcing a
-- query-time sort. These supplement the older single-column indexes.
create index if not exists posts_public_listing_idx
  on public.posts (featured desc, published_at desc nulls last)
  where status = 'published' and deleted_at is null;

create index if not exists academic_entries_public_listing_idx
  on public.academic_entries (
    featured desc,
    completed_at desc nulls last,
    created_at desc nulls last
  )
  where status = 'published' and deleted_at is null;

create index if not exists recommendations_public_listing_idx
  on public.recommendations (featured desc, created_at desc nulls last)
  where status = 'published' and deleted_at is null;

commit;
