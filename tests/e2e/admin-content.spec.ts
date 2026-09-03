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
  const createdTagSlugs = ["playwright", "e2e"];
  const createdCategorySlugs = ["testing"];

  test.afterAll(async () => {
    if (!supabaseUrl || !serviceRoleKey || createdSlugs.length === 0) {
      return;
    }

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await service.from("posts").delete().in("slug", createdSlugs);

    // Remove taxonomy rows this test introduced, unless another post still uses them.
    const { data: tags } = await service.from("tags").select("id").in("slug", createdTagSlugs);
    const tagIds = (tags ?? []).map((row) => row.id);
    if (tagIds.length > 0) {
      const { data: usedTags } = await service.from("post_tags").select("tag_id").in("tag_id", tagIds);
      const used = new Set((usedTags ?? []).map((row) => row.tag_id));
      const unused = tagIds.filter((id) => !used.has(id));
      if (unused.length > 0) {
        await service.from("tags").delete().in("id", unused);
      }
    }

    const { data: categories } = await service
      .from("categories")
      .select("id")
      .in("slug", createdCategorySlugs);
    const categoryIds = (categories ?? []).map((row) => row.id);
    if (categoryIds.length > 0) {
      const { data: usedCategories } = await service
        .from("post_categories")
        .select("category_id")
        .in("category_id", categoryIds);
      const used = new Set((usedCategories ?? []).map((row) => row.category_id));
      const unused = categoryIds.filter((id) => !used.has(id));
      if (unused.length > 0) {
        await service.from("categories").delete().in("id", unused);
      }
    }
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

    if (supabaseUrl && serviceRoleKey) {
      // Taxonomy must persist too; a schema mismatch once made tag saves fail silently.
      const service = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const [{ data: postTags }, { data: postCategories }] = await Promise.all([
        service.from("post_tags").select("tags(slug), posts!inner(slug)").eq("posts.slug", slug),
        service
          .from("post_categories")
          .select("categories(slug), posts!inner(slug)")
          .eq("posts.slug", slug),
      ]);

      const tagSlugs = (postTags ?? [])
        .map((row) => (row.tags as unknown as { slug: string } | null)?.slug)
        .sort();
      const categorySlugs = (postCategories ?? []).map(
        (row) => (row.categories as unknown as { slug: string } | null)?.slug,
      );

      expect(tagSlugs).toEqual(["e2e", "playwright"]);
      expect(categorySlugs).toEqual(["testing"]);
    }
  });
});
