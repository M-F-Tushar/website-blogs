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
