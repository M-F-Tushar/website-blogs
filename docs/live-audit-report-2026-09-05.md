# End-to-End Live Audit: September 5, 2026

## Outcome

**Testing completed; the application is not all-green.** The final consolidated
run executed **65 Chromium tests: 58 passed, 7 failed, 0 skipped**.
Five failed cases reproduce three confirmed issues described below. Two additional
cases were interrupted by browser/runtime failures, not proven application defects.
A focused recheck passed the post lifecycle; navigation and the deployed desktop
sweep remained interrupted by Chromium crashes. These are not counted as passes.
No application fixes, migrations, production writes, commits, or deployments were made.

- Local source revision: `45f6c7bd0cbb6bbd1e433eda96f197c5cedc9b4f`.
- Final run started: `2026-09-05T05:51:26.783Z`; duration: 877.734 seconds.
- Local app: `http://127.0.0.1:3215`, built Next.js app, `APP_ENV=local`.
- Backend: real Supabase Auth, Postgres, RLS, and Storage at `http://127.0.0.1:54321`.
- Hosted target: `https://tusherblog.me`, public read-only requests only.
- Public browser widths: 1440px desktop and 390px mobile emulation.
- Lint and TypeScript checks passed after the final fixture changes.

This is a full-stack functional audit, not proof that every possible state or
component works. Local writes verify real persistence, not mocked success. Hosted
authentication, mutations, database configuration, CAPTCHA, and email delivery are
outside the verified scope.

## Findings

### LIVE-01: Listing-Page Main Headings Do Not Reach The Public Site

Severity: medium. Confirmed locally on Blogs, Academic, and Recommendations.

Reproduction:

1. Open the corresponding admin page editor and select its hero section.
2. Change **Main heading** to a unique value and click **Save section**.
3. Read the section through the service-role client: `page_sections.heading` contains the new value.
4. Open the corresponding public page in a separate anonymous browser context.
5. The heading remains unchanged; the saved value is absent.

The public rendering paths use `settings.heroTitle`, page title, or template fallback
values instead of the edited `heading` field:

- [Blogs heading selection](../src/app/(public)/blogs/(index)/page.tsx#L38)
- [Academic heading selection](../src/app/(public)/academic/(index)/page.tsx#L41)
- [Recommendations heading selection](../src/app/(public)/recommendations/(index)/page.tsx#L47)
- [Admin Main heading input](../src/components/admin/admin-managed-page-workspace.tsx#L521)

All three database saves succeed. Their separate SEO title checks also pass.
Original page metadata and section values were restored and verified.

Suggested remediation: define one explicit heading contract between the page editor
and public renderers, with intentional precedence for legacy settings; retain these
tests to prove that the field presented to admins actually controls the public heading.

Evidence: the three failed cases in [page-editors.spec.ts](../tests/live/page-editors.spec.ts).

### LIVE-02: Local Uploaded Cover Image Fails Optimization

Severity: medium for local full-stack operation; hosted impact not demonstrated.

Reproduction:

1. Upload a valid PNG through `/admin/media` into `site-public`.
2. Verify the `media_assets` row and download the actual stored object.
3. Create a published post using the uploaded image in the media picker.
4. Verify `posts.cover_asset_id` references the uploaded asset.
5. Open the post anonymously: the image element is present but `naturalWidth` remains zero.

Direct anonymous storage download returns HTTP 200 and byte-for-byte identical PNG
data. The Next.js `/_next/image` request for the loopback storage URL returns HTTP
400; a focused probe returned `"url" parameter is not allowed`.

This identifies the local optimizer/configuration boundary, not an upload or database
failure. Review [image configuration](../next.config.ts#L8) and the installed Next.js
optimizer's local-address restrictions. Do not weaken hosted image security globally
as a workaround for a loopback test environment.

Private upload, authenticated object download, anonymous storage rejection, and
private media-row hiding all passed within the same test after the soft image assertion.
All uploaded objects and rows were removed. Hosted public images decoded successfully.

Evidence: [media workflow](../tests/live/workflows.spec.ts#L54) and its retained
`published-cover.png` and failure trace in the HTML report.

### LIVE-03: Deployed Footer Sitemap Link Generates Failed Prefetches

Severity: low. Confirmed on the deployed desktop sweep.

Scroll until the footer is visible. Its Next.js `Link` to `/sitemap.xml` triggers
requests such as `/sitemap.xml?_rsc=...`, which return HTTP 404. An earlier completed
desktop sweep recorded six such failed requests; the final sweep reproduced the
issue before its browser crashed. Direct `/sitemap.xml` returns valid XML
with HTTP 200; the public pages themselves all loaded successfully.

The [footer sitemap link](../src/components/site/site-footer.tsx#L149) uses client
page navigation for an XML endpoint. Prefer an ordinary anchor for the sitemap,
then verify the failed prefetch requests disappear. No production mutation is needed
to reproduce this finding.

Evidence: [deployed sweep](../tests/live/deployed.spec.ts) and its
failure trace. The mobile sweep passed and retains its `deployed-observations` attachment.

### Runtime Interruptions And Rechecks

An earlier clean-isolation full run at `05:09:56Z` completed with 60 passes and the
five known failed cases. While validating the npm entry point, Playwright's `--list`
overwrote its generated reports. The config now uses only the list reporter during
discovery; a byte-for-byte check confirms discovery no longer changes HTML/JSON evidence.

The retained full rerun at `05:51:26Z` had two additional failures: a page crash while
clicking **Archive post**, and `net::ERR_ABORTED` while reopening navigation. The
desktop deployed sweep also crashed during a screenshot after reproducing LIVE-03.

A separate three-test recheck preserved the full-run evidence. The complete post
lifecycle passed. Navigation then failed with `Page crashed` while awaiting its save
redirect; the desktop sweep failed with `Target crashed` during scrolling. The cause
of browser instability was not established. Earlier navigation and desktop checks
completed, but their repeatability is not verified; further reruns were stopped.

Playwright reports zero `flaky` because automatic retries are disabled. This does
not mean the audit was stable across separate executions.

## Coverage Matrix

| Area | Verified behavior | Result |
| --- | --- | --- |
| Local public pages | Home, About, Blogs, Academic, Recommendations, Contact at both widths; HTTP status, heading, image decoding, overflow, uncaught exceptions | Passed |
| Local detail pages | All four database-listed published detail paths at both widths | Passed |
| Admin routes | 18 authenticated routes load, including dashboard, all content editors, navigation, media, messages, SEO, settings | Passed |
| Login and session | Valid login, wrong-password rejection, refresh persistence, logout, anonymous redirects | Passed |
| Authenticated non-admin | Editor role denied five protected routes and post insertion through Supabase | Passed |
| Posts | Real-button draft save, body persistence, publish, anonymous detail/list visibility, category/tag persistence, title edit, archive, anonymous hiding | Passed focused recheck; browser crash in final full run |
| Academic entries | Draft, publish, body/SEO/external-link rendering, listing visibility, edit, archive, anonymous hiding | Passed |
| Recommendations | Draft, publish, body/SEO/external-link rendering, listing visibility, edit, archive, anonymous hiding | Passed |
| Settings | Footer change persisted and rendered publicly; SEO edit link worked; original settings restored | Passed |
| Navigation | Create, click through publicly, hide, show, delete, database and public-state checks | Passed earlier; latest full run/recheck interrupted, repeatability inconclusive |
| Page sections | Selected visible Home, About, and Contact section heading changes; all six page SEO titles | Passed |
| Listing-page sections | Blogs, Academic, Recommendations Main heading saves and public propagation | Failed: LIVE-01 |
| Quick contact links | Settings and section synchronization, public email/location, restoration | Passed |
| Media | Public/private upload, metadata, stored bytes, public download, private download denial, picker association | Passed |
| Uploaded public cover | Optimized image actually decodes in the anonymous public page | Failed locally: LIVE-02 |
| Contact | Actual submit button, database row, inbox visibility, reviewed status persistence, anonymous privacy, duplicate throttling, empty-input rejection | Passed locally |
| Browse controls | Header navigation at both widths, search/no-results/reset, grid/list selection, sort selection without item loss, detail navigation | Passed |
| Pagination | 13 test posts, 12 initial cards, Load more, search resets pagination | Passed |
| Theme and search | Theme state survives reload; header search opens archive search | Passed |
| RLS | Eight existing anonymous invariants: drafts, soft deletes, unreferenced taxonomy, private media, profiles, messages, post writes, settings updates | Passed |
| HTTP endpoints | Anonymous admin redirects, real missing-page 404s, RSS, sitemap, local robots disallow, security-header presence | Passed |
| Deployed public site | 14 distinct paths at both widths; page statuses, canonical origin, images, overflow, uncaught exceptions | Earlier sweep completed; final mobile passed, desktop interrupted |
| Deployed resources | Same-origin resource errors during desktop scroll | Failed: LIVE-03 |

The suite contains grouped tests: one test can exercise multiple routes or assertions.
The completed deployed sweeps made 15 visits per viewport because the root URL appears both
with and without a trailing slash; that is **14 distinct paths**, not 15 pages.
No missing public custom pages were invented: the local database had only the six
top-level pages and four published content detail paths.

### Authenticated Routes Visited

`/admin`, `/admin/dashboard`, `/admin/content/pages`, `/admin/content/home`,
`/admin/content/about`, `/admin/content/blogs`, `/admin/content/academic-page`,
`/admin/content/recommendations-page`, `/admin/content/contact`,
`/admin/content/contact/advanced`, `/admin/content/posts`, `/admin/content/academic`,
`/admin/content/recommendations`, `/admin/navigation`, `/admin/media`,
`/admin/messages`, `/admin/seo`, `/admin/settings`.

### Deployed Detail Paths Visited

- `/blogs/python-ml-pipeline-lessons`
- `/blogs/understanding-gradient-descent`
- `/blogs/building-ai-learning-system`
- `/academic/paper-reading-workflow-for-ml-and-llm-topics`
- `/academic/notes-attention-is-all-you-need`
- `/academic/paper-reading-workflow-ml-llm`
- `/recommendations/ai-engineering`
- `/recommendations/hands-on-machine-learning-book`

These are in addition to the six top-level public pages.

## Cleanup And Safety

All writes were restricted to loopback Supabase. Temporary admin/editor accounts used
random credentials; production browser requests were restricted to GET/HEAD/OPTIONS.
The hosted site received no login, contact submission, upload, or content change.

Final independent cleanup checks compared all 13 audited tables with the pre-run
baseline using row counts and SHA-256 hashes of full row content excluding
`updated_at`. Every table matched:

- `site_settings`: 1; `pages`: 6; `page_sections`: 28; `navigation_items`: 8.
- `posts`: 2; `academic_entries`: 1; `recommendations`: 1.
- `categories`: 6; `tags`: 4; `recommendation_categories`: 3.
- `media_assets`: 0; `contact_messages`: 20; `profiles`: 1.

The original auth user ID set was restored. Both `site-public` and `site-admin`
storage buckets were empty. Settings, metadata, sections, and navigation were
restored; routine update timestamps may differ. The existing 20 contact messages
were preserved, not deleted as test debris.

The homepage and blog archive were checked again after cleanup and contained no
audit-only content. Database-only cleanup does not invalidate Next.js caches, so
the fixture now triggers revalidation through a temporary hidden navigation item
and the existing admin delete action at setup/teardown. Earlier stale-cache failures
and fixture setup failures are superseded by the final consolidated run, not counted
as application defects. Five accounts left by a failed fixture setup were explicitly
removed before the final run and baseline verification.

## Evidence And Reproduction

- [Live audit configuration](../playwright.live.config.ts)
- [Browser tests and fixtures](../tests/live)
- [Final HTML report](../playwright-report/live/index.html)
- [Final machine-readable results](../test-results/live-summary.json)
- [Screenshots and retained failure traces](../test-results/live)
- [Focused runtime recheck results](../output/live-audit-recheck.json)
- [Focused recheck traces](../test-results/live-recheck)
- [Cleanup certificate](../output/live-audit-cleanup.json)
- [Non-secret baseline hashes](../output/live-audit-baseline.json)

Generated evidence is ignored by Git and remains in this workspace. Failure traces
can contain session/network information; do not publish raw traces without reviewing
them. Temporary local accounts have been deleted.

Prerequisites: installed dependencies/Chromium, running local Supabase with the tracked
schema and representative local content, and matching URL/anon/service-role variables
in the ignored `.env.local`. The audit creates its own test accounts. It does not
reset the database or initialize an empty backend, and it temporarily changes existing
local settings; run without concurrent content editing.

```bash
npm run test:live
npx playwright show-report playwright-report/live
```

The default command builds and starts the app on port 3215. To use the already-running
audited local server, run `LIVE_REUSE_SERVER=1 npm run test:live`.
To omit production reads, use `npm run test:live -- --grep-invert "deployed public"`.
The final audit exits non-zero because confirmed defects and runtime interruptions remain.

## Limits

- Hosted admin login/writes, remote schema and migration ledger, hosted RLS and private storage were not tested in this run.
- Real Turnstile challenges, domain configuration, Resend delivery, and receipt in a mailbox were not verified. Local contact persistence was verified separately.
- Chromium mobile viewport emulation is not Safari/iOS or Firefox coverage. Admin routes were swept at desktop size, not exhaustively on mobile.
- Page visits and representative edits do not cover every field, JSON setting, markdown toolbar action, TOC/copy/share control, or all keyboard/accessibility states.
- Search, view modes, pagination, and sort control selection were exercised; full sorting-order semantics and every category/type filter combination were not exhaustively asserted.
- New custom-page creation, every content deletion path, all upload validation limits, session expiry/recovery, and backend outage behavior remain untested.
- No load, concurrency, penetration, WCAG, backup/restore, or email reliability certification is implied.
- Browser crashes blocked repeat confirmation of navigation and the desktop deployed sweep. Their cause remains unverified.
- Full-page screenshots showed pale areas below the viewport with the fixed background. A normal deployed scrolled-viewport screenshot rendered correctly; this was not classified as a confirmed contrast defect.

Recommended next work: fix LIVE-01 first, then local optimizer compatibility and the
sitemap link; rerun the existing failing cases before repeating the full suite.