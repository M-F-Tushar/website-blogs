# Project: Personal Blog Platform

## Purpose
This project is a production-grade personal blog and professional identity platform for a CSE student growing toward AI/ML/LLM/MLOps.

It should feel like:
- a professional digital identity
- a personal and public learning journal
- a technical and alternative portfolio
- an academic and research-growth companion
- a platform showing progress from CSE student to AI/ML/LLM/MLOps professional

## Product principles
- Serious but not fake-expert
- Clean and technical
- Student-builder-researcher tone
- Evidence-driven
- Forward-looking
- Admin-first, database-driven, not hardcoded
- Content-controlled from admin
- Design system controlled in code

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- Optional Supabase Edge Functions later

## Core public pages
- Home
- About
- Blogs
- Academic 
- Recommendation
- Contact

## Hidden/admin routes
- /admin
- /admin/login
- /admin/dashboard
- /admin/content/*
- /blogs/[slug]
- /academic/[slug]
- /recommendations/[slug] optional

## Content priorities
The website should clearly show:
- what I am learning
- what I am building
- what I am reading
- what tools I use
- what research areas interest me
- how I am progressing over time

## Architecture rules
- Use a database-driven content model
- Do not hardcode content that should be editable in admin
- Do not try to make every visual detail editable from admin
- Keep design/layout/components code-controlled
- Use reusable components and clean file structure
- Prefer server rendering where useful for SEO
- Build for production, not demo quality

## Security rules
- Enable RLS on all public-schema tables
- Admin routes require authenticated session
- Only admin can mutate admin-managed content
- Draft content must not be public
- Contact messages must be private to admin
- Never expose service role key on the client
- Validate and sanitize content properly

## Quality rules
- Use strong TypeScript typing
- Use clean, maintainable architecture
- Avoid duplication
- Add loading, empty, and error states
- Keep accessibility in mind
- Keep SEO in mind from the beginning

## Working style
- Before coding, first analyze and propose a phased plan
- Then implement in small, reviewable steps
- After each major step, explain what changed
- When uncertain, state assumptions clearly
- Prefer migrations and structured schemas over ad hoc changes
