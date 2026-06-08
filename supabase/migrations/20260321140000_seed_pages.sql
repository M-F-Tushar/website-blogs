insert into public.pages (page_key, title, slug, status, is_visible)
values
  ('home', 'Home', 'home', 'published', true),
  ('about', 'About', 'about', 'published', true),
  ('blogs', 'Blogs', 'blogs', 'published', true),
  ('academic', 'Academic', 'academic', 'published', true),
  ('recommendations', 'Recommendations', 'recommendations', 'published', true),
  ('contact', 'Contact', 'contact', 'published', true)
on conflict (page_key) do nothing;
