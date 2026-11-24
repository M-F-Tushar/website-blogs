import { test, expect, openAdmin, submit } from "./fixtures";

test("contact delivery, throttling, inbox status and privacy", async ({ page, adminPage, audit, browser }) => {
  const visitor = await browser.newContext();
  const contact = await visitor.newPage();
  const email = `${audit.prefix}-contact@example.com`;
  const subject = `Live contact ${audit.prefix}`;
  const message = "A real browser contact submission verifies database persistence, private inbox delivery, and message status updates.";
  try {
    await contact.goto("/contact");
    const fillContact = async () => {
      await contact.getByLabel("Your Name").fill("Live Browser Tester");
      await contact.getByLabel("Email Address").fill(email);
      await contact.getByRole("textbox", { name: "Subject", exact: true }).fill(subject);
      await contact.getByRole("textbox", { name: "Message", exact: true }).fill(message);
    };
    await fillContact();
    let response = contact.waitForResponse("**/api/contact");
    await contact.getByRole("button", { name: "Send Message", exact: true }).click();
    expect((await response).status()).toBe(200);
    await expect(contact.getByText("Your message has been received.")).toBeVisible();
    const saved = await audit.service.from("contact_messages").select("id, subject, message, status").eq("email", email).single();
    expect(saved.error).toBeNull();
    expect(saved.data).toMatchObject({ subject, message, status: "new" });
    await fillContact();
    response = contact.waitForResponse("**/api/contact");
    await contact.getByRole("button", { name: "Send Message", exact: true }).click();
    expect((await response).status()).toBe(429);
    await expect(contact.getByText("Please wait a few seconds before sending another message.")).toBeVisible();
    const duplicates = await audit.service.from("contact_messages").select("id").eq("email", email);
    expect(duplicates.error).toBeNull();
    expect(duplicates.data).toHaveLength(1);
    await openAdmin(adminPage, "/admin/messages");
    await expect(adminPage.getByText(subject, { exact: false })).toBeVisible();
    const form = page.locator("form").filter({ has: page.locator(`input[name="id"][value="${saved.data!.id}"]`) });
    await form.locator('select[name="status"]').selectOption("reviewed");
    await form.getByRole("button", { name: "Update status" }).click();
    await expect.poll(async () => (await audit.service.from("contact_messages").select("status").eq("id", saved.data!.id).single()).data?.status).toBe("reviewed");
    await openAdmin(adminPage, "/admin/messages");
    await expect(form.locator('select[name="status"]')).toHaveValue("reviewed");
    const hidden = await audit.anon.from("contact_messages").select("id").eq("id", saved.data!.id);
    if (hidden.error) expect(hidden.error.code).toBe("42501");
    else expect(hidden.data).toEqual([]);
  } finally {
    const cleanup = await audit.service.from("contact_messages").delete().eq("email", email);
    expect(cleanup.error).toBeNull();
    const remaining = await audit.service.from("contact_messages").select("id").eq("email", email);
    expect(remaining.error).toBeNull();
    expect(remaining.data).toEqual([]);
    await visitor.close();
  }
});

test("public and private uploads persist; public cover renders and private storage rejects anonymous reads", async ({ adminPage: page, browser, audit }, info) => {
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  await publicPage.setContent('<html><body style="background:#167455;color:white;font:48px sans-serif">Live upload verification</body></html>');
  const image = await publicPage.screenshot();
  try {
    for (const bucket of ["site-public", "site-admin"]) {
      const label = `${audit.prefix}-${bucket}`;
      await openAdmin(page, "/admin/media");
      await page.locator('[name="file"]').setInputFiles({ name: `${label}.png`, mimeType: "image/png", buffer: image });
      await page.getByLabel("Label", { exact: true }).fill(label);
      await page.getByLabel("Alt text").fill("Live upload evidence");
      await page.getByLabel("Bucket").selectOption(bucket);
      await submit(page, "Upload asset");
      await expect(page.getByText("Media asset uploaded successfully.")).toBeVisible();
      const asset = await audit.service.from("media_assets").select("*").eq("label", label).single();
      expect(asset.error).toBeNull();
      expect(asset.data).toMatchObject({ bucket_name: bucket, mime_type: "image/png", alt_text: "Live upload evidence", is_public: bucket === "site-public" });
      const stored = await audit.service.storage.from(bucket).download(asset.data!.object_path);
      expect(stored.error).toBeNull();
      expect(Buffer.from(await stored.data!.arrayBuffer())).toEqual(image);
      const url = audit.anon.storage.from(bucket).getPublicUrl(asset.data!.object_path).data.publicUrl;
      const anonymous = await visitor.request.get(url);
      if (bucket === "site-admin") {
        expect(anonymous.ok()).toBe(false);
        const hidden = await audit.anon.from("media_assets").select("id").eq("id", asset.data!.id);
        expect(hidden.error).toBeNull();
        expect(hidden.data).toEqual([]);
      } else {
        expect(anonymous.status()).toBe(200);
        expect(await anonymous.body()).toEqual(image);
        await openAdmin(page, "/admin/content/posts");
        await page.locator('[name="title"]').fill("Live media cover verification");
        await page.locator('[name="slug"]').fill(`${audit.prefix}-media`);
        await page.locator('[name="bodyMarkdown"]').fill("An uploaded real PNG is selected through the media picker and rendered publicly.");
        await page.locator('[name="status"]').selectOption("published");
        await page.locator('[name="coverAssetId"]').selectOption(asset.data!.id);
        await submit(page, "Save post");
        const post = await audit.service.from("posts").select("cover_asset_id").eq("slug", `${audit.prefix}-media`).single();
        expect(post.error).toBeNull();
        expect(post.data?.cover_asset_id).toBe(asset.data!.id);
        await publicPage.goto(`/blogs/${audit.prefix}-media`);
        const cover = publicPage.getByRole("img", { name: "Live upload evidence" }).first();
        await expect(cover).toBeVisible();
        await expect.soft.poll(async () => cover.evaluate((element: HTMLImageElement) => element.naturalWidth), { message: "Uploaded public cover must decode; loopback optimizer currently returns HTTP 400" }).toBeGreaterThan(0);
        await publicPage.screenshot({ path: info.outputPath("published-cover.png"), fullPage: true });
      }
    }
  } finally {
    const posts = await audit.service.from("posts").delete().eq("slug", `${audit.prefix}-media`);
    expect(posts.error).toBeNull();
    const assets = await audit.service.from("media_assets").select("id, bucket_name, object_path").like("label", `${audit.prefix}-%`);
    expect(assets.error).toBeNull();
    for (const asset of assets.data ?? []) {
      const removed = await audit.service.storage.from(asset.bucket_name).remove([asset.object_path]);
      expect(removed.error).toBeNull();
      const deleted = await audit.service.from("media_assets").delete().eq("id", asset.id);
      expect(deleted.error).toBeNull();
      const missing = await audit.service.storage.from(asset.bucket_name).download(asset.object_path);
      expect(missing.error).not.toBeNull();
    }
    await visitor.close();
  }
});

test("contact empty submission returns validation error without storing a message", async ({ page, audit }) => {
  const before = await audit.service.from("contact_messages").select("id", { count: "exact", head: true });
  expect(before.error).toBeNull();
  await page.goto("/contact");
  const response = page.waitForResponse("**/api/contact");
  await page.getByRole("button", { name: "Send Message", exact: true }).click();
  expect((await response).status()).toBe(400);
  const after = await audit.service.from("contact_messages").select("id", { count: "exact", head: true });
  expect(after.error).toBeNull();
  expect(after.count).toBe(before.count);
});

test("admin session survives refresh and logout removes access", async ({ adminPage: page }) => {
  await page.reload();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await submit(page, "Sign out");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/login/);
});