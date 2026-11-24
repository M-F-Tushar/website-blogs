import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Markdown } from "@/components/site/markdown";

test.describe("public smoke", () => {
  test("homepage loads the main public shell", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Home \|/);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.locator('link[rel="alternate"][type="application/rss+xml"]'),
    ).toHaveAttribute("href", /\/feed\.xml$/);
    const themeToggle = page.getByRole("button", { name: "Dark theme" });
    await expect(themeToggle).toHaveAttribute("aria-pressed", "true");
    await themeToggle.click();
    await expect(themeToggle).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("link", { name: "Contact Me" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Read Latest Posts" }).first()).toBeVisible();
    await expect(
      page.getByText(/newsletter is not live yet/i).first(),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("blog archive loads and client-side search updates results", async ({ page }) => {
    await page.goto("/blogs");

    const searchInput = page.getByPlaceholder("Search articles...");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(searchInput).toBeVisible();
    await expect(page.locator('main a[href^="/blogs/"] h2').first()).toBeVisible();

    await searchInput.fill("zzzz-no-match-smoke");
    await expect(
      page.getByRole("heading", { name: "No articles match that search" }),
    ).toBeVisible();

    await searchInput.fill("");
    await expect(page.locator('main a[href^="/blogs/"] h2').first()).toBeVisible();
  });

  test("blog archive has stable loading geometry", async ({ page }) => {
    await page.addInitScript(() => {
      const scoreWindow = window as typeof window & {
        __publicSmokeCls: number;
      };
      scoreWindow.__publicSmokeCls = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };

          if (!shift.hadRecentInput) {
            scoreWindow.__publicSmokeCls += shift.value;
          }
        }
      });

      observer.observe({ type: "layout-shift", buffered: true });
    });

    await page.goto("/blogs");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");

    const cls = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __publicSmokeCls: number;
          }
        ).__publicSmokeCls,
    );

    expect(cls).toBeLessThan(0.1);
  });

  test("visible public links do not speculatively prefetch routes", async ({
    page,
  }) => {
    const prefetchedRoutes: string[] = [];

    page.on("request", (request) => {
      const url = new URL(request.url());
      const headers = request.headers();
      const isRscRequest =
        headers.rsc === "1" ||
        headers["next-router-prefetch"] === "1" ||
        url.searchParams.has("_rsc");
      const isHeaderRoute = [
        "/",
        "/about",
        "/academic",
        "/recommendations",
        "/contact",
      ].includes(url.pathname);
      const isBlogDetail = /^\/blogs\/[^/]+\/?$/.test(url.pathname);

      if (isRscRequest && (isHeaderRoute || isBlogDetail)) {
        prefetchedRoutes.push(url.pathname);
      }
    });

    await page.goto("/blogs");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(500);

    await page.locator('main a[href^="/blogs/"]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(750);

    expect(prefetchedRoutes).toEqual([]);
  });

  test("mobile header keeps the public theme control visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");

    const themeToggle = page.getByRole("button", { name: /theme/i });

    await expect(themeToggle).toHaveCount(1);
    await expect(themeToggle).toBeVisible();
    await expect(page.locator(".nebula-mobile-fallback")).toBeVisible();
    await expect(page.locator(".nebula-orb").first()).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(0);
  });

  test("markdown reserves geometry and optimizes safe image sources", () => {
    const optimized = renderToStaticMarkup(
      createElement(Markdown, {
        content: "![Local diagram](/media/architecture.png)",
      }),
    );
    const fallback = renderToStaticMarkup(
      createElement(Markdown, {
        content: "![Animated example](https://example.com/demo.gif)",
      }),
    );

    expect(optimized).toContain("/_next/image");
    expect(optimized).toMatch(/aspect-ratio:16\s*\/\s*9/);
    expect(fallback).toContain('href="https://example.com/demo.gif"');
    expect(fallback).toContain("Open image: Animated example");
    expect(fallback).not.toContain("<img");
  });

  test("about page loads the profile narrative", async ({ page }) => {
    await page.goto("/about");

    await expect(page).toHaveTitle(/About \|/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "My Story" })).toBeVisible();
  });

  test("contact page loads the intake form", async ({ page }) => {
    await page.goto("/contact");

    await expect(page).toHaveTitle(/Contact \|/);
    await expect(page.getByRole("heading", { name: /Let['’]s Connect/ })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your Name" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email Address" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Subject" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
    await expect(page.getByText(/Local development mode is active/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Message" })).toBeEnabled();
  });

  test("unknown urls return a real 404 status", async ({ request }) => {
    for (const path of [
      "/this-page-does-not-exist",
      "/about/deeper",
      "/blogs/this-post-does-not-exist",
      "/academic/this-entry-does-not-exist",
      "/recommendations/this-item-does-not-exist",
    ]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(404);
      const html = await response.text();
      expect(html, path).not.toMatch(/<link[^>]+rel="canonical"/i);
      expect(html, path).not.toMatch(/<meta[^>]+property="og:url"/i);
    }
  });

  test("anonymous admin requests are redirected at the edge", async ({ request }) => {
    for (const path of ["/admin", "/admin/dashboard", "/admin/messages", "/admin/nope"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(307);
      expect(new URL(response.headers().location, "http://localhost").pathname).toBe(
        "/admin/login",
      );
      expect(response.headers()["x-robots-tag"]).toContain("noindex");
    }

    const login = await request.get("/admin/login", { maxRedirects: 0 });
    expect(login.status()).toBe(200);
    expect(login.headers()["x-robots-tag"]).toContain("noindex");
    expect(await login.text()).toMatch(/<meta name="robots" content="[^"]*noindex/i);
  });

  test("admin login exposes labelled controls and connection state", async ({
    page,
  }) => {
    await page.goto("/admin/login");

    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveCount(1);
    const emailInput = page.getByRole("textbox", { name: "Email" });
    await expect(emailInput).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    if (await emailInput.isDisabled()) {
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: "Admin sign-in is not connected yet." }),
      ).toBeVisible();
    } else {
      await expect(emailInput).toBeEnabled();
    }
  });

  test("security headers are present on public responses", async ({ request }) => {
    const headers = (await request.get("/")).headers();

    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("rss feed is served with the correct content type", async ({ request }) => {
    const response = await request.get("/feed.xml");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/rss+xml");
    expect(await response.text()).toContain("<rss");
  });

  test("article structured data uses its canonical identity", async ({ page }) => {
    await page.goto("/blogs/designing-a-learning-system");

    const script = page.locator('script[type="application/ld+json"]');
    const structuredData = JSON.parse((await script.textContent()) ?? "{}");
    const expectedUrl = `${new URL(page.url()).origin}/blogs/designing-a-learning-system`;

    expect(structuredData.url).toBe(expectedUrl);
    expect(structuredData.mainEntityOfPage).toMatchObject({
      "@type": "WebPage",
      "@id": expectedUrl,
    });
    expect(structuredData.author.name).toBeTruthy();
    expect(structuredData.publisher.name).toBeTruthy();
    expect(structuredData.dateModified).toBeTruthy();
  });
});
