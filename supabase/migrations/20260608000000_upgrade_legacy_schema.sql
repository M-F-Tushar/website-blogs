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
