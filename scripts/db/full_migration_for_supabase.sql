DROP VIEW IF EXISTS public.post_statistics CASCADE;
DROP TABLE IF EXISTS public.page_sections CASCADE;
DROP TABLE IF EXISTS public.navigation_items CASCADE;

-- Dynamically drop all legacy RLS policies on tables to prevent blocking column alters
DO $$ 
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT p.polname AS policy_name, c.relname AS table_name
        FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
          AND c.relname IN ('posts', 'recommendations', 'contact_messages', 'site_settings', 'profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policy_name, r.table_name);
    END LOOP;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'app_role' AND n.nspname = 'public') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'editor');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'content_status' AND n.nspname = 'public') THEN
    CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'recommendation_level' AND n.nspname = 'public') THEN
    CREATE TYPE public.recommendation_level AS ENUM ('beginner', 'intermediate', 'advanced');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'contact_message_status' AND n.nspname = 'public') THEN
    CREATE TYPE public.contact_message_status AS ENUM ('new', 'reviewed', 'replied', 'archived');
  END IF;
END $$;

-- Safe to alter type because all policies were just dynamically dropped
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='status' AND data_type='text') THEN 
  ALTER TABLE public.posts ALTER COLUMN status DROP DEFAULT;
  ALTER TABLE public.posts ALTER COLUMN status TYPE public.content_status USING lower(status)::text::public.content_status;
  ALTER TABLE public.posts ALTER COLUMN status SET DEFAULT 'draft'::public.content_status;
END IF; END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role not null default 'editor';

-- Posts prep
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='content') THEN ALTER TABLE public.posts RENAME COLUMN content TO body_markdown; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='date') THEN ALTER TABLE public.posts RENAME COLUMN date TO published_at; END IF; END $$;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS featured boolean not null default false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Recommendations prep
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recommendations' AND column_name='description') THEN ALTER TABLE public.recommendations RENAME COLUMN description TO summary; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recommendations' AND column_name='url') THEN ALTER TABLE public.recommendations RENAME COLUMN url TO external_url; END IF; END $$;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS body_markdown text not null default '';
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS why_recommend text;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS audience text;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS use_case text;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS level public.recommendation_level not null default 'beginner';
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS status public.content_status not null default 'published';
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS featured boolean not null default false;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Contact Messages prep
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS status public.contact_message_status not null default 'new';
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS source_ip text;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS handled_at timestamptz;

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

do $$
begin
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

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'private'
      and table_name = 'contact_messages'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'contact_messages'
  ) then
    alter table private.contact_messages set schema public;
  end if;
end
$$;

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

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contact_messages'
      and column_name = 'status'
      and udt_schema <> 'public'
  ) then
    alter table public.contact_messages
      alter column status drop default;

    alter table public.contact_messages
      alter column status type public.contact_message_status
      using status::text::public.contact_message_status;

    alter table public.contact_messages
      alter column status set default 'new'::public.contact_message_status;
  end if;
end
$$;

alter table public.contact_messages enable row level security;

drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at
before update on public.contact_messages
for each row
execute function public.set_updated_at();

drop policy if exists "Admins manage contact messages" on public.contact_messages;
create policy "Admins manage contact messages" on public.contact_messages
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

insert into public.pages (page_key, title, slug, status, is_visible)
values
  ('home', 'Home', 'home', 'published', true),
  ('about', 'About', 'about', 'published', true),
  ('blogs', 'Blogs', 'blogs', 'published', true),
  ('academic', 'Academic', 'academic', 'published', true),
  ('recommendations', 'Recommendations', 'recommendations', 'published', true),
  ('contact', 'Contact', 'contact', 'published', true)
on conflict (page_key) do nothing;

with blogs_page as (
  select id from public.pages where page_key = 'blogs'
), academic_page as (
  select id from public.pages where page_key = 'academic'
), recommendations_page as (
  select id from public.pages where page_key = 'recommendations'
), contact_page as (
  select id from public.pages where page_key = 'contact'
)
insert into public.page_sections (
  page_id,
  section_key,
  section_type,
  heading,
  subheading,
  body_markdown,
  sort_order,
  is_visible,
  featured,
  settings_json
)
values
  ((select id from blogs_page), 'hero', 'hero', 'Technical notes, project logs, paper reflections, and visible learning', 'Writing is part of the work. These posts track progress, sharpen understanding, and make the journey legible.', 'The blog archive is where experiments, learning loops, and system-level thinking become public. It should read like a real engineering record, not a content calendar.', 10, true, true, '{"eyebrow":"Blogs","panelLabel":"Writing system","panelItems":[{"label":"Published nodes","value":"02","description":"Published posts"},{"label":"Scope","value":"AI, ML, LLM, MLOps","description":"The themes running through the archive."}]}'::jsonb),
  ((select id from blogs_page), 'why-writing', 'detail', 'Why the writing matters', 'The public notes are part of the technical system, not separate from it.', 'Writing helps convert reading, implementation, and debugging into durable understanding. It also creates an evidence trail that is useful for collaborators, hiring, and future work.', 20, true, false, '{"eyebrow":"Why it matters"}'::jsonb),
  ((select id from academic_page), 'hero', 'hero', 'Coursework, research notes, experiments, and evidence of deeper study', 'This section tracks academic growth, research curiosity, and the transition from student work to more serious technical exploration.', 'Academic work matters here because it creates continuity. The goal is to make paper reading, experiments, coursework, and research interests visible as a coherent trajectory.', 10, true, true, '{"eyebrow":"Academic","panelLabel":"Research continuity","panelItems":[{"label":"Indexed entries","value":"01","description":"Published academic records"},{"label":"Emphasis","value":"Study and experiments","description":"Coursework, experiments, paper notes, and the evidence trail behind deeper study."}]}'::jsonb),
  ((select id from academic_page), 'study-system', 'detail', 'Study is treated like an evolving research system', 'The page is for more than grades or summaries.', 'I want this area to show how academic work compounds into engineering judgment: reading critically, documenting ideas, building experiments, and tracking the questions worth pursuing next.', 20, true, false, '{"eyebrow":"Research habit"}'::jsonb),
  ((select id from recommendations_page), 'hero', 'hero', 'Resources I''d recommend because they support real progress', 'Books, tools, and learning assets filtered through actual use, not generic listicle energy.', 'The goal of this page is curation, not volume. Anything listed here should be genuinely useful for building understanding, execution quality, or long-term technical taste.', 10, true, true, '{"eyebrow":"Recommendations","panelLabel":"Curated stack","panelItems":[{"label":"Saved resources","value":"01","description":"Published recommendations"},{"label":"Filter","value":"Useful in practice","description":"Books, tools, and references that actually hold up in practice."}]}'::jsonb),
  ((select id from recommendations_page), 'curation-rule', 'detail', 'The bar is practical usefulness, not popularity', 'A recommendation should earn its place.', 'This page should stay selective. I only want to recommend things that improve how I learn, build, debug, or reason about systems over time.', 20, true, false, '{"eyebrow":"Curation rule"}'::jsonb),
  ((select id from contact_page), 'hero', 'hero', 'Open a conversation', 'If there''s an idea, project, or direction worth exploring together, I''d like to hear about it.', 'The best outreach usually includes enough context to make the next step obvious: what the idea is, why it matters, and what kind of conversation would be useful.', 10, true, true, '{"eyebrow":"Contact","tracks":["Research conversations","AI/ML collaboration","Systems and tooling"]}'::jsonb),
  ((select id from contact_page), 'email', 'detail', 'hello@example.com', 'Best for collaboration, research questions, or project discussion.', 'Email is still the clearest way to start a useful technical conversation here.', 20, true, false, '{"eyebrow":"Email","href":"mailto:hello@example.com"}'::jsonb),
  ((select id from contact_page), 'location', 'detail', 'Dhaka, Bangladesh', 'Remote-friendly and open to thoughtful technical conversations across time zones.', 'Open to async conversation, remote collaboration, and practical discussions that can become real work.', 30, true, false, '{"eyebrow":"Location"}'::jsonb),
  ((select id from contact_page), 'form', 'form', 'Start the conversation', 'Use this channel for collaboration, research questions, project ideas, or thoughtful technical discussion.', 'A short summary, relevant links, and the kind of discussion you want make it easier to respond well.', 40, true, false, '{"eyebrow":"Secure intake","badge":"Thoughtful replies over volume"}'::jsonb)
on conflict (page_id, section_key) do update
set section_type = excluded.section_type,
    heading = excluded.heading,
    subheading = excluded.subheading,
    body_markdown = excluded.body_markdown,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    featured = excluded.featured,
    settings_json = excluded.settings_json;

with home_page as (
  select id from public.pages where page_key = 'home'
)
insert into public.page_sections (
  page_id,
  section_key,
  section_type,
  heading,
  subheading,
  body_markdown,
  sort_order,
  is_visible,
  featured,
  settings_json
)
values
  ((select id from home_page), 'hero', 'hero', 'I''m a CSE student building toward AI, machine learning, LLM systems, and dependable engineering practice.', 'This platform documents what I''m learning, what I''m building, and how my technical direction evolves over time.', 'I care about research depth, practical systems thinking, and honest progress. The goal is not to look finished. The goal is to become difficult to ignore through consistency and real work.', 10, true, true, '{"eyebrow":"AI engineering platform","focusTags":["LLM systems","MLOps discipline","Model evaluation","Research practice"],"primaryCtaLabel":"Read the journey","primaryCtaHref":"/blogs","secondaryCtaLabel":"Connect","secondaryCtaHref":"/contact","capabilitySignals":[{"label":"Primary track","value":"AI engineering and ML systems"},{"label":"Working style","value":"Research-led and documentation-first"},{"label":"Output signal","value":"Visible progress over polished claims"}],"systemMapEyebrow":"Research system map","systemMapTitle":"Why this platform exists","systemMapBadge":"Live notebook","vectorLabel":"Active vectors","vectorBadge":"Current emphasis","activeVectors":[{"label":"LLMs and orchestration","value":"82%"},{"label":"MLOps workflow","value":"74%"},{"label":"Applied ML","value":"68%"},{"label":"Research literacy","value":"79%"}]}'::jsonb),
  ((select id from home_page), 'current-focus', 'focus', 'Current focus areas', 'The work streams shaping the next stage of growth.', E'- ML fundamentals and applied experimentation\n- LLM systems, prompting, and evaluation\n- MLOps habits: reproducibility, observability, deployment readiness\n- Technical writing and paper-reading discipline', 20, true, false, '{"eyebrow":"Current vectors","panelTitle":"What the work is optimizing for right now","panelDescription":"A serious AI platform is part notebook, part research ledger, and part systems portfolio. These are the pillars shaping that direction.","columns":["Learning loops that end in working systems, not just notes.","Documentation that makes experiments, failures, and growth legible.","A platform that proves seriousness through consistency over time."]}'::jsonb),
  ((select id from home_page), 'featured-writing', 'preview', 'Recent writing that reflects how the work is evolving', 'A mix of learning notes, project thinking, and system-building reflections.', 'Featured posts are still selected through the content model. This section only controls the framing around them.', 30, true, false, '{"eyebrow":"Featured writing"}'::jsonb),
  ((select id from home_page), 'academic-preview', 'preview', 'Research notes, experiments, and academic continuity', 'A space for paper-reading, coursework reflections, research interests, and later thesis work.', 'Featured academic entries still come from the published academic content model, while this section controls the narrative around them.', 40, true, false, '{"eyebrow":"Academic and research"}'::jsonb),
  ((select id from home_page), 'recommendations-preview', 'preview', 'Resources worth recommending because they genuinely help', 'Tools, books, and learning assets that support real progress instead of hype.', 'Featured recommendations still come from the recommendation model and its featured flags. Admin controls this intro copy, not the underlying selection rules.', 50, true, false, '{"eyebrow":"Recommendations"}'::jsonb),
  ((select id from home_page), 'recent-updates', 'preview', 'Fresh notes and visible progress', 'The platform should feel alive, not static. These entries show recent movement.', 'Recent updates remain automatically driven by published posts so the homepage stays honest and self-refreshing.', 60, true, false, '{"eyebrow":"Recent updates"}'::jsonb),
  ((select id from home_page), 'connect', 'connect', 'If you care about AI, ML, systems, or serious learning, let us talk.', null, 'I am building this platform as a public record of growth. If there is a research idea, project, or conversation worth having, reach out.', 70, true, false, '{"eyebrow":"Connect","primaryCtaLabel":"Open contact page","primaryCtaHref":"/contact","secondaryCtaLabel":"Email directly","tracks":["Research discussion","Project collaboration","MLOps systems","Learning network"]}'::jsonb)
on conflict (page_id, section_key) do update
set section_type = excluded.section_type,
    heading = excluded.heading,
    subheading = excluded.subheading,
    body_markdown = excluded.body_markdown,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    featured = excluded.featured,
    settings_json = excluded.settings_json;

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

-- Performance indexes for frequently-filtered columns.
-- All listing queries filter by status='published' AND deleted_at IS NULL;
-- partial indexes keep these slim and used by the planner.

create index if not exists posts_published_idx
  on public.posts (published_at desc nulls last)
  where status = 'published' and deleted_at is null;

create index if not exists posts_featured_idx
  on public.posts (published_at desc nulls last)
  where status = 'published' and deleted_at is null and featured = true;

create index if not exists academic_entries_published_idx
  on public.academic_entries (completed_at desc nulls last, created_at desc)
  where status = 'published' and deleted_at is null;

create index if not exists recommendations_published_idx
  on public.recommendations (created_at desc)
  where status = 'published' and deleted_at is null;

-- Slug-based detail lookups already have unique indexes; FK lookups for taxonomy
-- joins benefit from explicit indexes on the FK columns.
create index if not exists post_categories_category_idx on public.post_categories (category_id);
create index if not exists post_categories_post_idx on public.post_categories (post_id);
create index if not exists post_tags_tag_idx on public.post_tags (tag_id);
create index if not exists post_tags_post_idx on public.post_tags (post_id);
create index if not exists recommendations_category_idx on public.recommendations (category_id);

-- Page sections are sorted by sort_order within a page on every public render.
create index if not exists page_sections_page_sort_idx
  on public.page_sections (page_id, sort_order)
  where is_visible = true;

-- Pages lookup by page_key is unique already; redundant — skip.

-- Contact abuse-check queries filter by source_ip / email / user_agent
-- combined with created_at window. Compound indexes match the predicate.
create index if not exists contact_messages_ip_created_idx
  on public.contact_messages (source_ip, created_at desc)
  where source_ip is not null;

create index if not exists contact_messages_email_created_idx
  on public.contact_messages (email, created_at desc);

create index if not exists contact_messages_user_agent_created_idx
  on public.contact_messages (user_agent, created_at desc)
  where user_agent is not null;

-- Media assets surfaced in admin lists are paginated by uploaded_at desc.
create index if not exists media_assets_created_idx on public.media_assets (created_at desc);
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);

-- Seed detail-page template sections so admins can edit per-article-type chrome copy
-- (eyebrows, cover captions, side notes, footer CTAs) without code changes.
-- Each detail template is attached to its parent listing page via the existing
-- (page_id, section_key) unique constraint and remains is_visible=false so it
-- doesn't render on the listing page itself.

with blogs_page as (
  select id from public.pages where page_key = 'blogs'
), academic_page as (
  select id from public.pages where page_key = 'academic'
), recommendations_page as (
  select id from public.pages where page_key = 'recommendations'
)
insert into public.page_sections (
  page_id,
  section_key,
  section_type,
  heading,
  subheading,
  body_markdown,
  sort_order,
  is_visible,
  featured,
  settings_json
)
values
  (
    (select id from blogs_page),
    'blog-detail',
    'template',
    'Blog detail template',
    'Editable copy for the per-post reading page chrome.',
    '',
    900,
    false,
    false,
    '{
      "eyebrowFallback": "Blog",
      "sideNoteLabel": "Entry note",
      "sideNoteFallback": "A systems-focused notebook entry on deliberate practice, feedback loops, and building stronger learning habits.",
      "coverCaptionLabel": "Visual preface",
      "coverCaptionFallback": "A visual cue for the article before the notes move into structure, practice, and reflection.",
      "footerEyebrow": "Continue the archive",
      "footerHeading": "More notes from the same learning system",
      "footerDescription": "Browse the full blog archive for project filters, study notes, and technical reflections.",
      "footerCtaLabel": "Back to blog",
      "footerCtaHref": "/blogs"
    }'::jsonb
  ),
  (
    (select id from academic_page),
    'academic-detail',
    'template',
    'Academic detail template',
    'Editable copy for the per-entry academic reading page chrome.',
    '',
    900,
    false,
    false,
    '{
      "eyebrowFallback": "Academic",
      "sideNoteLabel": "Entry note",
      "sideNoteFallback": "An academic working note arranged for slower reading, clearer sectioning, and easier revisiting.",
      "coverCaptionLabel": "Academic frame",
      "coverCaptionFallback": "A visual anchor for the paper, project, or coursework note before the deeper reading begins.",
      "footerEyebrow": "Continue the evidence trail",
      "footerHeading": "More academic records and research notes",
      "footerDescription": "Return to the academic archive for coursework, experiments, and deeper study.",
      "footerCtaLabel": "Back to academic",
      "footerCtaHref": "/academic"
    }'::jsonb
  ),
  (
    (select id from recommendations_page),
    'recommendation-detail',
    'template',
    'Recommendation detail template',
    'Editable copy for the per-recommendation reading page chrome.',
    '',
    900,
    false,
    false,
    '{
      "eyebrowFallback": "Recommendation",
      "offerFallback": "A focused recommendation selected for how clearly it helps someone make progress.",
      "whyFallback": "This stands out because it turns good intentions into a more useful learning or working loop.",
      "useCaseFallback": "Use it when you want something dependable enough to actually change how you learn or work.",
      "audienceFallback": "Anyone looking for a practical next step rather than more random content.",
      "posterCaptionLabel": "Why this is worth your time",
      "openLinkLabel": "Open resource",
      "detailsAnchorLabel": "See the details",
      "detailsSectionEyebrow": "Closer look",
      "detailsSectionHeading": "What this recommendation gives you when you actually use it",
      "footerEyebrow": "Keep curating",
      "footerHeading": "Compare this with the full resource shelf",
      "footerCtaLabel": "Back to resources",
      "footerCtaHref": "/recommendations",
      "quickFitLabel": "Quick fit",
      "quickFitLevelLabel": "Level",
      "quickFitAudienceLabel": "Best for",
      "quickFitValueLabel": "Value signal",
      "secondaryCtaLabel": "Go to the resource"
    }'::jsonb
  )
on conflict (page_id, section_key) do update
set section_type = excluded.section_type,
    heading = excluded.heading,
    subheading = excluded.subheading,
    body_markdown = excluded.body_markdown,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    featured = excluded.featured,
    settings_json = excluded.settings_json;

-- Seed listing-page template sections so admins can edit per-listing chrome copy
-- (eyebrows, search/empty/sort copy, filter labels, card action labels) without
-- code changes. Each listing template is attached to its parent listing page via
-- the existing (page_id, section_key) unique constraint and remains
-- is_visible=false so it doesn't render in the visible section list.

with blogs_page as (
  select id from public.pages where page_key = 'blogs'
), academic_page as (
  select id from public.pages where page_key = 'academic'
), recommendations_page as (
  select id from public.pages where page_key = 'recommendations'
)
insert into public.page_sections (
  page_id,
  section_key,
  section_type,
  heading,
  subheading,
  body_markdown,
  sort_order,
  is_visible,
  featured,
  settings_json
)
values
  (
    (select id from blogs_page),
    'blog-list',
    'template',
    'Blog listing template',
    'Editable copy for the public /blogs index chrome.',
    '',
    910,
    false,
    false,
    '{
      "heroEyebrow": "Explore my thoughts & tutorials",
      "heroTitleFallback": "The Blog",
      "heroDescriptionFallback": "Discover articles on web development, software engineering, and the latest tech trends.",
      "railLabel": "Archive shape",
      "railUnitLabel": "posts",
      "railDescription": "Built for progress notes, project filters, and technical reflection that compounds.",
      "searchPlaceholder": "Search articles...",
      "filterAllLabel": "All",
      "countLabel": "Showing {count} posts",
      "sortNewestLabel": "Newest First",
      "sortOldestLabel": "Oldest First",
      "sortAlphabeticalLabel": "Alphabetical",
      "cardActionLabel": "Read Article",
      "cardEyebrowFallback": "Article",
      "emptyEyebrow": "Archive status",
      "emptyHeading": "No articles match that search",
      "emptyDescription": "Try a title keyword, a tag, or a category term to surface the post you want."
    }'::jsonb
  ),
  (
    (select id from academic_page),
    'academic-list',
    'template',
    'Academic listing template',
    'Editable copy for the public /academic index chrome.',
    '',
    910,
    false,
    false,
    '{
      "heroEyebrow": "Academic trail",
      "heroTitleFallback": "Academic",
      "heroDescriptionFallback": "Coursework, research notes, experiments, and evidence of deeper study.",
      "railLabel": "Evidence log",
      "railUnitLabel": "records",
      "railDescription": "Coursework, experiments, and research notes organized as proof of depth.",
      "searchPlaceholder": "Search research notes, experiments, or coursework...",
      "filterAllLabel": "All",
      "countLabel": "Showing {count} academic records",
      "sortNewestLabel": "Most Recent",
      "sortOldestLabel": "Oldest First",
      "sortAlphabeticalLabel": "Alphabetical",
      "cardActionLabel": "Open Entry",
      "cardEyebrowFallback": "Academic",
      "emptyEyebrow": "Academic archive",
      "emptyHeading": "No academic entries match that search",
      "emptyDescription": "Change the search term or type filter to surface more records."
    }'::jsonb
  ),
  (
    (select id from recommendations_page),
    'recommendation-list',
    'template',
    'Recommendation listing template',
    'Editable copy for the public /recommendations index chrome.',
    '',
    910,
    false,
    false,
    '{
      "heroEyebrow": "Curated Resources",
      "heroTitleFallback": "Recommendations",
      "heroDescriptionFallback": "A hand-picked collection of tools, books, courses, and resources that have helped me on my journey.",
      "railResourcesUnitLabel": "resources",
      "railCategoriesUnitLabel": "categories",
      "railDescription": "A practical shelf for tools, books, courses, and references worth returning to.",
      "searchPlaceholder": "Search by title, description, or tag...",
      "filterAllLabel": "All",
      "countLabel": "Showing {count} curated resources",
      "sortNewestLabel": "Newest First",
      "sortAlphabeticalLabel": "Alphabetical",
      "sortLevelLabel": "By Level",
      "cardActionLabel": "View Resource",
      "cardEyebrowFallback": "Recommendation",
      "emptyEyebrow": "Collection state",
      "emptyHeading": "No recommendations match that filter",
      "emptyDescription": "Change the category or search term to widen the curated set again."
    }'::jsonb
  )
on conflict (page_id, section_key) do update
set section_type = excluded.section_type,
    heading = excluded.heading,
    subheading = excluded.subheading,
    body_markdown = excluded.body_markdown,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    featured = excluded.featured,
    settings_json = excluded.settings_json;

-- Seed About + Contact page templates so admins can edit chrome copy from a
-- single hidden template row per page. Mirrors blog/academic/recommendation
-- listing templates. is_visible=false so they don't render in the public
-- section list; consumed via getDetailTemplateSection().

with about_page as (
  select id from public.pages where page_key = 'about'
), contact_page as (
  select id from public.pages where page_key = 'contact'
)
insert into public.page_sections (
  page_id,
  section_key,
  section_type,
  heading,
  subheading,
  body_markdown,
  sort_order,
  is_visible,
  featured,
  settings_json
)
values
  (
    (select id from about_page),
    'about-template',
    'template',
    'About page template',
    'Editable chrome copy for the public /about page.',
    '',
    910,
    false,
    false,
    '{
      "heroEyebrow": "About Me",
      "heroGreeting": "Hi, I''m",
      "taglineFallback": "AI & ML Enthusiast • Aspiring AI Agent Developer • LLM Explorer • Lifelong Learner",
      "focusCardEyebrow": "Current Focus",
      "focusCardTitle": "What I am actively deepening",
      "focusCardDescription": "The public work clusters around a few themes that I want to study seriously and connect across projects.",
      "platformCardEyebrow": "Platform Logic",
      "platformCardTitle": "One record, several layers",
      "platformCardDescription": "Writing, academic notes, and recommendations all feed the same long-horizon technical identity.",
      "summaryWritingLabel": "Writing",
      "summaryAcademicLabel": "Academic",
      "summaryCurationLabel": "Curation",
      "summaryWritingUnit": "published notes",
      "summaryAcademicUnit": "tracked records",
      "summaryCurationUnit": "recommendations",
      "signalArticlesLabel": "Articles Written",
      "signalWordsLabel": "Total Words",
      "signalYearsLabel": "Years Active",
      "signalTopicsLabel": "Topics Covered",
      "storyHeading": "My Story",
      "storyFallback": "I am building this platform as a public record of learning, experimentation, and long-term technical growth.",
      "timelineEyebrow": "Journey Timeline",
      "timelineHeadingFallback": "The phases shaping the work",
      "timelineDescriptionFallback": "A visual map of how the direction is forming, deepening, and turning into a more legible body of work.",
      "portraitInitialsEyebrow": "Identity signal",
      "portraitInitialsCaption": "Student builder, research-minded, and documenting the path in public."
    }'::jsonb
  ),
  (
    (select id from contact_page),
    'contact-template',
    'template',
    'Contact page template',
    'Editable chrome copy for the public /contact page and form.',
    '',
    910,
    false,
    false,
    '{
      "heroEyebrow": "Get in touch",
      "heroTitleLead": "Let''s",
      "heroTitleAccent": "Connect",
      "heroDescriptionFallback": "I''m always open to discussing new projects, creative ideas, or opportunities to be part of an amazing team.",
      "railLabel": "Best messages include",
      "railLine1": "Context, current stage, and the kind of collaboration you have in mind.",
      "railLine2": "AI, ML, LLM systems, research, and technical writing fit best.",
      "availabilityTitle": "Currently Available",
      "availabilityDescription": "I usually respond within 24-48 hours during business days. For urgent matters, mention \"URGENT\" in the subject line.",
      "formSectionHeading": "Send a Message",
      "formEyebrowFallback": "Direct form",
      "formTitleFallback": "Start the conversation",
      "formDescriptionFallback": "Tell me about your project, research interest, or the kind of conversation you want to have.",
      "formBadgeFallback": "Thoughtful replies over volume",
      "formNameLabel": "Your Name",
      "formNamePlaceholder": "John Doe",
      "formEmailLabel": "Email Address",
      "formEmailPlaceholder": "john@example.com",
      "formSubjectLabel": "Subject",
      "formSubjectPlaceholder": "Project inquiry",
      "formMessageLabel": "Message",
      "formMessagePlaceholder": "Tell me about your project or inquiry...",
      "formRequiredMarker": "*",
      "formSubmitLabel": "Send Message",
      "formSubmittingLabel": "Sending...",
      "formCaptchaPrompt": "Complete the bot protection check before sending your message.",
      "formCaptchaRequired": "Bot protection is required for public submissions.",
      "formCaptchaMissingError": "Complete the bot protection check before sending your message.",
      "formMisconfiguredError": "This form is temporarily unavailable because bot protection is not configured correctly.",
      "formGenericError": "Something went wrong while sending the message.",
      "formSuccessFallback": "Message sent successfully.",
      "socialSectionHeading": "Connect Elsewhere",
      "detailCardFallbackDescription": "Update this card from the admin contact page.",
      "fallbackEmailEyebrow": "Email",
      "fallbackEmailDescription": "Best for professional inquiries.",
      "fallbackLocationEyebrow": "Location",
      "fallbackLocationDescription": "Available for thoughtful remote collaboration.",
      "fallbackGithubEyebrow": "GitHub",
      "fallbackGithubTitle": "GitHub",
      "fallbackGithubDescription": "Check out my open-source work.",
      "fallbackLinkedinEyebrow": "LinkedIn",
      "fallbackLinkedinTitle": "LinkedIn",
      "fallbackLinkedinDescription": "Connect professionally.",
      "faqSectionHeading": "Frequently Asked Questions",
      "fallbackFaqs": [
        {
          "question": "What''s the best way to reach you?",
          "answer": "Email or the contact form both work well. If the message is specific and thoughtful, I can usually respond faster."
        },
        {
          "question": "Do you offer consulting services?",
          "answer": "I''m most open to collaborations, research discussions, and technically meaningful projects rather than generic consulting requests."
        },
        {
          "question": "Can you help with my project?",
          "answer": "If the project aligns with AI, ML, LLM systems, learning infrastructure, or technical writing, send context and I''ll tell you honestly whether it''s a fit."
        },
        {
          "question": "How can I collaborate with you?",
          "answer": "The best outreach explains the problem, the current stage, and what kind of collaboration you have in mind."
        }
      ]
    }'::jsonb
  )
on conflict (page_id, section_key) do update
set section_type = excluded.section_type,
    heading = excluded.heading,
    subheading = excluded.subheading,
    body_markdown = excluded.body_markdown,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    featured = excluded.featured,
    settings_json = excluded.settings_json;

-- 1. Upgrade 'posts' table
UPDATE public.posts SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
UPDATE public.posts SET slug = slug || '-' || substr(md5(random()::text), 1, 4) WHERE id IN (
  SELECT id FROM (SELECT id, row_number() over (partition by slug order by created_at) as rnum FROM public.posts) t WHERE t.rnum > 1
);
ALTER TABLE public.posts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_slug_key;
ALTER TABLE public.posts ADD UNIQUE (slug);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS cover_asset_id uuid;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_cover_asset_id_fkey;
ALTER TABLE public.posts ADD CONSTRAINT posts_cover_asset_id_fkey FOREIGN KEY (cover_asset_id) REFERENCES public.media_assets (id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_profile_id uuid;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_profile_id_fkey;
ALTER TABLE public.posts ADD CONSTRAINT posts_author_profile_id_fkey FOREIGN KEY (author_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE public.posts DROP COLUMN IF EXISTS category;
ALTER TABLE public.posts DROP COLUMN IF EXISTS tags;
ALTER TABLE public.posts DROP COLUMN IF EXISTS cover_image;
ALTER TABLE public.posts DROP COLUMN IF EXISTS is_initial;

-- 2. Upgrade 'contact_messages' table
UPDATE public.contact_messages SET status = 'reviewed' WHERE is_read = true;
ALTER TABLE public.contact_messages DROP COLUMN IF EXISTS is_read;

-- 3. Upgrade 'recommendations' table
UPDATE public.recommendations SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
UPDATE public.recommendations SET slug = slug || '-' || substr(md5(random()::text), 1, 4) WHERE id IN (
  SELECT id FROM (SELECT id, row_number() over (partition by slug order by created_at) as rnum FROM public.recommendations) t WHERE t.rnum > 1
);
ALTER TABLE public.recommendations ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_slug_key;
ALTER TABLE public.recommendations ADD UNIQUE (slug);
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_category_id_fkey;
ALTER TABLE public.recommendations ADD CONSTRAINT recommendations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.recommendation_categories (id) ON DELETE SET NULL;
ALTER TABLE public.recommendations DROP COLUMN IF EXISTS type;
ALTER TABLE public.recommendations DROP COLUMN IF EXISTS is_initial;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS cover_asset_id uuid;
ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_cover_asset_id_fkey;
ALTER TABLE public.recommendations ADD CONSTRAINT recommendations_cover_asset_id_fkey FOREIGN KEY (cover_asset_id) REFERENCES public.media_assets (id) ON DELETE SET NULL;

-- 4. Site Settings (Clean up legacy columns)
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS featured_post_id;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS site_title;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS site_description;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS photo_url;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS site_name;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS author_name;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS author_tagline;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS author_bio;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS social_github;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS social_linkedin;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS social_twitter;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS social_email;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS skills;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS timeline;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS achievements;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS categories;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS ui_text;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS appearance;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS navigation;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS seo;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS homepage_layout;
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS author_image;

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS is_active boolean not null default true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS settings_json jsonb not null default '{}'::jsonb;

