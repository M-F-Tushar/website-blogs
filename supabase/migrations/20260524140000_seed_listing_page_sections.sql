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
