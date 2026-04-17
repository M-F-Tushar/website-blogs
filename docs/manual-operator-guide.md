# Manual Operator Guide

This guide explains the manual steps you may need to do outside the codebase.

Use this together with [`docs/execution-roadmap.md`](./execution-roadmap.md).

Important rule:
- only do the manual steps for the task we are currently working on

---

## Manual Task A: GitHub Repository Settings For CI

### When you will do this
During Task 1 and Task 6.

### Why this is needed
Some pipeline features depend on GitHub repository settings, secrets, or environment protection rules that cannot be changed from the local code alone.

Current status:
- the repository's current `CI` workflow does not require any GitHub Actions secrets or repository variables
- do not add secrets for Task 1 unless a future workflow actually references `${{ secrets.NAME }}`

### What you may need
- access to the GitHub repository settings page
- permission to add secrets

### Steps
1. Open your repository on GitHub.
2. Click `Settings`.
3. Open `Secrets and variables`.
4. Open `Actions`.
5. For the current Task 1 workflow, add nothing here.
6. Open `Actions` in the left sidebar and confirm workflows are enabled.
7. If we use protected deployment environments, open `Environments` and confirm the environment exists.

### How to verify
1. Go to the `Actions` tab.
2. Confirm the workflow appears.
3. Confirm the workflow runs without missing-secret errors.

---

## Manual Task B: Staging Environment Variables

### When you will do this
During Task 1 and Task 6.

### Why this is needed
The staging deployment must use real staging configuration, not local fallbacks.

### Steps
1. Open your hosting provider dashboard.
2. Open the project settings.
3. Find the environment variables section.
4. Add or confirm these values for staging:
   - `APP_ENV=staging`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `CONTACT_RATE_LIMIT_SECRET`
5. Save the changes.
6. Redeploy staging if your host requires it.

### How to verify
1. Open the staging site.
2. Confirm public pages load.
3. Confirm the site is not silently using demo content.

---

## Manual Task C: Turnstile Key Setup

### When you will do this
During Task 2 and Task 6.

### Why this is needed
Turnstile uses Cloudflare-managed keys and domain rules. These must match the environment where the site runs.

Local note:
- local development no longer requires Turnstile to submit the contact form
- this manual setup is only needed for staging and production validation

### Steps
1. Log in to Cloudflare.
2. Open `Turnstile`.
3. Open the widget used by this project.
4. Confirm the allowed domains include:
   - local development domain if supported
   - staging domain
   - production domain
5. Copy the site key.
6. Copy the secret key.
7. Put those keys into the correct environment variables in your host and local `.env.local`.

### How to verify
1. Open `/contact`.
2. Confirm the Turnstile widget loads without repeated errors.
3. Confirm the submit button becomes available after completing the check.

---

## Manual Task D: Staging Contact Flow Confirmation

### When you will do this
During Task 2 and Task 6.

### Why this is needed
A real staging check proves the feature works with the real third-party services.

### Steps
1. Open the staging site contact page.
2. Fill in a test message with your own email.
3. Complete the bot-protection check.
4. Submit the message.
5. Open the admin panel.
6. Confirm the new message exists.
7. If notifications are enabled, confirm the email arrives.

### How to verify
- the message exists in admin
- the browser shows a success message
- the message is not lost

---

## Manual Task E: Newsletter Product Decision

### When you will do this
During Task 3.

### Why this is needed
You need to choose whether the newsletter should be a real feature now or whether we should remove the fake signup path for now.

### Your decision
Choose one:
1. Implement a real newsletter now
2. Remove the fake newsletter CTA for now

Current status:
- Task 3 now follows option 2
- there is no manual work required unless we later decide to implement a real newsletter provider

### If you choose option 1
You will also need:
- a provider decision, such as Resend, Buttondown, ConvertKit, Mailchimp, or Supabase table storage
- provider credentials

### How to verify
- if implemented, a real subscription is stored or sent
- if removed, no fake success path remains

---

## Manual Task F: Homepage Content Inputs

### When you will do this
During Task 4.

### Why this is needed
A strong homepage needs real content, not just layout changes.

### What I may ask you for
- a short hero statement
- one or two featured posts you want highlighted
- one portrait or hero image
- preferred call-to-action wording

### Simple version
Prepare these four things:
1. One sentence describing who you are and what this site is for
2. One featured article you want people to read first
3. One good portrait or personal image
4. One main action you want visitors to take

### How to verify
When the redesign is done:
- the homepage explains the site clearly
- the featured content feels intentional
- the image improves the first impression

---

## Manual Task G: Production Release Checks

### When you will do this
During Task 6.

### Why this is needed
The last safety step must happen in the live environment.

### Steps
1. Open the production homepage.
2. Open `/about`.
3. Open `/blogs`.
4. Open `/contact`.
5. Log in to admin.
6. Confirm protected routes work.
7. Confirm canonical URLs use the real domain.
8. Submit a final production-safe contact test if appropriate.

### How to verify
- pages load
- admin works
- contact works
- no localhost URLs appear
- no obvious visual regressions appear on mobile and desktop

---

## Beginner Notes

If a step says:
- `environment variable`: this means a secret setting such as an API key or domain URL stored in your hosting dashboard
- `staging`: this means a test version of your site before production
- `production`: this means the real public site
- `CI`: this means the automated checks that run on GitHub when code changes
- `smoke test`: this means a small test that proves the most important paths still work
