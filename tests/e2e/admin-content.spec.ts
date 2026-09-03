import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("admin content flow", () => {
  test.skip(
    !adminEmail || !adminPassword,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin content verification.",
  );

  const createdSlugs: string[] = [];

  test.afterAll(async () => {
    if (!supabaseUrl || !serviceRoleKey || createdSlugs.length === 0) {
      return;
    }

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await service.from("posts").delete().in("slug", createdSlugs);
  });

  test("admin can publish a post and see it publicly", async ({ page }) => {
    const uniqueSuffix = Date.now().toString();
    const title = `Codex E2E Post ${uniqueSuffix}`;
    const slug = `codex-e2e-post-${uniqueSuffix}`;
    createdSlugs.push(slug);
    const body =
      "This post was created by the authenticated Playwright content-flow test to prove that admin publishing reaches the public site end to end.";

    await page.goto("/admin/login");

    await page.getByLabel("Email").fill(adminEmail ?? "");
    await page.getByLabel("Password").fill(adminPassword ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    const integrations = page.getByRole("list", { name: "Integration status" });
    await expect(integrations).toBeVisible();
    await expect(integrations.getByText("Supabase (public reads, auth)")).toBeVisible();
    await expect(integrations.getByText("Supabase service role (admin writes)")).toBeVisible();
    await expect(page.getByText(/^(eyJ|sb_secret_|sb_publishable_)/)).toHaveCount(0);

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
    // The archive is paginated; search narrows to the new post regardless of volume.
    await page.getByPlaceholder("Search articles...").fill(uniqueSuffix);
    await expect(page.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();
  });
});
