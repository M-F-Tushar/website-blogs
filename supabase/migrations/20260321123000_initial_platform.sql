create extension if not exists pgcrypto;

create schema if not exists private;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'editor');
  end if;

  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'page_key') then
    create type public.page_key as enum ('home', 'about', 'blogs', 'academic', 'recommendations', 'contact');
  end if;

  if not exists (select 1 from pg_type where typname = 'academic_entry_type') then
    create type public.academic_entry_type as enum ('coursework', 'project', 'research_note', 'paper_note', 'experiment', 'certificate');
  end if;

  if not exists (select 1 from pg_type where typname = 'recommendation_level') then
    create type public.recommendation_level as enum ('beginner', 'intermediate', 'advanced');
  end if;

  if not exists (select 1 from pg_type where typname = 'navigation_location') then
    create type public.navigation_location as enum ('header', 'footer', 'social');
  end if;

  if not exists (
    select 1
    from pg_type
    join pg_namespace on pg_namespace.oid = pg_type.typnamespace
    where pg_type.typname = 'contact_message_status'
      and pg_namespace.nspname = 'public'
  ) then
    create type public.contact_message_status as enum ('new', 'reviewed', 'replied', 'archived');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  headline text,
  bio text,
  role public.app_role not null default 'editor',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  label text,
  alt_text text,
  bucket_name text not null check (bucket_name in ('site-public', 'site-admin')),
  object_path text not null unique,
  mime_type text,
  file_size integer,
  width integer,
  height integer,
  blur_data_url text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists avatar_asset_id uuid references public.media_assets (id) on delete set null;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_key text not null unique default 'primary',
  site_name text not null,
  site_tagline text not null,
  site_description text not null,
  footer_blurb text not null,
  contact_email text not null,
  location_label text,
  github_url text,
  linkedin_url text,
  x_url text,
  resume_url text,
  meta_title text,
  meta_description text,
  canonical_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.site_settings
  add column if not exists default_og_image_asset_id uuid references public.media_assets (id) on delete set null;

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  location public.navigation_location not null default 'header',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  is_external boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  page_key public.page_key not null unique,
  title text not null,
  slug text not null unique,
  status public.content_status not null default 'draft',
  is_visible boolean not null default true,
  meta_title text,
  meta_description text,
  canonical_url text,
  og_image_asset_id uuid references public.media_assets (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  section_key text not null,
  section_type text not null,
  heading text not null,
  subheading text,
  body_markdown text not null default '',
  image_asset_id uuid references public.media_assets (id) on delete set null,
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (page_id, section_key)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body_markdown text not null default '',
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  cover_asset_id uuid references public.media_assets (id) on delete set null,
  author_profile_id uuid references public.profiles (id) on delete set null,
  meta_title text,
  meta_description text,
  canonical_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.post_categories (
  post_id uuid not null references public.posts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (post_id, category_id)
);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create table if not exists public.academic_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  body_markdown text not null default '',
  entry_type public.academic_entry_type not null default 'research_note',
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  started_at date,
  completed_at date,
  external_url text,
  cover_asset_id uuid references public.media_assets (id) on delete set null,
  meta_title text,
  meta_description text,
  canonical_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recommendation_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.recommendation_categories (id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text,
  body_markdown text not null default '',
  why_recommend text,
  audience text,
  use_case text,
  level public.recommendation_level not null default 'beginner',
  external_url text,
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  cover_asset_id uuid references public.media_assets (id) on delete set null,
  meta_title text,
  meta_description text,
  canonical_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status public.contact_message_status not null default 'new',
  spam_score integer not null default 0,
  spam_flags text[] not null default array[]::text[],
  source_ip text,
  user_agent text,
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at before update on public.media_assets for each row execute function public.set_updated_at();
drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
drop trigger if exists set_navigation_items_updated_at on public.navigation_items;
create trigger set_navigation_items_updated_at before update on public.navigation_items for each row execute function public.set_updated_at();
drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at before update on public.pages for each row execute function public.set_updated_at();
drop trigger if exists set_page_sections_updated_at on public.page_sections;
create trigger set_page_sections_updated_at before update on public.page_sections for each row execute function public.set_updated_at();
drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists set_tags_updated_at on public.tags;
create trigger set_tags_updated_at before update on public.tags for each row execute function public.set_updated_at();
drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
drop trigger if exists set_academic_entries_updated_at on public.academic_entries;
create trigger set_academic_entries_updated_at before update on public.academic_entries for each row execute function public.set_updated_at();
drop trigger if exists set_recommendation_categories_updated_at on public.recommendation_categories;
create trigger set_recommendation_categories_updated_at before update on public.recommendation_categories for each row execute function public.set_updated_at();
drop trigger if exists set_recommendations_updated_at on public.recommendations;
create trigger set_recommendations_updated_at before update on public.recommendations for each row execute function public.set_updated_at();
drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon, authenticated, service_role;
grant insert, update, delete on all tables in schema public to authenticated, service_role;

alter default privileges in schema public grant select on tables to anon, authenticated, service_role;
alter default privileges in schema public grant insert, update, delete on tables to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.media_assets enable row level security;
alter table public.site_settings enable row level security;
alter table public.navigation_items enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_categories enable row level security;
alter table public.post_tags enable row level security;
alter table public.academic_entries enable row level security;
alter table public.recommendation_categories enable row level security;
alter table public.recommendations enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "Profiles can view own record" on public.profiles;
drop policy if exists "Profiles can update own record" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
drop policy if exists "Public reads site settings" on public.site_settings;
drop policy if exists "Admins manage site settings" on public.site_settings;
drop policy if exists "Public reads visible navigation" on public.navigation_items;
drop policy if exists "Admins manage navigation" on public.navigation_items;
drop policy if exists "Public reads published pages" on public.pages;
drop policy if exists "Admins manage pages" on public.pages;
drop policy if exists "Public reads visible page sections" on public.page_sections;
drop policy if exists "Admins manage page sections" on public.page_sections;
drop policy if exists "Public reads categories" on public.categories;
drop policy if exists "Public reads tags" on public.tags;
drop policy if exists "Public reads recommendation categories" on public.recommendation_categories;
drop policy if exists "Admins manage categories" on public.categories;
drop policy if exists "Admins manage tags" on public.tags;
drop policy if exists "Admins manage recommendation categories" on public.recommendation_categories;
drop policy if exists "Public reads published posts" on public.posts;
drop policy if exists "Admins manage posts" on public.posts;
drop policy if exists "Public reads post categories for published posts" on public.post_categories;
drop policy if exists "Public reads post tags for published posts" on public.post_tags;
drop policy if exists "Admins manage post categories" on public.post_categories;
drop policy if exists "Admins manage post tags" on public.post_tags;
drop policy if exists "Public reads published academic entries" on public.academic_entries;
drop policy if exists "Admins manage academic entries" on public.academic_entries;
drop policy if exists "Public reads published recommendations" on public.recommendations;
drop policy if exists "Admins manage recommendations" on public.recommendations;
drop policy if exists "Public reads public media assets" on public.media_assets;
drop policy if exists "Admins manage media assets" on public.media_assets;
drop policy if exists "Admins manage contact messages" on public.contact_messages;

create policy "Profiles can view own record" on public.profiles
for select to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "Profiles can update own record" on public.profiles
for update to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin')
with check (id = auth.uid() or public.current_user_role() = 'admin');

create policy "Admins manage profiles" on public.profiles
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads site settings" on public.site_settings
for select
using (true);

create policy "Admins manage site settings" on public.site_settings
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads visible navigation" on public.navigation_items
for select
using (is_visible = true);

create policy "Admins manage navigation" on public.navigation_items
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads published pages" on public.pages
for select
using (status = 'published' and is_visible = true);

create policy "Admins manage pages" on public.pages
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads visible page sections" on public.page_sections
for select
using (
  is_visible = true and exists (
    select 1 from public.pages
    where public.pages.id = public.page_sections.page_id
      and public.pages.status = 'published'
      and public.pages.is_visible = true
  )
);

create policy "Admins manage page sections" on public.page_sections
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads categories" on public.categories for select using (true);
create policy "Public reads tags" on public.tags for select using (true);
create policy "Public reads recommendation categories" on public.recommendation_categories for select using (true);

create policy "Admins manage categories" on public.categories
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Admins manage tags" on public.tags
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Admins manage recommendation categories" on public.recommendation_categories
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads published posts" on public.posts
for select
using (status = 'published' and deleted_at is null);

create policy "Admins manage posts" on public.posts
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads post categories for published posts" on public.post_categories
for select
using (
  exists (
    select 1 from public.posts
    where public.posts.id = public.post_categories.post_id
      and public.posts.status = 'published'
      and public.posts.deleted_at is null
  )
);

create policy "Public reads post tags for published posts" on public.post_tags
for select
using (
  exists (
    select 1 from public.posts
    where public.posts.id = public.post_tags.post_id
      and public.posts.status = 'published'
      and public.posts.deleted_at is null
  )
);

create policy "Admins manage post categories" on public.post_categories
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Admins manage post tags" on public.post_tags
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads published academic entries" on public.academic_entries
for select
using (status = 'published' and deleted_at is null);

create policy "Admins manage academic entries" on public.academic_entries
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads published recommendations" on public.recommendations
for select
using (status = 'published' and deleted_at is null);

create policy "Admins manage recommendations" on public.recommendations
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Public reads public media assets" on public.media_assets
for select
using (is_public = true);

create policy "Admins manage media assets" on public.media_assets
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Admins manage contact messages" on public.contact_messages
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-public', 'site-public', true, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml']),
  ('site-admin', 'site-admin', false, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads site public storage" on storage.objects;
drop policy if exists "Admins upload storage objects" on storage.objects;
drop policy if exists "Admins update storage objects" on storage.objects;
drop policy if exists "Admins delete storage objects" on storage.objects;

create policy "Public reads site public storage" on storage.objects
for select to anon, authenticated
using (bucket_id = 'site-public');

create policy "Admins upload storage objects" on storage.objects
for insert to authenticated
with check (public.current_user_role() = 'admin' and bucket_id in ('site-public', 'site-admin'));

create policy "Admins update storage objects" on storage.objects
for update to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Admins delete storage objects" on storage.objects
for delete to authenticated
using (public.current_user_role() = 'admin');
