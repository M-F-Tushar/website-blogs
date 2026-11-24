import { test, expect, submit } from "./fixtures";

test("post draft, publish, edit and archive persist and control anonymous visibility", async ({ adminPage: page, browser, audit }) => {
  const slug = `${audit.prefix}-post`;
  const title = `Live audit post ${audit.prefix}`;
  const body = "## Database verified article\n\nThis unique article was saved by clicking the real admin submit button.";
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  try {
    await page.goto("/admin/content/posts");
    await page.locator('[name="title"]').fill(title);
    await page.locator('[name="slug"]').fill(slug);
    await page.locator('[name="categories"]').fill(`${audit.prefix}-category`);
    await page.locator('[name="tags"]').fill(`${audit.prefix}-tag`);
    await page.locator('[name="excerpt"]').fill("Live browser audit of the complete publishing workflow.");
    await page.locator('textarea[name="bodyMarkdown"]').fill(body);
    await submit(page, "Save post");
    await expect(page).toHaveURL(/edit=.*saved=1/);
    const draft = await audit.service.from("posts").select("id, status, body_markdown").eq("slug", slug).single();
    expect(draft.error).toBeNull();
    expect(draft.data?.status).toBe("draft");
    expect(draft.data?.body_markdown.replace(/\r\n/g, "\n")).toBe(body);
    const anonymousDraft = await audit.anon.from("posts").select("id").eq("slug", slug);
    expect(anonymousDraft.error).toBeNull();
    expect(anonymousDraft.data).toEqual([]);
    expect((await publicPage.goto(`/blogs/${slug}`))?.status()).toBe(404);

    await page.locator('[name="status"]').selectOption("published");
    await page.locator('[name="publishedAt"]').fill("2026-09-01T09:00");
    await submit(page, "Save post");
    await expect.poll(async () => (await audit.anon.from("posts").select("status").eq("slug", slug).maybeSingle()).data?.status).toBe("published");
    await expect.poll(async () => (await publicPage.goto(`/blogs/${slug}`))?.status()).toBe(200);
    await expect(publicPage.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(publicPage.getByRole("heading", { name: /^Database verified article/ })).toBeVisible();
    await publicPage.goto("/blogs");
    await publicPage.getByPlaceholder("Search articles...").fill(audit.prefix);
    await expect(publicPage.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();
    const tags = await audit.service.from("post_tags").select("tags(slug)").eq("post_id", draft.data!.id);
    const categories = await audit.service.from("post_categories").select("categories(slug)").eq("post_id", draft.data!.id);
    expect(tags.error).toBeNull();
    expect(categories.error).toBeNull();
    expect(tags.data).toEqual([{ tags: { slug: `${audit.prefix}-tag` } }]);
    expect(categories.data).toEqual([{ categories: { slug: `${audit.prefix}-category` } }]);

    await page.locator('[name="title"]').fill(`${title} updated`);
    await submit(page, "Save post");
    await expect.poll(async () => (await audit.service.from("posts").select("title").eq("slug", slug).single()).data?.title).toBe(`${title} updated`);
    await publicPage.goto(`/blogs/${slug}`);
    await expect(publicPage.getByRole("heading", { name: `${title} updated`, exact: true })).toBeVisible();

    await submit(page, "Archive post");
    await expect.poll(async () => (await audit.service.from("posts").select("status").eq("slug", slug).single()).data?.status).toBe("archived");
    expect((await publicPage.goto(`/blogs/${slug}`))?.status()).toBe(404);
    const archived = await audit.anon.from("posts").select("id").eq("slug", slug);
    expect(archived.error).toBeNull();
    expect(archived.data).toEqual([]);
  } finally {
    await visitor.close();
  }
});

for (const collection of [
  { table: "academic_entries", admin: "academic", public: "academic", save: "Save entry", archive: "Archive entry" },
  { table: "recommendations", admin: "recommendations", public: "recommendations", save: "Save recommendation", archive: "Archive recommendation" },
] as const) {
  test(`${collection.public} draft, publish, edit and archive reach database and public pages`, async ({ adminPage: page, browser, audit }, testInfo) => {
    const slug = `${audit.prefix}-${collection.public}`;
    const title = `Live audit ${collection.public} ${audit.prefix.slice(-8)}`;
    const visitor = await browser.newContext();
    const publicPage = await visitor.newPage();
    try {
      await page.goto(`/admin/content/${collection.admin}`);
      await page.locator('[name="title"]').fill(title);
      await page.locator('[name="slug"]').fill(slug);
      await page.locator('[name="summary"]').fill(`A database-verified ${collection.public} test summary.`);
      await page.locator('textarea[name="bodyMarkdown"]').fill("## Audit evidence\n\nThis entry was created with the actual admin save button.");
      await page.locator('[name="externalUrl"]').fill("https://example.com/audit-resource");
      await page.locator('[name="metaTitle"]').fill(`${title} SEO`);
      if (collection.table === "academic_entries") {
        await page.locator('[name="entryType"]').selectOption("experiment");
        await page.locator('[name="startedAt"]').fill("2026-08-01");
        await page.locator('[name="completedAt"]').fill("2026-09-01");
      } else {
        await page.locator('[name="categoryName"]').fill(`${audit.prefix}-resources`);
        await page.locator('[name="audience"]').fill("Students testing real applications");
        await page.locator('[name="useCase"]').fill("Reproducing end-to-end database workflows");
        await page.locator('[name="whyRecommend"]').fill("Provides reproducible evidence and practical examples.");
        await page.locator('[name="level"]').selectOption("intermediate");
      }
      await submit(page, collection.save);
      await expect(page).toHaveURL(/edit=.*saved=1/);
      const draft = await audit.service.from(collection.table).select("id, status, title").eq("slug", slug).single();
      expect(draft.error).toBeNull();
      expect(draft.data).toMatchObject({ status: "draft", title });
      expect((await publicPage.goto(`/${collection.public}/${slug}`))?.status()).toBe(404);
      const hidden = await audit.anon.from(collection.table).select("id").eq("slug", slug);
      expect(hidden.error).toBeNull();
      expect(hidden.data).toEqual([]);

      await page.locator('[name="status"]').selectOption("published");
      await submit(page, collection.save);
      await expect.poll(async () => (await publicPage.goto(`/${collection.public}/${slug}`))?.status()).toBe(200);
      await expect(publicPage.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await expect(publicPage.getByRole("heading", { name: /^Audit evidence/ })).toBeVisible();
      await expect(publicPage).toHaveTitle(new RegExp(`${title} SEO`));
      expect(await publicPage.locator('a[href="https://example.com/audit-resource"]').count()).toBeGreaterThan(0);
      await publicPage.screenshot({ path: testInfo.outputPath(`${collection.public}-published.png`), fullPage: true });
      const published = await audit.anon.from(collection.table).select("title, status").eq("slug", slug).single();
      expect(published.error).toBeNull();
      expect(published.data).toMatchObject({ title, status: "published" });
      await publicPage.goto(`/${collection.public}`);
      const search = publicPage.locator('input[type="search"], input[placeholder*="Search"]');
      if (await search.count()) await search.first().fill(title);
      await expect(publicPage.locator(`a[href="/${collection.public}/${slug}"]`).first()).toBeVisible();

      await page.locator('[name="title"]').fill(`${title} updated`);
      await submit(page, collection.save);
      await publicPage.goto(`/${collection.public}/${slug}`);
      await expect(publicPage.getByRole("heading", { name: `${title} updated`, exact: true })).toBeVisible();
      expect((await audit.service.from(collection.table).select("title").eq("slug", slug).single()).data?.title).toBe(`${title} updated`);
      await submit(page, collection.archive);
      await expect.poll(async () => (await audit.service.from(collection.table).select("status").eq("slug", slug).single()).data?.status).toBe("archived");
      await expect.poll(async () => (await publicPage.goto(`/${collection.public}/${slug}`))?.status()).toBe(404);
      const archived = await audit.anon.from(collection.table).select("id").eq("slug", slug);
      expect(archived.error).toBeNull();
      expect(archived.data).toEqual([]);
    } finally {
      await visitor.close();
    }
  });
}