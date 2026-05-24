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
