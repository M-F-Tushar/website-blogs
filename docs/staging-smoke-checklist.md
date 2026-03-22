# Staging Smoke Checklist

Use this checklist after any staging deployment and before a production release.

## Preconditions

- Staging environment variables are set, including:
  - `APP_ENV=staging`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `TURNSTILE_SECRET_KEY`
  - `CONTACT_RATE_LIMIT_SECRET`
- Supabase migrations are applied to the staging database.
- At least one admin account exists.
- At least one public media asset is available for upload/selection tests.

## Admin Login

1. Open `/admin/login`.
2. Sign in with a valid admin account.
3. Confirm you land on `/admin/dashboard`.
4. Refresh the browser.
5. Confirm you remain signed in.

Expected result:
- Login succeeds.
- Session survives refresh.
- Protected admin routes remain accessible.

## Site Settings Save

1. Open `/admin/settings`.
2. Change one visible field such as site tagline or footer blurb.
3. Save.
4. Open the public homepage.
5. Confirm the updated content appears.
6. Revert the setting if needed.

Expected result:
- Save succeeds.
- The public site reflects the updated setting.

## About Section Save

1. Open `/admin/content/about`.
2. Edit an existing visible section.
3. Save.
4. Open `/about`.
5. Confirm the updated content appears.
6. Revert the change if needed.

Expected result:
- Save succeeds.
- The public About page updates correctly.

## Media Upload

1. Open `/admin/media`.
2. Upload a public image asset with label and alt text.
3. Confirm the upload succeeds and the asset appears in the media list.

Expected result:
- Upload succeeds.
- The asset is listed and has a public URL.

## Publish Post With Cover Image

1. Open `/admin/content/posts`.
2. Create or edit a post.
3. Select the uploaded media asset as the cover image.
4. Set status to `published`.
5. Save.
6. Open `/blogs`.
7. Confirm the post appears with its image card.
8. Open the post detail page.
9. Confirm the cover image renders above the body.

Expected result:
- Save succeeds.
- The blog index card renders the cover image.
- The blog detail page renders the cover image.

## Contact Submission

1. Open `/contact`.
2. Complete the Turnstile check.
3. Submit a valid message.
4. Open `/admin/messages`.
5. Confirm the new message appears.
6. If notifications are configured, confirm the notification email arrives.

Expected result:
- Submission succeeds.
- The message is stored in admin.
- Notification delivery works if configured.

## Abuse Guardrail Check

1. Submit the contact form twice in rapid succession.
2. Confirm one of the requests is throttled.
3. Submit a clearly low-quality message with multiple links.

Expected result:
- Rapid repeat submission is throttled.
- Suspicious content is rejected or stored with a higher spam score/flags.

## No Fake Fallback Check

1. In staging, temporarily break public Supabase access:
   - either remove `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - or point `NEXT_PUBLIC_SUPABASE_URL` to an invalid value
2. Load a public page.

Expected result:
- The app fails loudly.
- It does not silently render demo content.
- The runtime error page is shown.

After the test:
- Restore the real staging environment variables immediately.

## Logout

1. Sign out from admin.
2. Confirm you are redirected to `/admin/login`.
3. Try opening `/admin/dashboard`.

Expected result:
- Session is cleared.
- Protected admin routes are no longer accessible without logging in again.
