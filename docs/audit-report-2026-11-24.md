# End-to-End System Audit — website-blogs

| Field | Value |
|---|---|
| Audit date | 2026-11-24 |
| Scope | Frontend, admin workflows, accessibility, SEO, performance, architecture, dependencies, Supabase Postgres/Auth/Storage/RLS, CI/CD, migrations, and local/CI connectivity |
| Repository | `M-F-Tushar/website-blogs` @ `bedf421` |
| Environment | Local production build plus local Supabase; **no production or remote-platform access** |
| Method | Static review, migration and type comparison, SQL/RLS inspection, Playwright, axe-core, Lighthouse, dependency audit, and focused black-box probes |
| Baseline gates | Lint pass; typecheck pass; build pass; smoke 8/8; e2e 10/10; local migrations 11/11 |

## 1. Executive verdict

| Layer | Status | Summary |
|---|---|---|
| Dependency supply chain | **FAIL** | Current `main` has 1 critical, 4 high, 7 moderate, and 3 low npm advisories. Next.js 16.3.4 has multiple request-time advisories. |
| Security, auth, and RLS | **CONDITIONAL** | RLS is enabled on every table, but any authenticated profile can promote itself to `admin`. Two service-role/contact boundaries are also bypassable. |
| Functional workflows | **CONDITIONAL** | Core public and admin flows pass, but top-level draft controls are masked by fallback data, media cannot be deleted, and common validation errors replace the editor with a generic outage page. |
| Accessibility | **CONDITIONAL** | Public landmarks, keyboard focus, 320 px reflow, and contact labels pass. The post editor has unnamed controls; admin landmarks and contrast need repair. |
| SEO | **PASS WITH LOW FINDINGS** | Titles, canonicals, sitemap, RSS, and draft filtering work. RSS autodiscovery, admin `noindex`, social image, and structured-data completeness need improvement. |
| Performance | **FAIL ON MEASURED CWV** | `/blogs` has reproducible CLS 0.509. Mobile LCP/TBT fail the good thresholds because of eager route prefetch and broad hydration. |
| Architecture and content ownership | **CONDITIONAL** | The platform is database-driven in principle, but several visible sections, narrative fields, and portfolio signals are not represented or rendered. |
| CI and migrations | **PASS WITH GAPS** | Clean reset, migration diff, and generated types pass. CI does not gate dependency, schema, or type drift and its workflow supply chain is not pinned. |

**Overall rating: not release-clean.** Baseline behavior is healthy, but the current dependency set and profile-role privilege escalation are release blockers. The audit is local-only, so production deployment, hosted integration, TLS, remote migration-ledger, and data-backfill status remain operator checks.

## 2. Controls verified

- All 15 public-schema tables have RLS enabled; anonymous draft/contact/profile/storage mutations are denied.
- Every privileged admin action observed in scope checks `requireAdminSession()` before obtaining the service-role client.
- The service-role key is absent from the 131 scanned `.next/static` files.
- Markdown is sanitized, JSON-LD escapes `<`, Mermaid uses strict mode, and no rendered XSS payload executed in the probes.
- Public unknown paths return 404; anonymous `/admin/dashboard` requests return 307.
- Security headers, RSS, sitemap, canonical handling, admin publish/revalidation, taxonomy persistence, and contact throttling pass locally.
- A clean local reset applied all 11 tracked migrations and the seed. `supabase db diff` found no drift, and generated database types matched the repository.
- Smoke tests passed 8/8; end-to-end tests passed 10/10, including 8 RLS invariants.
- Static assets use immutable caching, public HTML is gzip-compressed, fonts self-host through `next/font`, and Mermaid is loaded dynamically only when rendered.

## 3. Release-blocking findings

### A-01 · Critical · Direct dependencies and framework advisories have regressed

Current Next.js 16.3.4 is in the advisory range for request-time framework, image-optimizer, and Server Action defects. Zod, Sharp, source-map processing, DOMPurify, KaTeX, and lint transitive packages also have fixes available.

- Root findings: `DEP-01`–`DEP-05`, `SEC-02`, `SEC-03`, `PRI-01`, `INF-01`
- Evidence: `package.json`, `package-lock.json`; `npm audit` reported 15 total advisories and 7 production advisories.
- Required fix: update Next/eslint config, Zod, Mermaid, and safe transitives; regenerate the lockfile; add an audit gate and dependency automation.

### A-02 · High · Authenticated users can grant themselves admin privileges

The `authenticated` role has column-level `UPDATE` on `profiles.role`, and the self-update policy does not exclude that column. A disposable non-admin user changed its role to `admin`, then obtained admin-route, private-message, and storage access.

- Root finding: `SEC-01`
- Required fix: revoke broad profile updates, grant only safe columns, reject role changes in SQL, and expose promotion only through a privileged server boundary.

### A-03 · High · Contact boundaries and abuse controls do not all fail closed

The contact writer is exported from a `"use server"` module as an unguarded service-role mutation, accepts caller-supplied IP/user-agent values, and performs rate-limit reads without checking database errors. Chunked request bodies bypass the size check, malformed JSON returns 500, and an invalid submission consumes the proxy cooldown. A missing trusted-IP header is still displayed as an `ok` integration.

- Root findings: `SEC-04`, `SEC-05`, `CQ-01`, `CQ-04`, `FUN-03`, `INF-08`
- Required fix: move contact persistence into a server-only service, derive identity only in the route/proxy, bound the streamed body, fail closed on anti-abuse query errors, emit safe errors/logs, and correct the retry/status behavior.

### A-04 · High · Spoofed images reach the public storage/image pipeline

The upload action trusts `file.type` and the filename extension. An SVG carrying a PNG MIME value was stored publicly as `.svg`, which exposes the same path consumed by the vulnerable Next image optimizer.

- Root findings: `SEC-02`
- Required fix: inspect file signatures, reject SVG, derive extension and MIME from bytes, and add a regression test alongside the Next/Sharp update.

## 4. Important quality and reliability findings

| Root cause | Related audit IDs | Planned disposition |
|---|---|---|
| Unchecked Supabase/auth/query errors fabricate empty, zero, anonymous, or successful states | `CQ-01` | Fix reads, writes, taxonomy, archive, and anti-abuse paths in small ownership groups |
| Admin Zod validation and normal action failures replace the editor with a generic backend outage | `FUN-01`, `CQ-03` | Add typed action state, field errors, pending state, and a neutral error boundary |
| Connected-but-draft top-level pages are masked by local fallback content | `FUN-02`, `CQ-08` | Restrict fallback to explicitly unconfigured local mode and add draft 404 regression coverage |
| Contact E2E fixtures leak and important admin workflows have no regression coverage | `CQ-05`, `FUN-08` | Add deterministic cleanup and focused failure/CRUD tests |
| Admin media library cannot remove metadata or Storage objects | `FUN-04` | Add guarded deletion with reference checks and rollback/error reporting |
| Admin responses lack crawler blocking; RSS metadata is dropped on public pages; detail structured data lacks local identity | `SEO-01`–`SEO-04` | Fix route metadata and JSON-LD |
| 404 responses carry canonical and `og:url` for nonexistent pages | `SEO-05` | Allow metadata generation without a canonical |
| CI actions are mutable-major pinned and the workflow has no least-privilege permissions, concurrency, or verify timeout | `INF-02`, `INF-09` | Pin reviewed SHAs, add `contents: read`, concurrency, and timeout |
| CI does not continuously detect schema/generated-type drift or a misleading ledger-only safety result | `INF-04`, `INF-05` | Add type/schema checks and make the ledger checker state its limited guarantee |
| Navigation seed reruns can duplicate rows; stale legacy SQL remains operator-runnable | `INF-06`, `INF-07` | Add natural uniqueness/idempotency and archive the legacy SQL safely |
| Fallback/theme loading uses incompatible state keys and no-flash behavior is ineffective | `CQ-09` | Unify theme bootstrap/storage/class handling |

## 5. Accessibility findings

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| `A11Y-01` | High | Post Markdown textarea and media selector have no accessible names | Fix in code and test with axe/Playwright |
| `A11Y-02` | Medium | Fixed footer and sky-button colors fail contrast in at least one theme | Use background-independent foreground tokens |
| `A11Y-03` | Medium | Admin has no `main`/`nav` landmarks and multiple H1s | Correct document structure |
| `A11Y-04` | Medium | Failed login is not announced or focused | Add an alert and focus handling |
| `A11Y-05` | Low | Archive cards skip H1 to H3 | Add an H2 boundary or semantic heading level |
| `A11Y-06` | Low | Theme control does not announce its state | Add state-specific naming or `aria-pressed` |

## 6. Performance findings

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| `PERF-01` | High | `/blogs` CLS is reproducibly 0.509 because a tiny streamed fallback is replaced by the full list | Match skeleton geometry or make the ISR shell non-streaming |
| `PERF-02` | High | Mobile LCP/TBT misses thresholds because broad shell hydration and script work dominate the critical path | Reduce client boundaries and hydration work |
| `PERF-03` | Medium | Global `Link` prefetches fetch other route RSC/script payloads on first load | Disable speculative prefetch on global/listing links |
| `PERF-04` | Medium | Monolithic CSS plus persistent blur/nebula effects cost mobile render time | Reduce effects on mobile and preserve only necessary CSS |
| `PERF-05` | Medium | Listing search receives every full Markdown body and has no server/cursor boundary | Requires archive/query product decision; track separately |
| `PERF-06` | Low | Query sort does not match partial index order | Add matching partial composite indexes |
| `PERF-07` | Info | Future Markdown/cover images can bypass optimization or duplicate downloads | Correct image renderers and cover glow when media is available |

## 7. Product and content findings

These are not security defects and should not be “fixed” by inventing content.

| ID | Severity | Finding | Status |
|---|---|---|---|
| `PRD-01` | High | Five visible database sections are saved in admin but never rendered publicly | Product decision required on page composition |
| `PRD-02` | Medium | Template sections are labeled unsupported and the save form can silently change their type | Fix in admin form |
| `PRD-03` | High | Builds, tools, and chronological progression are not modeled or evidenced | Product/data-model decision required |
| `PRD-04` | Medium | Personal narrative, timeline fallback, and editorial copy remain hardcoded | Content contract decision required |
| `PRD-05` | Medium | Empty/loading/error states misrepresent the actual condition | Code-level state distinctions and route skeletons |

## 8. Other open code and functional findings

- `FUN-04`: add authenticated media deletion with object/metadata cleanup.
- `FUN-05`: expose the public theme toggle on mobile.
- `FUN-06`: add empty states to five admin collections.
- `FUN-07`: add missing public route/detail loading states.
- `CQ-02`: derive row contracts from generated database types and remove duplicated casts.
- `CQ-06`: remove unreachable Framer Motion/component/helper code.
- `CQ-07`: split oversized content-action/query/page ownership boundaries in behavior-preserving steps.
- `SEO-03`: supply and configure an authoritative default social image as an operator/content task.
- `INF-10`: use `npx supabase` or package scripts in README commands.

## 9. Production/operator-only carryover

The local audit cannot close these items:

1. Confirm the merged commit is the current production deployment and re-check CSP, RSS, true 404, anonymous admin 307, and the served Supabase project reference.
2. Audit/restore expected production `post_tags` associations.
3. Link the authorized production project, inspect `db diff`, and repair the migration ledger only after confirming the SQL objects already exist.
4. Verify Vercel Production variables, Integration panel status, live Turnstile, and one end-to-end Resend notification.
5. Confirm the current TLS certificate and automatic renewal.

## 10. Remediation order

1. Dependency/security release blockers: A-01, SEC-01, image signature validation, contact service boundary, bounded body handling, and anti-abuse fail-closed behavior.
2. Correctness/data safety: unchecked Supabase errors, action form state, fallback masking, test cleanup, and media deletion.
3. Accessibility and SEO: editor labels, contrast, landmarks, login alerts, noindex, RSS alternate, structured data, and 404 canonical behavior.
4. Performance: loading geometry, client-boundary/prefetch reductions, CSS/decorative effects, and matching indexes.
5. CI/ops hygiene: audit gate, dependency automation, action pinning, schema/type drift gates, safe seed and legacy SQL handling.
6. Product decisions: visible section composition, portfolio entities, authoritative narrative, and archive/search scaling.

## 11. Final gate

The remediation gate requires `npm audit` to be zero, lint/typecheck/build to pass, smoke and e2e to pass, no fixtures to remain, and axe to report no audited violations. The production dependency and operator-only checks cannot be completed without authorized hosted access.

Production/field Core Web Vitals, current host configuration, remote RLS/data, and production integrations remain outside the scope of local certification.

## 12. Remediation record

The code-level security, correctness, accessibility, SEO, database, CI, and dependency blockers found above were remediated on 2026-11-24. Product-only and authorized hosted-environment items were not resolved by inventing content or credentials.

| Area | Result after remediation | Verification |
|---|---|---|
| Dependencies | **Closed.** Next 16.4.6, patched Sharp/Zod/DOMPurify/KaTeX transitives, Mermaid 12.3, supported React/Supabase/Playwright minors, Node engine >=22.12. | `npm audit` and production-only audit: 0 |
| Profile privilege escalation | **Closed.** Forward migration limits profile columns, rejects role changes outside the service role, and adds regression coverage. | 9 RLS tests pass, including authenticated self-promotion denial |
| Contact boundary and body limits | **Closed.** Contact persistence is server-only, identity is server-derived, streamed bodies are bounded, PII is not logged, and invalid requests can be retried. Rate checks and insertion now run in one locked database RPC; emails are canonicalized before limits are evaluated. | 4 contact security/flow tests pass, including chunked/malformed/oversize and 7-request concurrent-burst cases |
| Upload spoofing | **Closed.** Media type/extension comes from file signatures; SVG is rejected regardless of declared MIME. An atomic RPC checks every media foreign-key relation and reserves/deletes metadata before Storage removal. | Declared-PNG SVG rejected; page-referenced PNG deletion is blocked; unreferenced PNG is deleted through admin |
| Admin correctness and UX | **Closed for audited flows.** Supabase errors are checked, action errors remain inline with values, normal content actions have pending/error states, drafts are not masked when Supabase is configured, and collections have empty states. Post and taxonomy writes now share one transaction. | Login, publish, taxonomy persistence, validation preservation, contact, media, and cleanup E2E pass |
| Accessibility | **Closed for the audited route matrix.** Editor names, contrast, landmarks/headings, login alerts, archive hierarchy, and theme state are corrected. | 0 axe WCAG 2.2 A/AA violations on public light/dark routes plus login/dashboard/post editor |
| SEO | **Closed for code-level findings.** RSS autodiscovery, admin `noindex`, detail JSON-LD identity, and 404 canonical handling are corrected. Unsupported external Markdown images are rendered as links rather than bypassing CSP. | Smoke assertions for metadata/headers/RSS/image fallback and axe route matrix pass |
| Performance | **Critical CLS fixed; mobile remains measurable.** The listing loader no longer causes a 0.509 shift, route prefetch is disabled on global/content links, client hydration and mobile effects are reduced, images are optimized, and indexes match sort. | `/blogs`: desktop Lighthouse 99, LCP 0.76s, CLS 0, TBT 49ms; mobile repeat CLS 0, but LCP 3.17–3.62s and TBT 622–1,022ms remain host-simulated above the good thresholds |
| CI and migration safety | **Closed locally.** Least privilege, SHA pinning, concurrency, dependency audit, schema/type drift gates, Dependabot, navigation uniqueness, index/RPC migrations, and non-executable legacy SQL policy are in place. | CI YAML validation, `db:types`, `db:diff`, clean 13-migration reset, and 0 audit pass |
| Product coverage | **Open by design.** Rendering the five advertised support sections and adding first-class builds/tools/progression data require content/product decisions. | Tracked in `PRD-01`, `PRD-03`, and `PRD-04`; do not invent evidence |
| Hosted/operator state | **Unverified.** Production deployment, tags, migration ledger, integrations, TLS, and current Vercel/Supabase variables still require owner access. | Remaining operator checklist in section 9 |

### 12.1 Residual security decision

Admin session establishment is now server-side and the Supabase token cookie is HttpOnly. The CSP still permits inline scripts/styles because Next.js currently emits framework hydration/bootstrap scripts and this site retains static/ISR rendering; forcing nonce-based rendering would make every public page dynamic. The token-exfiltration finding is closed, but the inline-script allowance remains an explicit defense-in-depth tradeoff to revisit if the platform moves to nonce rendering.

## 13. Final local verification

| Check | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass (webpack memory-optimized single-worker build) |
| `npm run smoke` / final equivalent | 14/14 pass |
| `npm run e2e:flows` / final equivalent | 19/19 pass |
| WCAG 2.2 axe matrix | Pass; 0 violations on audited public/admin routes |
| `npm audit` and `npm audit --omit=dev` | 0 vulnerabilities |
| `npm run db:types`, `npm run db:diff` | Pass; generated types and local schema match |
| RLS | 15/15 public tables enabled in the local audit; 9 RLS tests pass |
| Test hygiene | 0 post, contact, media-row, or storage-object fixtures remain |

**Final local rating: release candidate with operator prerequisites.** Security and correctness release blockers are closed in the repository. Production cannot be certified without the section 9 checks. The remaining local mobile Lighthouse variance and the full-archive data-shaping/product work should be addressed through real preview/field measurements and an explicit query/pagination design rather than a speculative shortcut.
