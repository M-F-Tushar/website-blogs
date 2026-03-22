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
