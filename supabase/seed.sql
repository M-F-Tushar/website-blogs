insert into public.site_settings (
  site_key,
  site_name,
  site_tagline,
  site_description,
  footer_blurb,
  contact_email,
  location_label,
  github_url,
  linkedin_url,
  meta_title,
  meta_description
)
values (
  'primary',
  'Arian''s Lab Notes',
  'Student builder. Research-minded. AI/ML in motion.',
  'A production-grade personal knowledge platform documenting the path from CSE student to AI, ML, LLM, and MLOps professional.',
  'A long-horizon digital identity for documenting projects, research interests, notes, and real technical growth.',
  'hello@example.com',
  'Dhaka, Bangladesh',
  'https://github.com/',
  'https://linkedin.com/',
  'Arian''s Lab Notes',
  'A technical identity platform for blogging, academic notes, recommendations, and learning progress in AI, ML, LLM, and MLOps.'
)
on conflict (site_key) do update
set site_name = excluded.site_name,
    site_tagline = excluded.site_tagline,
    site_description = excluded.site_description,
    footer_blurb = excluded.footer_blurb,
    contact_email = excluded.contact_email,
    location_label = excluded.location_label,
    github_url = excluded.github_url,
    linkedin_url = excluded.linkedin_url,
    meta_title = excluded.meta_title,
    meta_description = excluded.meta_description;

insert into public.navigation_items (label, href, location, sort_order, is_visible, is_external)
values
  ('Home', '/', 'header', 10, true, false),
  ('About', '/about', 'header', 20, true, false),
  ('Blogs', '/blogs', 'header', 30, true, false),
  ('Academic', '/academic', 'header', 40, true, false),
  ('Recommendations', '/recommendations', 'header', 50, true, false),
  ('Contact', '/contact', 'header', 60, true, false),
  ('GitHub', 'https://github.com/', 'social', 10, true, true),
  ('LinkedIn', 'https://linkedin.com/', 'social', 20, true, true)
on conflict do nothing;

insert into public.pages (page_key, title, slug, status, is_visible, meta_title, meta_description)
values
  ('home', 'Home', '/', 'published', true, 'Home | Arian''s Lab Notes', 'AI/ML learning journey, technical writing, and research growth.'),
  ('about', 'About', '/about', 'published', true, 'About | Arian''s Lab Notes', 'Who I am, what I study, and where I''m headed in AI/ML.'),
  ('blogs', 'Blogs', '/blogs', 'published', true, 'Blogs | Arian''s Lab Notes', 'Learning notes, project logs, and evidence-driven technical writing.'),
  ('academic', 'Academic', '/academic', 'published', true, 'Academic | Arian''s Lab Notes', 'Coursework, experiments, research notes, and academic growth.'),
  ('recommendations', 'Recommendations', '/recommendations', 'published', true, 'Recommendations | Arian''s Lab Notes', 'Books, tools, courses, and resources worth recommending.'),
  ('contact', 'Contact', '/contact', 'published', true, 'Contact | Arian''s Lab Notes', 'Reach out for collaboration, conversation, or research exchange.')
on conflict (page_key) do update
set title = excluded.title,
    slug = excluded.slug,
    status = excluded.status,
    is_visible = excluded.is_visible,
    meta_title = excluded.meta_title,
    meta_description = excluded.meta_description;

with home_page as (
  select id from public.pages where page_key = 'home'
), about_page as (
  select id from public.pages where page_key = 'about'
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
  ((select id from home_page), 'hero', 'hero', 'I''m a CSE student building toward AI, machine learning, LLM systems, and dependable engineering practice.', 'This platform documents what I''m learning, what I''m building, and how my technical direction evolves over time.', 'I care about research depth, practical systems thinking, and honest progress. The goal is not to look finished. The goal is to become difficult to ignore through consistency and real work.', 10, true, true, '{}'::jsonb),
  ((select id from home_page), 'current-focus', 'focus', 'Current focus areas', 'The work streams shaping the next stage of growth.', E'- ML fundamentals and applied experimentation\n- LLM systems, prompting, and evaluation\n- MLOps habits: reproducibility, observability, deployment readiness\n- Technical writing and paper-reading discipline', 20, true, false, '{}'::jsonb),
  ((select id from about_page), 'who-i-am', 'identity', 'Who I am', 'A student-builder-researcher identity, still early but serious.', 'I am building a technical identity rooted in evidence, curiosity, and consistency. I want the public work to show real movement, not perform expertise.', 10, true, false, '{}'::jsonb),
  ((select id from about_page), 'roadmap', 'timeline', 'Current learning roadmap', 'Depth first, then leverage.', 'I''m building from CS fundamentals toward practical AI systems. That means strengthening statistics, ML workflows, LLM application design, and the deployment discipline needed to move from notebooks to reliable products.', 20, true, false, '{}'::jsonb),
  ((select id from about_page), 'values', 'principles', 'Values', 'Curiosity, depth, experimentation, and consistency.', 'I prefer serious iteration over surface-level speed. I want research habits, implementation discipline, and public learning to reinforce one another.', 30, true, false, '{}'::jsonb)
on conflict (page_id, section_key) do update
set section_type = excluded.section_type,
    heading = excluded.heading,
    subheading = excluded.subheading,
    body_markdown = excluded.body_markdown,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    featured = excluded.featured,
    settings_json = excluded.settings_json;

insert into public.categories (name, slug, description, sort_order)
values
  ('AI/ML', 'ai-ml', 'Artificial intelligence and machine learning notes.', 10),
  ('LLM', 'llm', 'Large language model learning and projects.', 20),
  ('MLOps', 'mlops', 'Deployment, observability, and workflow maturity.', 30),
  ('learning notes', 'learning-notes', 'Structured notes on learning systems and study.', 40),
  ('project logs', 'project-logs', 'Build logs and implementation journey notes.', 50),
  ('paper notes', 'paper-notes', 'Paper reading summaries and reflections.', 60)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order;

insert into public.tags (name, slug)
values
  ('roadmap', 'roadmap'),
  ('systems', 'systems'),
  ('evaluation', 'evaluation'),
  ('research', 'research')
on conflict (slug) do update
set name = excluded.name;

insert into public.recommendation_categories (name, slug, description, sort_order)
values
  ('books', 'books', 'Books that materially improve understanding.', 10),
  ('tools', 'tools', 'Tools that support execution and workflow discipline.', 20),
  ('courses', 'courses', 'Courses worth recommending.', 30)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order;

insert into public.posts (
  title,
  slug,
  excerpt,
  body_markdown,
  status,
  featured,
  published_at
)
values
  (
    'Designing a learning system instead of chasing random tutorials',
    'designing-a-learning-system',
    'A note on replacing fragmented resource consumption with a structured research and build workflow.',
    'I''m learning to treat technical growth as a system. That means choosing themes, keeping notes, building small proofs, and revisiting ideas until they compound.',
    'published',
    true,
    timezone('utc', now()) - interval '3 days'
  ),
  (
    'What I''m looking for in an LLM project worth building',
    'what-makes-an-llm-project-worth-building',
    'A practical filter for choosing projects that build durable skill rather than shallow novelty.',
    'I want projects that force decisions around data, retrieval quality, evaluation, and deployment tradeoffs. That''s where real learning starts.',
    'published',
    false,
    timezone('utc', now()) - interval '9 days'
  )
on conflict (slug) do update
set title = excluded.title,
    excerpt = excluded.excerpt,
    body_markdown = excluded.body_markdown,
    status = excluded.status,
    featured = excluded.featured,
    published_at = excluded.published_at;

insert into public.post_categories (post_id, category_id)
select posts.id, categories.id
from public.posts
join public.categories on categories.slug in ('learning-notes', 'llm', 'project-logs')
where (posts.slug = 'designing-a-learning-system' and categories.slug = 'learning-notes')
   or (posts.slug = 'what-makes-an-llm-project-worth-building' and categories.slug in ('llm', 'project-logs'))
on conflict do nothing;

insert into public.post_tags (post_id, tag_id)
select posts.id, tags.id
from public.posts
join public.tags on tags.slug in ('roadmap', 'systems', 'evaluation')
where (posts.slug = 'designing-a-learning-system' and tags.slug in ('roadmap', 'systems'))
   or (posts.slug = 'what-makes-an-llm-project-worth-building' and tags.slug = 'evaluation')
on conflict do nothing;

insert into public.academic_entries (
  title,
  slug,
  summary,
  body_markdown,
  entry_type,
  status,
  featured,
  started_at,
  completed_at
)
values (
  'Paper-reading workflow for ML and LLM topics',
  'paper-reading-workflow-for-ml-and-llm-topics',
  'A lightweight process for reading papers with better retention and clearer downstream experiments.',
  'I''m structuring paper reading around four passes: context, core mechanism, assumptions, and implementation ideas. The goal is to turn reading into experiments and writing.',
  'paper_note',
  'published',
  true,
  current_date - 20,
  current_date - 19
)
on conflict (slug) do update
set title = excluded.title,
    summary = excluded.summary,
    body_markdown = excluded.body_markdown,
    entry_type = excluded.entry_type,
    status = excluded.status,
    featured = excluded.featured,
    started_at = excluded.started_at,
    completed_at = excluded.completed_at;

insert into public.recommendations (
  category_id,
  title,
  slug,
  summary,
  body_markdown,
  why_recommend,
  audience,
  use_case,
  level,
  external_url,
  status,
  featured
)
values (
  (select id from public.recommendation_categories where slug = 'books'),
  'Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow',
  'hands-on-machine-learning-book',
  'A practical book for grounding intuition while still connecting ideas to real implementation.',
  'I recommend this when you want a serious but approachable bridge from concepts to actual ML workflows.',
  'It balances theory, code, and engineering sensibility better than most beginner-to-intermediate resources.',
  'Students moving from fundamentals into hands-on ML practice.',
  'Building intuition while implementing end-to-end workflows.',
  'intermediate',
  'https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/',
  'published',
  true
)
on conflict (slug) do update
set title = excluded.title,
    summary = excluded.summary,
    body_markdown = excluded.body_markdown,
    why_recommend = excluded.why_recommend,
    audience = excluded.audience,
    use_case = excluded.use_case,
    level = excluded.level,
    external_url = excluded.external_url,
    status = excluded.status,
    featured = excluded.featured;
