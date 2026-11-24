import { expect, type Page, type TestInfo } from "@playwright/test";
import { test } from "./fixtures";

const routes = ["/", "/about", "/blogs", "/academic", "/recommendations", "/contact"];
const adminRoutes = [
  "/admin", "/admin/dashboard", "/admin/content/pages", "/admin/content/home",
  "/admin/content/about", "/admin/content/blogs", "/admin/content/academic-page",
  "/admin/content/recommendations-page", "/admin/content/contact", "/admin/content/contact/advanced",
  "/admin/content/posts", "/admin/content/academic", "/admin/content/recommendations",
  "/admin/navigation", "/admin/media", "/admin/messages", "/admin/seo", "/admin/settings",
];

async function inspect(page: Page, route: string, info: TestInfo, label: string) {
  const errors: string[] = [];
  const listener = (error: Error) => errors.push(error.message);
  page.on("pageerror", listener);
  const response = await page.goto(route);
  expect.soft(response?.status(), `${route} HTTP status`).toBe(200);
  await expect(page.locator("h1").first(), `${route} heading`).toBeVisible();
  await expect.soft(page.getByText("Application error:", { exact: false })).toHaveCount(0);
  await page.evaluate(async () => {
    for (let offset = 0; offset < document.body.scrollHeight; offset += window.innerHeight) {
      window.scrollTo(0, offset);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
  });
  const brokenImages = await page.locator("img").evaluateAll(async (images) => {
    const imageElements = images.filter((image): image is HTMLImageElement => image instanceof HTMLImageElement);
    await Promise.all(imageElements.map((image) => image.decode().catch(() => undefined)));
    return imageElements.filter((image) => !image.naturalWidth).map((image) => ({ src: image.currentSrc, alt: image.alt }));
  });
  const layout = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowing: Array.from(document.querySelectorAll("main *, article *"))
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 2)
      .slice(0, 12).map((element) => ({ tag: element.tagName, text: element.textContent?.slice(0, 100) })),
  }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath(`${label}.png`), fullPage: true });
  await info.attach(`${label}-observations`, { body: JSON.stringify({ route, errors, brokenImages, layout }, null, 2), contentType: "application/json" });
  expect.soft(brokenImages, `${route} broken images`).toEqual([]);
  expect.soft(layout.scrollWidth, `${route} horizontal overflow`).toBeLessThanOrEqual(layout.width + 2);
  expect.soft(errors, `${route} uncaught browser errors`).toEqual([]);
  page.off("pageerror", listener);
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  for (const route of routes) {
    test(`public ${route} at ${viewport.width}px`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await inspect(page, route, info, "page");
    });
  }

  test(`database-listed detail and custom pages at ${viewport.width}px`, async ({ page, audit }, info) => {
    test.setTimeout(240_000);
    await page.setViewportSize(viewport);
    const detailRoutes: string[] = [];
    for (const [table, path] of [["posts", "blogs"], ["academic_entries", "academic"], ["recommendations", "recommendations"]] as const) {
      const result = await audit.anon.from(table).select("slug").eq("status", "published").is("deleted_at", null);
      expect(result.error).toBeNull();
      detailRoutes.push(...(result.data ?? []).map((row) => `/${path}/${row.slug}`));
    }
    const custom = await audit.anon.from("pages").select("slug").eq("status", "published");
    expect(custom.error).toBeNull();
    detailRoutes.push(...(custom.data ?? []).map((row) => row.slug.startsWith("/") ? row.slug : `/${row.slug}`).filter((path) => !routes.includes(path)));
    expect(detailRoutes.length).toBeGreaterThan(0);
    for (const [index, path] of [...new Set(detailRoutes)].entries()) {
      await inspect(page, path, info, `detail-${index}`);
    }
    await info.attach("routes-visited", { body: JSON.stringify(detailRoutes, null, 2), contentType: "application/json" });
  });
}

for (const route of adminRoutes) {
  test(`authenticated page ${route}`, async ({ adminPage: page }, info) => {
    await inspect(page, route, info, "admin-page");
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });
}

test("anonymous admin routes, missing pages, RSS, sitemap and robots", async ({ request, page }) => {
  for (const route of adminRoutes) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect.soft(response.status(), route).toBe(307);
    expect.soft(response.headers().location, route).toContain("/admin/login");
  }
  for (const route of ["/audit-missing-page", "/blogs/audit-missing-post", "/academic/audit-missing-entry", "/recommendations/audit-missing-resource"]) {
    expect.soft((await page.goto(route))?.status(), route).toBe(404);
  }
  const rss = await request.get("/feed.xml");
  expect(rss.status()).toBe(200);
  expect(rss.headers()["content-type"]).toContain("xml");
  expect(await rss.text()).toContain("<rss");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/^Disallow: \/$/m);
  const home = await request.get("/");
  for (const header of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy"]) {
    expect(home.headers()[header], header).toBeTruthy();
  }
});