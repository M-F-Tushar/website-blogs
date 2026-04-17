import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("homepage loads the main public shell", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Home \|/);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible();
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
    await expect(page.locator('main a[href^="/blogs/"] h3').first()).toBeVisible();

    await searchInput.fill("zzzz-no-match-smoke");
    await expect(
      page.getByRole("heading", { name: "No articles match that search" }),
    ).toBeVisible();

    await searchInput.fill("");
    await expect(page.locator('main a[href^="/blogs/"] h3').first()).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Let's Connect" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your Name *" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email Address *" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Subject *" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Message *" })).toBeVisible();
    await expect(page.getByText(/Local development mode is active/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Message" })).toBeEnabled();
  });
});
