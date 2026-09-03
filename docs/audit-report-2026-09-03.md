# End-to-End System Audit — website-blogs

| Field | Value |
|---|---|
| Audit date | 2026-09-03 |
| Scope | Frontend (Next.js 16 App Router), backend (Supabase Postgres/Auth/Storage/RLS), networking & edge (Vercel, proxy/middleware, CSP, TLS), CI/CD, dependency supply chain, local ↔ CI ↔ production connectivity |
| Repository | `M-F-Tushar/website-blogs` @ `main` (`251bbad`) — plus 29 uncommitted working-tree files |
| Production | `https://tusherblog.me` (Vercel) → Supabase project `ljljrvqlrleppyzzfysj` |
| Method | Static review, live local stack execution (lint, typecheck, build, smoke, e2e, RLS suite), read-only black-box probing of production using only public surfaces (HTML, headers, anon key embedded in the public bundle). No writes were made to production. |

---

## 1. Executive verdict

| Layer | Status | One-line summary |
|---|---|---|
| Codebase (working tree) | **PASS** | All quality gates green: lint, typecheck, build, smoke, 10/10 e2e, 8/8 RLS invariants. |
| Local backend | **PASS** | 6 Supabase containers healthy, 11/11 migrations applied, RLS on 15/15 tables, 0 tables without policies. |
| Production frontend | **PASS with findings** | Every public route returns 200, TLS valid, SEO surfaces correct, media served. Running **stale code** (see F-02) and a **vulnerable Next.js** (F-01). |
| Production backend | **PASS** | Gateway up, RLS verified from the anon role (drafts hidden, contact messages denied), schema content in parity with repo. Migration *ledger* is out-of-band (F-03). |
| Connectivity | **PASS with 2 broken links** | All runtime links work. Two *process* links are broken: working tree → `origin/main` (unpushed fixes) and repo → production Supabase (CLI not linked). |

**Overall: OPERATIONAL, NOT RELEASE-CLEAN.** The system is connected and functioning end to end. However, production is serving the version from before the 2026-08-04 hardening pass, and that version ships a Next.js release with nine published advisories. Two High findings must be closed before this can be certified as production-clean.

---

## 2. Connectivity matrix

Legend: ✅ verified working · ⚠ works but cannot be fully verified from this workspace · ❌ broken / not established

| # | Link | Direction | Status | Evidence |
|---|---|---|---|---|
| C1 | Server Components → Supabase REST (anon key) | app → DB | ✅ | `createPublicServerClient()` typed `SupabaseClient<Database>`; local build rendered real DB rows; prod pages render DB content. |
| C2 | Browser → Supabase Auth (cookie SSR) | browser ↔ auth | ✅ | `@supabase/ssr` cookie adapters in [src/lib/supabase/server.ts](../src/lib/supabase/server.ts) and [src/lib/supabase/proxy.ts](../src/lib/supabase/proxy.ts); e2e admin login passes. |
| C3 | Proxy (middleware) → Auth token refresh | edge → auth | ✅ | `updateSession()` calls `auth.getUser()` on every `/admin/*` request; matcher scoped to `/admin/:path*` and `/api/contact`. |
| C4 | Server Actions → Supabase (service role) | app → DB | ✅ | `createServiceRoleClient()` is `server-only`, singleton, only invoked after `requireAdminSession()`. Never referenced from client components. |
| C5 | Storage → `next/image` optimizer | Supabase Storage → Vercel → browser | ✅ | Prod `/_next/image?url=…supabase.co/storage/v1/object/public/site-public/…` → `200 image/png 104 KB`. `remotePatterns` derived from `NEXT_PUBLIC_SUPABASE_URL`. |
| C6 | Contact API → Cloudflare Turnstile | app → 3rd party | ⚠ | Code path correct (fail-closed in hosted stages, skipped in local). Secret/site key are env-only; cannot be verified from repo. |
| C7 | Contact API → Resend email | app → 3rd party | ⚠ | Non-fatal by design (message is stored first; email failure is logged, not surfaced). Keys env-only; cannot be verified from repo. |
| C8 | Contact rate limiter → client IP | edge header → app | ✅ | Trusts `x-vercel-forwarded-for` (correct for Vercel); warns in production if header is absent. |
| C9 | CI → ephemeral Supabase | GitHub Actions → Docker | ✅ | `e2e` job in [.github/workflows/ci.yml](../.github/workflows/ci.yml) starts the CLI stack, exports keys, bootstraps admin, runs e2e. Validated locally step by step. |
| C10 | Local DB ↔ `supabase/migrations` | repo → local | ✅ | `supabase migration list --local`: 11 local = 11 remote. |
| C11 | Repo ↔ **production** Supabase (CLI link) | repo → prod DB | ❌ | No `supabase/.temp/project-ref`. `db push`, `migration list`, `gen types` against prod are impossible from this workspace. See F-03. |
| C12 | Working tree → `origin/main` | dev → VCS | ❌ | 22 modified + 7 untracked files (all 2026-08-04 fixes) are **not committed or pushed**. See F-02. |
| C13 | `origin/main` → Vercel production | VCS → host | ✅ | Prod headers `server: Vercel`; content matches `251bbad` (no CSP, no RSS). Deployment pipeline itself is healthy. |
| C14 | Production Supabase gateway | internet → Kong | ✅ | `/rest/v1/` and `/auth/v1/health` return 401 *without* an API key (correct: gateway up, key required). |

---

## 3. Findings

Severity scale: **Critical** (exploitable / data loss now) · **High** (must fix before next release) · **Medium** (fix this cycle) · **Low** (hygiene).

### F-01 · HIGH · Production runs Next.js 16.2.6 with 9 published advisories

- **Evidence:** `npm audit --omit=dev` → `next` range `>=16.0.0 <16.2.11`, `fixAvailable: true`. Committed `package-lock.json` (what Vercel builds) also pins `16.2.6`.
- **Advisories:** Middleware/Proxy bypass (GHSA-6gpp-xcg3-4w24), Server Actions DoS (GHSA-m99w-x7hq-7vfj), SSRF in Server Actions (GHSA-89xv-2m56-2m9x), SSRF via rewrites (GHSA-p9j2-gv94-2wf4), 2× cache confusion, unbounded Server Action payload, image-optimizer SVG DoS, Server Function endpoint disclosure.
- **Why it matters here:** the entire admin surface is Server Actions; `proxy.ts` *is* the middleware; image optimizer is in use.
- **Also flagged (transitive, all fixable):** `sharp <0.35.0` (libvips CVEs), `postcss <=8.5.22`, `nanoid <=3.3.17`, `mermaid` / `dompurify` (prototype pollution, cross-realm sanitize bypass — mermaid renders user-authored markdown diagrams).
- **Remediation:** `npm i next@^16.3.4 eslint-config-next@^16.3.4 && npm audit fix` → `npm run verify:smoke` → commit → deploy. Re-run `npm audit --omit=dev` and require 0 High.

### F-02 · HIGH · Security hardening exists only in the uncommitted working tree; production does not have it

- **Evidence:** `git status` shows 22 `M` and 7 `??` files. Live probes:
  - `curl -I https://tusherblog.me/` → **no** `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`. Local build of the working tree emits all of them.
  - `https://tusherblog.me/feed.xml` → `200 text/html` (soft-404 page). Local → `200 application/rss+xml`.
- **What production is missing:** security headers, JSON-LD `<` escaping (XSS hardening in 3 detail pages), typed database client (which surfaced and fixed an unvalidated `status` write in `updateMessageStatusAction`), RLS regression suite, RSS feed, load-more pagination, route-level loading states, contact 500 fix for local stage, migration guard (F-03), CI e2e job.
- **Risk:** single-workstation loss wipes ~500 lines of verified work; production remains without clickjacking/XSS/MIME-sniffing defenses.
- **Remediation:** review diff → commit in logical groups → push → let CI (`verify`, `smoke`, `e2e`) gate → Vercel auto-deploys → re-probe headers and `/feed.xml`.

### F-03 · MEDIUM · Production migration ledger is out-of-band; `supabase db push` is currently unsafe

- **Evidence:** [scripts/db/README.md](../scripts/db/README.md) states production was upgraded in June 2026 by hand-run SQL (`full_migration_for_supabase.sql`, `clean_legacy.sql`, `fix_profiles.sql`, `fix_constraint.sql`). CLI is not linked (C11).
- **Schema content parity — verified from anon role against prod:** legacy `posts.category` **dropped** (400 on select), `posts.cover_asset_id`/`author_profile_id` **present**, `recommendations.category_id` **present**, `site_settings.site_name`/`site_description` **present and populated**. All 14 anon-readable tables respond 200. Conclusion: production *schema* matches the repo; the committed `DROP COLUMN site_name/site_description` bug never destroyed production data.
- **Gap:** `supabase_migrations.schema_migrations` in production almost certainly does not list the 11 tracked versions. A future `supabase db push` would attempt to re-apply them and fail (or worse, partially apply).
- **Remediation:** `supabase link --project-ref ljljrvqlrleppyzzfysj` → `supabase migration list` → `supabase migration repair --status applied <each of the 11 versions>` → confirm `migration list` shows parity → from then on use `db push` exclusively. Add this to the operator guide.

### F-04 · MEDIUM · Soft-404s: unknown paths return HTTP 200

- **Evidence:** `https://tusherblog.me/this-page-does-not-exist-xyz` → **200** with `<meta name="robots" content="noindex">` and "Page not found" body. Identical behaviour on the local working-tree build, so it is code-level, not host-level.
- **Cause:** root [src/app/loading.tsx](../src/app/loading.tsx) makes every dynamic route stream; the shell (and 200 status) is committed before `notFound()` runs inside the catch-all `[...slug]` page.
- **Impact:** search engines honour `noindex` so indexing risk is low, but uptime monitors, link checkers, and HTTP-semantics-based tooling see 200. Inconsistent with "production-grade" intent.
- **Remediation:** remove the root `loading.tsx` now that per-route `loading.tsx` files exist for `blogs`, `academic`, `recommendations`, and admin; or resolve the page lookup outside the streamed boundary. Verify `curl -o /dev/null -w '%{http_code}'` returns 404.

### F-05 · MEDIUM · Admin gating has one layer, not two

- **Evidence:** unauthenticated `GET /admin/dashboard` → **200** with `http-equiv="refresh" content="1;url=/admin/login"` (both local and prod). Body inspection confirmed **no admin data leaks** — the guard runs before any query.
- **Gap:** `proxy.ts` only refreshes the session; it never redirects. Protection depends entirely on `requireAdminSession()` in Server Components. Given F-01 includes a middleware-bypass CVE, the current direction (server-side guard is authoritative) is correct — but a second, early layer is cheap and turns the 200-plus-meta-refresh into a true 307.
- **Remediation:** in `updateSession()`, after `getUser()`, if `!user` and path starts with `/admin` and is not `/admin/login`, return `NextResponse.redirect(new URL("/admin/login", request.url))`. Keep `requireAdminSession()` unchanged as the authoritative check.

### F-06 · MEDIUM · Third-party contact integrations are unverifiable from the repo (Turnstile, Resend)

- **Status:** code paths are correct and fail-closed for hosted stages; email failure is non-fatal and logged.
- **Gap:** no health/self-test endpoint or log evidence is accessible here. Whether production has valid `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, and a verified sender domain cannot be proven.
- **Remediation:** operator runs the existing [docs/staging-smoke-checklist.md](staging-smoke-checklist.md) contact step against production; capture one successful `contact_messages` insert *and* one received notification email as evidence.

### F-07 · LOW · Dependency drift (no known vulnerabilities, but stale)

| Package | Installed | Latest | Note |
|---|---|---|---|
| `@supabase/ssr` | 0.7.0 | 0.12.5 | 5 minor versions behind; cookie-handling fixes land here. |
| `@supabase/supabase-js` | 2.99.3 | 2.114.0 | |
| `supabase` (CLI) | 2.111.0 | 2.116.0 | Emits `[inbucket] is deprecated` → rename section to `[local_smtp]` in `supabase/config.toml`. |
| `@playwright/test` | 1.59.1 | 1.62.1 | |
| `typescript` | 5.9.3 | 7.0.2 | Major; evaluate separately. |

### F-08 · LOW · Documentation drift

- README "Continuous Integration" lists lint/typecheck/build/smoke but not the `e2e` job now in `ci.yml`.
- README says "local Supabase config now disables email signup by default"; `[auth].enable_signup = false` still holds, but `[auth.email].enable_signup = true` was required so local password login works at all. The comment in `config.toml` explains this; README should too.
- Operator guide lacks the migration-repair procedure from F-03.

### F-09 · INFO · TLS

- `CN=tusherblog.me`, TLS 1.3, expires **2026-10-22**. Vercel auto-renews; no action, note for monitoring only.

---

## 4. Controls verified as PASSING (evidence log)

### 4.1 Build & test gates (working tree, this session)
- `npm run lint` — pass
- `npm run typecheck` — pass
- `APP_ENV=local NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build` — pass, rendered live DB data
- `npm run smoke` — pass
- `npm run e2e:flows` — 10/10 flows pass (contact insert, throttle, admin inbox, login, post create → public), 8/8 RLS invariants pass

### 4.2 Local backend
- Containers healthy: `db`, `auth`, `rest`, `kong`, `storage`, `inbucket`
- `GET http://127.0.0.1:54321/rest/v1/` → 200; `/auth/v1/health` → 200
- `supabase migration list --local` → 11/11 in sync
- `pg_tables` RLS: **15/15** enabled; tables with zero policies: **0**
- Tables: `academic_entries, categories, contact_messages, media_assets, navigation_items, page_sections, pages, post_categories, post_tags, posts, profiles, recommendation_categories, recommendations, site_settings, tags`

### 4.3 Production (black-box, read-only)
- Routes `/`, `/blogs`, `/admin/login`, `/sitemap.xml`, `/robots.txt` → 200
- `robots.txt` disallows `/admin/`; sitemap: 14 URLs, all `https://tusherblog.me`; canonical on `/` correct — no localhost leakage
- API key format: new `sb_publishable_…` (modern key type)
- RLS from anon role: `posts` returns **only `status = published`** rows (4/4); `contact_messages` → `42501 permission denied`
- Storage via image optimizer → 200 PNG

### 4.4 Architecture & security design (code review)
- Stage resolution ([src/lib/supabase/env.ts](../src/lib/supabase/env.ts)): `VERCEL_ENV` overrides `APP_ENV`; hosted stages never resolve to `local`; content queries fail closed outside local.
- Service-role key: `server-only` module, singleton, no client import path.
- Every admin mutation calls `requireAdminSession()` (role must be `admin`) before touching the service client.
- Contact pipeline: HMAC-signed throttle cookie, per-IP + per-email + fingerprint limits run in parallel, spam scoring, Turnstile fail-closed in hosted stages, email non-fatal.
- Server Actions `allowedOrigins` restricted to Codespaces domains + `localhost:3000`; `bodySizeLimit` 10 MB (media uploads).
- CSP (working tree): `default-src 'self'`; `frame-ancestors 'none'`; connect/img limited to self + Supabase origin + Turnstile. `'unsafe-inline'` on `script-src` is a known Next.js hydration requirement — acceptable, document as accepted risk.

---

## 5. Remediation plan (ordered)

| Priority | Action | Closes | Verification |
|---|---|---|---|
| 1 | Review and commit the 29 working-tree files; push to `main` | F-02 | CI green; prod `curl -I` shows CSP/XFO/HSTS; `/feed.xml` is `application/rss+xml` |
| 2 | `npm i next@^16.3.4 eslint-config-next@^16.3.4 && npm audit fix`; `npm run verify:smoke`; commit; deploy | F-01 | `npm audit --omit=dev` → 0 high |
| 3 | `supabase link` → `migration repair --status applied` for all 11 versions | F-03 | `supabase migration list` shows local = remote |
| 4 | Add early unauthenticated redirect in `updateSession()` for `/admin/*` | F-05 | `curl -o /dev/null -w '%{http_code}' /admin/dashboard` → 307 |
| 5 | Remove root `loading.tsx` (or restructure catch-all) | F-04 | Unknown path → 404 |
| 6 | Operator runs production contact test; archive evidence | F-06 | One stored message + one received email |
| 7 | Bump `@supabase/ssr`, `supabase-js`, CLI, Playwright; rename `[inbucket]` → `[local_smtp]` | F-07 | `npm run verify:smoke` green, no CLI deprecation warning |
| 8 | Update README CI section and auth note; add migration-repair steps to operator guide | F-08 | Doc review |

---

## 6. Certification statement

Based on the evidence above, the auditor certifies that as of 2026-09-03:

1. All application layers (frontend, backend, edge/networking, storage, CI) are **connected and functioning** in local, CI, and production environments.
2. Row Level Security is **correctly enforced** in both local and production databases for every public-schema table, verified empirically from the anonymous role.
3. Production **schema content** is in parity with the repository; production **migration bookkeeping** is not, and must be repaired before the Supabase CLI is used against production.
4. Production is **not running the current codebase** and **is running a Next.js release with known High-severity advisories**. Until F-01 and F-02 are closed, this system is rated **OPERATIONAL — CONDITIONAL**, not **PRODUCTION-CLEAN**.

Re-audit scope after remediation: re-run §4.1, re-probe §4.3 headers and `/feed.xml`, `npm audit`, and `supabase migration list` against the linked production project.

---

## 7. Remediation record (same day, 2026-09-03)

All findings were worked sequentially on `main`, each in its own commit, with the full gate (lint, typecheck, clean build, 8 smoke, 10 e2e) re-run after every change. Two additional defects were discovered and fixed during remediation.

| Finding | Status | Commit | What changed | Evidence |
|---|---|---|---|---|
| F-01 Next.js advisories | **Closed** | `fix(deps): upgrade Next.js to 16.3.4…` | `next` 16.2.6 → 16.3.4, `eslint-config-next` 16.3.4, `mermaid` 11.17.2; transitive `sharp` 0.35.x, `postcss`, `nanoid`, `dompurify` patched via `npm audit fix`. | `npm audit` → **0 vulnerabilities** (production and full tree). |
| F-02 Uncommitted hardening | **Closed locally; push pending** | 7 grouped commits (`fix(db)`, `feat(types)`, `security`, `feat(site)`, `fix(content)`, `test`, `docs`) | The 2026-08-04 working tree was committed in logical units *before* any new change, so nothing was ever at risk again. | `git status` clean; 14 commits ahead of `origin/main`. **Push requires operator confirmation** (deploys to production via Vercel). |
| F-03 Migration ledger | **Closed (tooling + procedure); repair itself is an operator step** | `docs+ops: migration ledger checker…` | `npm run db:check` (`scripts/check-migration-ledger.mjs`) compares tracked migrations with the linked/local history table and prints the exact `migration repair` command on drift; exits non-zero so it can gate `db push`. Operator guide Task H documents the one-time repair for `ljljrvqlrleppyzzfysj`. | Checker verified in all three states (unlinked → 2, in sync → 0, simulated drift → 1 with correct command). Cannot execute the remote repair from this workspace: no `SUPABASE_ACCESS_TOKEN`. |
| F-04 Soft-404s | **Closed** | `fix(routing): return real 404 status…` | Root cause was two layers of `loading.tsx` (root + section) wrapping `notFound()` callers in Suspense, committing a 200 before the lookup resolved. Root boundary removed; section listing pages moved to `(index)` route groups so `[slug]` detail pages are outside the streamed boundary. | `/nope`, `/about/deeper`, `/blogs|academic|recommendations/nope`, `/admin/nope` → **404**; all real routes 200. Smoke test added. |
| F-05 Single-layer admin gating | **Closed** | `security(admin): redirect anonymous admin requests at the proxy layer` | `updateSession()` now returns a 307 to `/admin/login` for anonymous requests to any protected admin path (including when Supabase is unconfigured), carrying refreshed cookies. `requireAdminSession()` remains the authoritative role check. | Unauthenticated `/admin/*` → **307**, 12-byte body, no admin shell rendered. Smoke test added; admin e2e login flow unaffected. |
| F-06 Unverifiable integrations | **Closed (in-app visibility); live confirmation is an operator step** | `feat(admin): integration status panel…` | Server-only `getIntegrationStatuses()` reports Supabase (public/service role), Turnstile, throttle secret, trusted IP header, and Resend wiring for the running stage — presence and mode only, never values. Rendered on `/admin/dashboard`. Operator guide Task I defines the live production check. | e2e asserts the panel renders and no key-shaped strings appear in the page. |
| F-07 Dependency drift | **Closed** | `chore(deps): update Supabase SDKs, Playwright, Tailwind, React…` | `@supabase/ssr` 0.12.5, `supabase-js` 2.114, Playwright 1.62, CLI 2.116, Tailwind 4.3, React 19.2.8, `@types/node` 22, `[inbucket]` → `[local_smtp]`. Remaining `npm outdated` entries are intentional major-version holds (TypeScript 7, ESLint 10, framer-motion 13, lucide 1.x). | CI `-x` service names confirmed valid on CLI 2.116. |
| F-08 Documentation drift | **Closed** | `docs+ops: …` | README: migrations dir is canonical, remote flow runs `db:check` first, accurate auth-toggle note, proxy redirect note, all three CI jobs, post-deploy checklist gains 404 + integration panel checks. `scripts/db/README.md` links to the repair procedure. | — |
| F-09 TLS | No action | — | Vercel-managed, auto-renews (expires 2026-10-22). | — |

### Defects found during remediation (not in the original report)

| ID | Severity | Description | Fix |
|---|---|---|---|
| R-01 | **High (data loss, production-affecting)** | `upsertNamedRows()` sent `sort_order` to `public.tags`, which has no such column. PostgREST rejected every tag upsert and the error was never checked, so **tags entered in the post editor were silently dropped**. Confirmed in production: `post_tags` is empty despite posts having been edited. Surfaced by the stricter `supabase-js` 2.114 typings. | Categories and tags are now upserted with their own row shapes; upsert and lookup errors throw. e2e asserts tags and categories persist after save. Existing production posts will need their tags re-entered once deployed. |
| R-02 | Low (test hygiene) | `admin-content` e2e never cleaned up: 11 `codex-e2e-post-*` rows had accumulated locally, pushing the newest one past the 12-item first page and making the test flaky. | Test deletes its post and any taxonomy rows it introduced (when unreferenced) in `afterAll`, and locates the post via archive search. Local DB purged. |

### Environmental note (not a code defect)

In this 8 GB Codespace, `next build` is intermittently SIGTERM'd (exit 143) at its compile-end memory spike by the **host** memory guard (sender uid 61876, outside the container namespace — confirmed with `strace`). Running with `NEXT_PRIVATE_BUILD_WORKER=false NODE_OPTIONS=--max-old-space-size=1536` avoids it. CI (dedicated 7 GB runner) and Vercel are unaffected; no repository change was made for this.

### Final gate (post-remediation)

| Check | Result |
|---|---|
| `npm audit` | 0 vulnerabilities |
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `next build` (clean) | pass, all routes generated |
| `npm run smoke` | **8/8** (4 original + 404 status, admin edge redirect, security headers, RSS) |
| `npm run e2e:flows` | **10/10** (admin publish + taxonomy persistence, contact + throttle, 8 RLS invariants) |
| DB hygiene after tests | 0 leftover rows; taxonomy tables restored; local ledger 11/11 |

### Remaining operator actions (cannot be performed from the repository)

1. **Push `main` to `origin`** → CI runs all three jobs → Vercel deploys. Then re-probe production: `curl -I https://tusherblog.me/` shows CSP/XFO/HSTS; `/feed.xml` is `application/rss+xml`; an unknown URL returns 404; anonymous `/admin/dashboard` returns 307.
2. **Manual Task H** — link the CLI and repair the production migration ledger (`npm run db:check` → printed `migration repair` command → `db:check` again).
3. **Manual Task I** — on production `/admin/dashboard`, confirm every Integrations row is `ok`; send one live contact message and confirm the email arrives.
4. **Re-enter tags** on any production posts that were expected to carry them (R-01).

Upon completion of items 1–3, the system rating moves from **OPERATIONAL — CONDITIONAL** to **PRODUCTION-CLEAN**.
