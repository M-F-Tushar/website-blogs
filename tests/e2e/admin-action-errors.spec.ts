import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin inline action errors", () => {
  test.skip(
    !adminEmail || !adminPassword,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin action verification.",
  );

  test("invalid canonical URL stays inline and preserves the form", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(adminEmail ?? "");
    await page.getByLabel("Password").fill(adminPassword ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await page.goto("/admin/settings");
    const canonicalInput = page.getByLabel("Canonical URL");
    const invalidCanonical = "javascript:alert(1)";
    await canonicalInput.fill(invalidCanonical);
    await page.getByRole("button", { name: "Save settings" }).click();

    const alert = page.getByRole("alert").filter({ hasText: "Canonical URL" });
    await expect(alert).toContainText("Canonical URL");
    await expect(alert).toBeFocused();
    await expect(canonicalInput).toHaveValue(invalidCanonical);
    await expect(page).toHaveURL(/\/admin\/settings$/);

    await page.goto("/admin/content/posts");
    const title = "Inline post validation probe";
    const articleBody =
      "This body is long enough to prove post validation errors stay inside the authoring form.";
    await page.getByRole("textbox", { name: /^Title$/ }).fill(title);
    await page.getByLabel("Canonical URL").fill(invalidCanonical);
    await page
      .getByRole("textbox", { name: "Article markdown" })
      .fill(articleBody);
    await page.getByRole("button", { name: "Save post" }).click();

    const postAlert = page
      .getByRole("alert")
      .filter({ hasText: "Canonical URL" });
    await expect(postAlert).toBeVisible();
    await expect(postAlert).toBeFocused();
    await expect(page.getByRole("textbox", { name: /^Title$/ })).toHaveValue(
      title,
    );
    await expect(
      page.getByRole("textbox", { name: "Article markdown" }),
    ).toHaveValue(articleBody);
    await expect(page.getByLabel("Canonical URL")).toHaveValue(invalidCanonical);
  });
});
