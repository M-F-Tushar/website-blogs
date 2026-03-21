# Website Blogs

A production-oriented personal blog and digital identity platform built with Next.js and Supabase.

The project includes:
- a public site for home, about, blogs, academic notes, recommendations, and contact
- an admin panel for managing site settings, navigation, page sections, posts, academic entries, recommendations, media, and messages
- a Supabase schema with RLS, storage buckets, and admin/profile role handling

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Zod for server-side validation

## Environment Variables

Create a local `.env.local` file with:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Notes:
- `NEXT_PUBLIC_SITE_URL` is used for metadata and canonical URL generation.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` power public reads and browser auth.
- `SUPABASE_SERVICE_ROLE_KEY` is required for admin reads/writes, media uploads, and contact message inserts.
- Never commit `.env.local`.

## Project Purpose

This repository is meant to be the single real app for the site. It powers:
- the public-facing content site
- the admin content management area
- the Supabase-backed database and storage layer

The old `bootstrap-app-temp/` folder was removed and should not be recreated inside this repo.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Add `.env.local` using the variables above.

3. Start the app:

```bash
npm run dev
```

4. Open:
- Public site: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

## Database Setup

This repo contains the Supabase schema and seed files under `supabase/`.

### Migration Order

Apply migrations in timestamp order:

1. `supabase/migrations/20260321123000_initial_platform.sql`
2. `supabase/migrations/20260321131500_move_contact_messages_to_public.sql`

### Local Supabase Flow

If you are using the Supabase CLI locally:

```bash
supabase start
supabase db reset
```

`supabase db reset` will apply migrations and then run `supabase/seed.sql`.

### Remote Supabase Flow

For a hosted Supabase project, link the project and push the schema:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

If you want starter content in the remote database, apply `supabase/seed.sql` intentionally. Do not seed production with placeholder content unless you plan to replace it immediately.

## Admin Bootstrap

After the database and env variables are ready, create or promote the first admin user:

```bash
npm run bootstrap-admin -- admin@example.com strong-password "Admin Name"
```

What this script does:
- loads `.env.local` or `.env`
- creates the auth user if needed
- upserts the matching `profiles` row
- sets the profile role to `admin`

Once complete, sign in at `/admin/login`.

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
npm run bootstrap-admin -- admin@example.com strong-password "Admin Name"
```

## Deployment

Recommended deployment path:

1. Provision a hosted Supabase project.
2. Apply migrations in order.
3. Set production env variables:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Configure Supabase Auth site URL and allowed redirect URLs for the deployed domain.
5. Bootstrap the first admin account.
6. Run:

```bash
npm run lint
npm run typecheck
npm run build
```

7. Deploy the Next.js app to a Node-capable host such as Vercel.
8. Verify post-deploy:
   - admin login works
   - public pages load
   - content saves from admin and appears publicly
   - contact messages reach the admin inbox
   - media uploads succeed

## Repository Rules

- Keep only one app in this repository.
- Do not commit secrets or `.env.local`.
- Do not commit `.next`, `node_modules`, or temp bootstrap folders.
- Treat `supabase/` as the source of truth for schema changes.
