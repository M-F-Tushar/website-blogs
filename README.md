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
APP_ENV=local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
CONTACT_RATE_LIMIT_SECRET=replace-with-a-long-random-string
RESEND_API_KEY=your-resend-api-key
CONTACT_NOTIFICATION_FROM_EMAIL=notifications@example.com
CONTACT_NOTIFICATION_EMAIL=owner@example.com
```

Notes:
- `NEXT_PUBLIC_SITE_URL` is used for metadata and canonical URL generation.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` power public reads and browser auth.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` enable Cloudflare Turnstile on the public contact form.
- `SUPABASE_SERVICE_ROLE_KEY` is required for admin reads/writes, media uploads, and contact message inserts.
- `CONTACT_RATE_LIMIT_SECRET` signs the contact throttle cookie used by Proxy and the contact API.
- `RESEND_API_KEY`, `CONTACT_NOTIFICATION_FROM_EMAIL`, and `CONTACT_NOTIFICATION_EMAIL` enable email notifications for lower-risk contact messages.
- `APP_ENV` controls public fallback behavior:
  - `local`: demo content can be used when Supabase is unavailable
  - `staging`: the app logs and throws instead of silently serving fake content
  - `production`: the app logs and fails loudly instead of masking backend issues
- On Vercel, preview deployments are treated as staging automatically via `VERCEL_ENV=preview`.
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

Migrations live in `supabase/migrations/` and are applied in timestamp order by the Supabase CLI. The directory is the single source of truth; never hand-apply SQL to a hosted database. `scripts/db/` holds one-time historical scripts only and must not be re-run.

### Local Supabase Flow

If you are using the Supabase CLI locally:

```bash
supabase start
supabase db reset
```

`supabase db reset` will apply migrations and then run `supabase/seed.sql`.

### Remote Supabase Flow

For a hosted Supabase project, link the project, confirm the migration ledger matches, then push:

```bash
supabase link --project-ref <your-project-ref>
npm run db:check
supabase db push
```

`npm run db:check` compares `supabase/migrations/` with the remote history table and exits non-zero (with the exact `migration repair` command) if they disagree. Do not run `db push` while it reports drift; see Manual Task H in [`docs/manual-operator-guide.md`](./docs/manual-operator-guide.md).

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

## Auth Policy

This project is currently designed as an admin-only backend.

What is already true in this repo:
- the app only exposes a sign-in form, not a public signup flow
- no OAuth providers are enabled in `supabase/config.toml`
- local `[auth].enable_signup = false` blocks self-service account creation; `[auth.email].enable_signup = true` is required because the CLI maps it to the email provider toggle and `false` would block all local password logins
- anonymous requests to any `/admin/*` route other than `/admin/login` are redirected by the proxy before rendering; `requireAdminSession()` then enforces the `admin` role server-side
- admin access is expected to be created manually with `npm run bootstrap-admin`

Hosted Supabase settings you should apply manually before launch:
1. Disable public email signup in the hosted Supabase Auth settings.
2. Keep anonymous sign-in disabled.
3. Keep unused external auth providers disabled.
4. Set the Auth site URL to your real deployed domain.
5. Replace any localhost redirect URLs with exact real-domain redirect URLs only.
6. Create admin accounts manually using the bootstrap script or the Supabase admin API. Do not enable self-service account creation unless that becomes a real product feature.

Important note:
- `supabase/config.toml` controls local Supabase CLI behavior only. It does not automatically change hosted Supabase project settings.

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run verify
npm run smoke:install
npm run smoke
npm run e2e:flows
npm run verify:smoke
npm run start
npm run bootstrap-admin -- admin@example.com strong-password "Admin Name"
npm run db:check            # linked project ledger vs supabase/migrations
npm run db:check -- --local
```

## Continuous Integration

CI is defined in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and runs on pushes to `main` and on pull requests. Three jobs:

- `verify`: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`
- `smoke`: builds and serves the public app with no Supabase or Turnstile credentials, then runs `tests/smoke/` (public pages, real 404 status codes, anonymous admin redirect, security headers, RSS)
- `e2e`: starts an ephemeral Supabase stack with the CLI, bootstraps an admin user, and runs `tests/e2e/` (admin publish flow with taxonomy persistence, contact flow and throttling, eight RLS invariants)

Important note:
- All jobs run with `APP_ENV=local`. No GitHub Actions secrets or repository variables are required.
- The `e2e` job proves the code against a real Postgres with the tracked migrations, not against the hosted project.
- Real staged backend verification belongs in the staging smoke checklist below.

## Optional Authenticated E2E Check

Use this when you want to verify the admin publishing path against a real local or staging backend:

```bash
npm run bootstrap-admin -- admin@example.com strong-password "Admin Name"
$env:E2E_ADMIN_EMAIL="admin@example.com"
$env:E2E_ADMIN_PASSWORD="strong-password"
npm run e2e:flows
```

What it proves:
- the public contact form stores a message
- rapid repeat contact submissions are throttled
- the new message appears in `/admin/messages`
- admin login works and the dashboard integration panel renders without leaking keys
- a post can be created from `/admin/content/posts`, with its categories and tags persisted
- the saved post appears on the public blog
- anonymous clients cannot read drafts, soft-deleted posts, private media, profiles, or contact messages, and cannot write

## Staging Smoke Checklist

Use the repeatable checklist in [`docs/staging-smoke-checklist.md`](./docs/staging-smoke-checklist.md) after staging deploys and before production release.

## Execution Guides

For the current improvement and rollout sequence, use:
- [`docs/execution-roadmap.md`](./docs/execution-roadmap.md)
- [`docs/manual-operator-guide.md`](./docs/manual-operator-guide.md)

## Deployment

Recommended deployment path:

1. Provision a hosted Supabase project.
2. Link it and apply migrations with `npm run db:check` followed by `supabase db push` (see Remote Supabase Flow).
3. Set production env variables:
   - `APP_ENV=production`
   - `NEXT_PUBLIC_SITE_URL=https://tusherblog.me`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `CONTACT_RATE_LIMIT_SECRET`
   - `RESEND_API_KEY`
   - `CONTACT_NOTIFICATION_FROM_EMAIL`
   - `CONTACT_NOTIFICATION_EMAIL`
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
   - `/admin/dashboard` → Integrations shows `production` and every row `ok`
   - public pages load
   - an unknown URL returns HTTP 404, not 200
   - content saves from admin and appears publicly
   - contact messages reach the admin inbox
   - media uploads succeed
   - canonical URLs resolve to `https://tusherblog.me/*`, never localhost

## Repository Rules

- Keep only one app in this repository.
- Do not commit secrets or `.env.local`.
- Do not commit `.next`, `node_modules`, or temp bootstrap folders.
- Treat `supabase/` as the source of truth for schema changes.
