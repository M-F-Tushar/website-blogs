# Execution Roadmap

This document turns the repository audit into an execution sequence we can follow one task at a time.

How to use this roadmap:
- Start with Task 1 and do not begin the next task until the current one is verified.
- For every task, complete all code work, run all listed verification steps, and then complete any matching manual steps from [`docs/manual-operator-guide.md`](./manual-operator-guide.md).
- If a verification step fails, stop and fix that task before moving forward.

## Operating Rules

1. Work on one task only.
2. Finish the task end to end.
3. Verify locally after each change.
4. Verify staging behavior before production.
5. Keep production impact in mind for every decision.

---

## Task 1: Harden The Delivery Pipeline

### Why this comes first
Right now the repository has a build-quality CI gate, but not a true end-to-end pipeline. That means production-facing regressions can slip through even when CI is green.

### Goal
Create a reliable pipeline that proves the public site, key user flows, and staging deployment are healthy before production release.

### Expected outcome
- CI still runs `lint`, `typecheck`, and `build`
- automated browser smoke tests exist
- staging has a repeatable validation path
- production release risk goes down

### Code work
1. Add browser test tooling for smoke tests.
2. Create smoke tests for:
   - homepage loads
   - blog archive loads and search works
   - about page loads
   - contact page loads
3. Add a CI job for smoke tests.
4. Make sure smoke tests use safe non-production configuration.
5. Keep the existing build gate intact.

### Verification
Run these after implementation:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run smoke:install
npm run smoke
```

### Manual work
For the current CI implementation, no manual work is required.

Use Manual Task A or Manual Task B later only if we add true GitHub-driven staging checks or update deployment settings.

### Definition of done
- local verify passes
- smoke tests pass locally
- CI runs the new smoke step
- the smoke step is documented in the repo

---

## Task 2: Fix The Contact Flow End To End

### Why this is next
Contact is a real production feature. If it fails, visitors lose trust and leads disappear.

### Goal
Make the contact form work in local, staging, and production with a valid anti-abuse flow.

### Expected outcome
- Turnstile works with the correct keys
- the submit button becomes usable in valid environments
- valid messages are stored successfully
- throttling and abuse checks still work

### Code work
1. Review the current contact form loading logic.
2. Confirm the correct Turnstile environment behavior for local, staging, and production.
3. Add safer handling for environments where Turnstile is misconfigured.
4. Test the contact API route with valid data.
5. Confirm the success response, error response, and throttle behavior.

### Verification
Run these after implementation:

```bash
npm run lint
npm run typecheck
npm run build
```

Then verify in the browser:
1. Open `/contact`
2. Fill the form
3. In local mode, confirm the local-mode notice appears and submit without Turnstile
4. In staging or production, complete Turnstile
5. Submit successfully
6. Confirm the message appears in admin
7. Submit twice quickly and confirm throttling

### Manual work
Use these sections in [`docs/manual-operator-guide.md`](./manual-operator-guide.md):
- Manual Task C
- Manual Task D

### Definition of done
- no blocking Turnstile failure in the intended environment
- message submission succeeds
- throttle behavior still works
- staging smoke checklist is updated if needed

---

## Task 3: Remove Fake Or Incomplete Public CTAs

### Why this matters
The site currently invites newsletter signup, but the feature is not real yet. That creates trust damage.

### Goal
Either implement a real newsletter flow or remove the fake signup experience until it is production-ready.

### Expected outcome
One of these is true:
- newsletter subscription really stores data and confirms success
- or the CTA is replaced by honest copy and a real alternative action

### Code work
1. Decide whether newsletter will be implemented now or deferred.
2. If implementing now:
   - add backend storage or provider integration
   - add validation and success state
   - test the flow
3. If deferring:
   - remove misleading subscribe behavior
   - replace with an honest CTA such as contact or follow links

### Verification
Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Then verify in browser:
1. Test the CTA from homepage
2. Test the CTA from footer
3. Confirm the result is real and understandable

### Manual work
None if we choose to remove the fake newsletter CTA for now.

Use Manual Task E later only if we decide to implement a real newsletter provider.

### Definition of done
- no fake "coming soon" user journey remains on the public site
- the replacement flow is honest and production-safe

---

## Task 4: Redesign The Homepage For Stronger Engagement

### Why this comes after reliability work
The homepage is the main attraction problem, but we should improve trust-critical flows first.

### Goal
Make the homepage feel clearer, more human, and more attractive without hurting performance or maintainability.

### Expected outcome
- stronger first impression
- clearer explanation of what the site is about
- better path into blogs, academic notes, and recommendations
- less empty space and less repeated card treatment

### Design direction
- reduce oversized empty hero space
- introduce a strong visual anchor
- make the first screen explain the site in seconds
- create clearer content paths
- keep motion subtle and purposeful

### Code work
1. Rework hero composition.
2. Add a stronger visual anchor.
3. Clarify the homepage content hierarchy.
4. Create separate featured paths for:
   - blog writing
   - academic work
   - recommendations
5. Remove or reduce repeated decorative card styling where it hurts scanning.

### Verification
Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Then verify:
1. desktop screenshot review
2. mobile screenshot review
3. homepage loads with no console errors
4. links to major sections are obvious

### Manual work
Use these sections in [`docs/manual-operator-guide.md`](./manual-operator-guide.md):
- Manual Task F

### Definition of done
- the homepage has one clear visual story
- a first-time visitor can identify the site purpose quickly
- mobile and desktop both feel intentional

---

## Task 5: Improve Mobile Navigation And Browse Experience

### Why this matters
The current mobile navigation works, but it is not effortless. Important actions are also less visible on smaller screens.

### Goal
Make navigation simpler and more obvious on phones and smaller tablets.

### Expected outcome
- a real mobile menu or drawer
- easier access to navigation
- visible search access
- cleaner browse flow on mobile

### Code work
1. Replace the horizontal scrolling mobile nav strip with a menu or drawer.
2. Keep important actions visible on mobile.
3. Recheck spacing in the header, archive, and footer for small screens.
4. Confirm tap targets and readability.

### Verification
Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Then verify manually in browser at mobile width:
1. open menu
2. navigate to all key pages
3. access blog search
4. confirm no clipped or hidden controls

### Manual work
Usually none, unless we choose new icons, copy, or brand assets.

### Definition of done
- mobile navigation is easier than the current scrolling strip
- key public actions remain accessible on small screens

---

## Task 6: Stage And Release Safely

### Why this is the last task
After code and UX improvements are complete, staging and production checks must prove the system still works end to end.

### Goal
Release safely with a repeatable staging and production process.

### Expected outcome
- staging is tested with real services
- production deploy follows a checklist
- post-deploy checks confirm the site is healthy

### Code work
1. Update documentation based on the final implementation.
2. Update the staging smoke checklist if flows changed.
3. Add any missing environment notes.

### Verification
1. Run local verify
2. Run smoke tests
3. Run staging smoke checklist
4. Verify production after deploy

### Manual work
Use these sections in [`docs/manual-operator-guide.md`](./manual-operator-guide.md):
- Manual Task A
- Manual Task B
- Manual Task C
- Manual Task D
- Manual Task G

### Definition of done
- staging verification is complete
- production deployment is complete
- post-deploy checks are complete

---

## Recommended Execution Order

1. Task 1: Harden The Delivery Pipeline
2. Task 2: Fix The Contact Flow End To End
3. Task 3: Remove Fake Or Incomplete Public CTAs
4. Task 4: Redesign The Homepage For Stronger Engagement
5. Task 5: Improve Mobile Navigation And Browse Experience
6. Task 6: Stage And Release Safely

## What I will do when we start execution

For each task, I will:
- inspect the current code for that task
- implement only that task
- run verification steps
- tell you exactly what passed and what still needs manual action
- update the related documentation if the workflow changes
