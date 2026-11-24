import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function expectNoWcagViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude("#__next-route-announcer__")
    .analyze();

  expect(
    results.violations,
    `${label}: ${results.violations
      .map((violation) => `${violation.id} (${violation.nodes.length})`)
      .join(", ")}`,
  ).toEqual([]);
}

test.describe("WCAG 2.2 accessibility", () => {
  test.setTimeout(120_000);

  test("public routes have no audited WCAG violations in dark or light mode", async ({
    page,
  }) => {
    for (const theme of ["dark", "light"] as const) {
      await page.goto("/");
      await page.evaluate(
        ([key, value]) => window.localStorage.setItem(key, value),
        ["theme-preference", theme],
      );
      await page.reload();

      for (const route of [
        "/",
        "/about",
        "/blogs",
        "/academic",
        "/recommendations",
        "/contact",
        "/definitely-missing-a11y-route",
      ]) {
        await page.goto(route);
        await expectNoWcagViolations(page, `${theme} ${route}`);
      }
    }
  });

  test.skip(
    !adminEmail || !adminPassword,
    "Set E2E admin credentials to audit authenticated admin pages.",
  );

  test("admin login, dashboard, and post editor have no audited WCAG violations", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await expectNoWcagViolations(page, "admin login");

    await page.getByLabel("Email").fill(adminEmail!);
    await page.getByLabel("Password").fill(adminPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expectNoWcagViolations(page, "admin dashboard");

    await page.goto("/admin/content/posts");
    await expect(
      page.getByRole("textbox", { name: "Article markdown" }),
    ).toBeVisible();
    await expectNoWcagViolations(page, "admin post editor");
  });
});
