import { test, expect } from "@playwright/test";

const origin = "https://tusherblog.me";

for (const width of [1440, 390]) {
  test(`deployed public sitemap sweep at ${width}px is read-only`, async ({ page, request }, info) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/*", async (route) => {
      if (["GET", "HEAD", "OPTIONS"].includes(route.request().method())) await route.continue();
      else await route.abort();
    });
    const sitemap = await request.get(`${origin}/sitemap.xml`);
    expect(sitemap.status()).toBe(200);
    await page.goto(origin);
    const discovered = await page.evaluate((xml) => Array.from(new DOMParser().parseFromString(xml, "application/xml").getElementsByTagName("loc")).map((element) => element.textContent ?? ""), await sitemap.text());
    const urls = [...new Set([origin, ...["about", "blogs", "academic", "recommendations", "contact"].map((path) => `${origin}/${path}`), ...discovered])]
      .filter((url) => new URL(url).origin === origin);
    const observations: unknown[] = [];
    for (const [index, url] of urls.entries()) {
      const errors: string[] = [];
      const failedRequests: string[] = [];
      const listener = (error: Error) => errors.push(error.message);
      const networkListener = (response: import("@playwright/test").Response) => {
        if (response.status() >= 400 && new URL(response.url()).origin === origin) failedRequests.push(`${response.status()} ${response.url()}`);
      };
      page.on("pageerror", listener);
      page.on("response", networkListener);
      const response = await page.goto(url);
      expect.soft(response?.status(), url).toBe(200);
      await expect.soft(page.locator("main h1").first(), url).toBeVisible();
      await page.evaluate(async () => {
        for (let offset = 0; offset < document.body.scrollHeight; offset += window.innerHeight) {
          window.scrollTo(0, offset);
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        }
      });
      const images = await page.locator("img").evaluateAll(async (elements) => {
        const images = elements.filter((element): element is HTMLImageElement => element instanceof HTMLImageElement);
        await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
        return images.filter((image) => !image.naturalWidth).map((image) => ({ src: image.currentSrc, alt: image.alt }));
      });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: info.outputPath(`deployed-${index}.png`), fullPage: true });
      observations.push({ url, status: response?.status(), title: await page.title(), canonical, images, overflow, errors, failedRequests });
      expect.soft(images, `${url} images`).toEqual([]);
      expect.soft(overflow, `${url} overflow`).toBeLessThanOrEqual(2);
      expect.soft(errors, `${url} browser exceptions`).toEqual([]);
      expect.soft(failedRequests, `${url} failed same-origin resources`).toEqual([]);
      expect.soft(canonical, `${url} canonical`).toContain(origin);
      page.off("pageerror", listener);
      page.off("response", networkListener);
    }
    await info.attach("deployed-observations", { body: JSON.stringify(observations, null, 2), contentType: "application/json" });
    const admin = await request.get(`${origin}/admin/dashboard`, { maxRedirects: 0 });
    expect(admin.status()).toBe(307);
    expect(admin.headers().location).toContain("/admin/login");
    expect((await request.get(`${origin}/audit-nonexistent-route-20260905`)).status()).toBe(404);
    expect((await request.get(`${origin}/feed.xml`)).headers()["content-type"]).toContain("xml");
  });
}