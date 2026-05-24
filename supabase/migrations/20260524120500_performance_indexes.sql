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
