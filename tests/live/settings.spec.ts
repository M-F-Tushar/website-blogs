import { test, expect, submit, openAdmin } from "./fixtures";

test("site settings save reaches database and footer, then restores original values", async ({ adminPage: page, browser, audit }) => {
  const original = await audit.service.from("site_settings").select("*").eq("site_key", "primary").single();
  expect(original.error).toBeNull();
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  const marker = `Temporary footer verification ${audit.prefix}`;
  try {
    await openAdmin(page, "/admin/settings");
    await page.locator('[name="footerBlurb"]').fill(marker);
    await expect(page.locator('[name="footerBlurb"]')).toHaveValue(marker);
    await submit(page, "Save settings");
    const saved = await audit.service.from("site_settings").select("footer_blurb").eq("site_key", "primary").single();
    expect(saved.error).toBeNull();
    expect(saved.data?.footer_blurb).toBe(marker);
    await publicPage.goto("/");
    await expect(publicPage.locator("footer")).toContainText(marker);
    await page.goto("/admin/seo");
    await page.getByRole("link", { name: "Edit settings", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/settings$/);
  } finally {
    await openAdmin(page, "/admin/settings");
    await page.locator('[name="footerBlurb"]').fill(original.data!.footer_blurb ?? "");
    await submit(page, "Save settings");
    const restored = await audit.service.from("site_settings").select("*").eq("site_key", "primary").single();
    expect(restored.error).toBeNull();
    const { updated_at: originalTimestamp, ...originalContent } = original.data!;
    const { updated_at: restoredTimestamp, ...restoredContent } = restored.data!;
    expect(typeof originalTimestamp).toBe(typeof restoredTimestamp);
    const emergencyRestore = await audit.service.from("site_settings").update(originalContent).eq("id", originalContent.id);
    expect(emergencyRestore.error).toBeNull();
    expect(restoredContent).toEqual(originalContent);
    await publicPage.goto("/");
    await expect(publicPage.locator("footer")).not.toContainText(marker);
    await visitor.close();
  }
});

test("navigation create, hide, restore and delete reach the public footer", async ({ adminPage: page, browser, audit }) => {
  const label = `Audit link ${audit.prefix}`;
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  try {
    await openAdmin(page, "/admin/navigation");
    await page.locator('[name="label"]').fill(label);
    await page.locator('[name="href"]').fill("/about");
    await page.locator('[name="location"]').selectOption("footer");
    await submit(page, "Save item");
    const saved = await audit.service.from("navigation_items").select("id, is_visible, href").eq("label", label).single();
    expect(saved.error).toBeNull();
    expect(saved.data).toMatchObject({ is_visible: true, href: "/about" });
    await publicPage.goto("/");
    await expect(publicPage.locator("footer").getByRole("link", { name: label, exact: true })).toBeVisible();
    await publicPage.locator("footer").getByRole("link", { name: label, exact: true }).click();
    await expect(publicPage).toHaveURL(/\/about$/);
    await openAdmin(page, `/admin/navigation?edit=${saved.data!.id}`);
    await page.locator('[name="isVisible"]').uncheck();
    await submit(page, "Save item");
    expect((await audit.service.from("navigation_items").select("is_visible").eq("id", saved.data!.id).single()).data?.is_visible).toBe(false);
    await publicPage.goto("/");
    await expect(publicPage.getByRole("link", { name: label, exact: true })).toHaveCount(0);
    await openAdmin(page, `/admin/navigation?edit=${saved.data!.id}`);
    await page.locator('[name="isVisible"]').check();
    await submit(page, "Save item");
    await publicPage.goto("/");
    await expect(publicPage.locator("footer").getByRole("link", { name: label, exact: true })).toBeVisible();
    await openAdmin(page, `/admin/navigation?edit=${saved.data!.id}`);
    await submit(page, "Delete item");
    const deleted = await audit.service.from("navigation_items").select("id").eq("id", saved.data!.id);
    expect(deleted.error).toBeNull();
    expect(deleted.data).toEqual([]);
    await publicPage.goto("/");
    await expect(publicPage.getByRole("link", { name: label, exact: true })).toHaveCount(0);
  } finally {
    const cleanup = await audit.service.from("navigation_items").delete().eq("label", label);
    expect(cleanup.error).toBeNull();
    await visitor.close();
  }
});