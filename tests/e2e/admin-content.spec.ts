import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin content flow", () => {
  test.skip(
    !adminEmail || !adminPassword,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin content verification.",
  );

  test("admin can publish a post and see it publicly", async ({ page }) => {
    const uniqueSuffix = Date.now().toString();
    const title = `Codex E2E Post ${uniqueSuffix}`;
    const slug = `codex-e2e-post-${uniqueSuffix}`;
    const body =
      "This post was created by the authenticated Playwright content-flow test to prove that admin publishing reaches the public site end to end.";

    await page.goto("/admin/login");

    await page.getByLabel("Email").fill(adminEmail ?? "");
    await page.getByLabel("Password").fill(adminPassword ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await page.goto("/admin/content/posts");
    await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();

    await page.getByRole("textbox", { name: /^Title$/ }).fill(title);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Status").selectOption("published");
    await page.getByLabel("Published at").fill("2026-04-09T09:00");
    await page.getByLabel("Categories").fill("Testing");
    await page.getByLabel("Tags").fill("playwright, e2e");
    await page.getByLabel("Excerpt").fill(
      "End-to-end verification draft created by the automated admin content test.",
    );
    await page.locator('textarea[name="bodyMarkdown"]').fill(body);

    await page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Save post" }) })
      .evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
      });

    await expect(page).toHaveURL(/\/admin\/content\/posts\?edit=.*saved=1/, {
      timeout: 20_000,
    });

    await page.goto(`/blogs/${slug}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText(body)).toBeVisible();

    await page.goto("/blogs");
    await expect(page.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();
  });
});
