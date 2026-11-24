import { test, expect, openAdmin, submit } from "./fixtures";

for (const width of [1440, 390]) {
  test(`navigation and directory controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const path of ["/about", "/blogs", "/academic", "/recommendations", "/contact", "/"]) {
      await page.locator(`header nav a[href="${path}"]:visible`).click();
      await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/" : path}$`));
      await expect(page.locator("main h1").first()).toBeVisible();
    }
    for (const path of ["blogs", "academic", "recommendations"]) {
      await page.goto(`/${path}`);
      const links = page.locator(`main a[href^="/${path}/"]`);
      await expect(links.first()).toBeVisible();
      const count = await links.count();
      const search = page.locator('input[placeholder*="Search"]').first();
      await search.fill("zzzzz-no-matching-audit-record-987654321");
      await expect(links).toHaveCount(0);
      await search.fill("");
      await expect(links).toHaveCount(count);
      await page.getByRole("button", { name: "List view", exact: true }).click();
      await expect(page.getByRole("button", { name: "List view", exact: true })).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "Grid view", exact: true }).click();
      await expect(page.getByRole("button", { name: "Grid view", exact: true })).toHaveAttribute("aria-pressed", "true");
      const sort = page.locator("main select");
      const values = await sort.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
      for (const value of values) {
        await sort.selectOption(value);
        await expect(sort).toHaveValue(value);
        await expect(links).toHaveCount(count);
      }
      const first = await links.first().getAttribute("href");
      await links.first().click();
      await expect(page).toHaveURL(new RegExp(`${first}$`));
      await expect(page.locator("main h1").first()).toBeVisible();
    }
  });
}

test("theme toggle survives reload and header search opens blog search", async ({ page }, info) => {
  await page.goto("/");
  const theme = page.getByRole("button", { name: "Toggle public theme" });
  await expect(theme).toBeVisible();
  const original = await page.locator("html").getAttribute("class");
  await theme.click();
  await expect(page.locator("html")).not.toHaveAttribute("class", original ?? "");
  const changed = await page.locator("html").getAttribute("class");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("class", changed ?? "");
  await page.screenshot({ path: info.outputPath("light-theme.png"), fullPage: true });
  await page.getByRole("link", { name: "Search articles", exact: true }).click();
  await expect(page).toHaveURL(/\/blogs#search$/);
  await expect(page.getByPlaceholder("Search articles...")).toBeVisible();
});

test("blog pagination loads remaining records and resets after search", async ({ page, adminPage, audit }) => {
  const records = Array.from({ length: 13 }, (_, index) => ({
    title: `Pagination audit ${String(index).padStart(2, "0")}`,
    slug: `${audit.prefix}-pagination-${index}`,
    body_markdown: "Temporary database fixture for real browser pagination verification.",
    status: "published" as const,
    published_at: new Date().toISOString(),
  }));
  const inserted = await audit.service.from("posts").insert(records).select("id");
  expect(inserted.error).toBeNull();
  await openAdmin(adminPage, `/admin/content/posts?edit=${inserted.data![0].id}`);
  await submit(adminPage, "Save post");
  await page.goto("/blogs");
  const search = page.getByPlaceholder("Search articles...");
  await search.fill("Pagination audit");
  const cards = search.locator("xpath=ancestor::section[1]").locator(`a[href^="/blogs/${audit.prefix}-pagination-"]`);
  await expect(cards).toHaveCount(12);
  await page.getByRole("button", { name: /Load more articles/ }).click();
  await expect(cards).toHaveCount(13);
  await expect(page.getByRole("button", { name: /Load more articles/ })).toHaveCount(0);
  await search.fill("Pagination audit 00");
  await expect(cards).toHaveCount(1);
  await search.fill("Pagination audit");
  await expect(cards).toHaveCount(12);
});