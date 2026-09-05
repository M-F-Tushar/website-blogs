import { test, expect, openAdmin, submit } from "./fixtures";

for (const target of [
  { key: "home", route: "/", admin: "home", section: "featured-writing" },
  { key: "about", route: "/about", admin: "about", section: "roadmap" },
  { key: "blogs", route: "/blogs", admin: "blogs", section: "hero" },
  { key: "academic", route: "/academic", admin: "academic-page", section: "hero" },
  { key: "recommendations", route: "/recommendations", admin: "recommendations-page", section: "hero" },
  { key: "contact", route: "/contact", admin: "contact/advanced", section: "form" },
] as const) {
  test(`${target.key} section and search metadata save, render and restore`, async ({ adminPage: page, browser, audit }) => {
    const originalPage = await audit.service.from("pages").select("*").eq("page_key", target.key).single();
    expect(originalPage.error).toBeNull();
    const originalSection = await audit.service.from("page_sections").select("*").eq("page_id", originalPage.data!.id).eq("section_key", target.section).single();
    expect(originalSection.error).toBeNull();
    const visitor = await browser.newContext();
    const publicPage = await visitor.newPage();
    const route = `/admin/content/${target.admin}?edit=${originalSection.data!.id}`;
    const marker = `Verified ${target.key} section ${audit.prefix.slice(-8)}`;
    const metadata = `Verified ${target.key} search title`;
    try {
      await openAdmin(page, route);
      await page.locator('[name="heading"]').fill(marker);
      await submit(page, "Save section");
      const saved = await audit.service.from("page_sections").select("heading").eq("id", originalSection.data!.id).single();
      expect(saved.error).toBeNull();
      expect(saved.data?.heading).toBe(marker);
      await publicPage.goto(target.route);
      await expect.soft(publicPage.getByText(marker, { exact: false }).first(), `${target.key} section heading propagation`).toBeVisible();
      await openAdmin(page, route);
      await page.getByText("Page visibility and search settings", { exact: true }).click();
      await page.locator('[name="metaTitle"]').fill(metadata);
      await submit(page, "Save page settings");
      const savedPage = await audit.service.from("pages").select("meta_title").eq("id", originalPage.data!.id).single();
      expect(savedPage.error).toBeNull();
      expect(savedPage.data?.meta_title).toBe(metadata);
      await publicPage.goto(target.route);
      await expect.soft(publicPage).toHaveTitle(new RegExp(metadata));
    } finally {
      const restoredPage = await audit.service.from("pages").update(originalPage.data!).eq("id", originalPage.data!.id);
      expect(restoredPage.error).toBeNull();
      const restoredSection = await audit.service.from("page_sections").update(originalSection.data!).eq("id", originalSection.data!.id);
      expect(restoredSection.error).toBeNull();
      await openAdmin(page, route);
      await submit(page, "Save section");
      const verifiedPage = await audit.service.from("pages").select("meta_title").eq("id", originalPage.data!.id).single();
      expect(verifiedPage.error).toBeNull();
      expect(verifiedPage.data?.meta_title).toBe(originalPage.data!.meta_title);
      const verifiedSection = await audit.service.from("page_sections").select("heading").eq("id", originalSection.data!.id).single();
      expect(verifiedSection.error).toBeNull();
      expect(verifiedSection.data?.heading).toBe(originalSection.data!.heading);
      await publicPage.goto(target.route);
      await expect(publicPage.getByText(marker, { exact: false })).toHaveCount(0);
      await visitor.close();
    }
  });
}

test("quick contact links synchronize settings, page sections, public links and restore", async ({ adminPage: page, browser, audit }) => {
  const settings = await audit.service.from("site_settings").select("*").eq("site_key", "primary").single();
  const contactPage = await audit.service.from("pages").select("id").eq("page_key", "contact").single();
  expect(settings.error).toBeNull();
  expect(contactPage.error).toBeNull();
  const sections = await audit.service.from("page_sections").select("*").eq("page_id", contactPage.data!.id);
  expect(sections.error).toBeNull();
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  try {
    await openAdmin(page, "/admin/content/contact");
    await page.locator('[name="email"]').fill(`${audit.prefix}@example.com`);
    await page.locator('[name="locationLabel"]').fill("Temporary audit location");
    await submit(page, "Save quick contact links");
    const saved = await audit.service.from("site_settings").select("contact_email,location_label").eq("site_key", "primary").single();
    expect(saved.error).toBeNull();
    expect(saved.data).toMatchObject({ contact_email: `${audit.prefix}@example.com`, location_label: "Temporary audit location" });
    const savedSection = await audit.service.from("page_sections").select("heading").eq("page_id", contactPage.data!.id).eq("section_key", "email").single();
    expect(savedSection.error).toBeNull();
    expect(savedSection.data?.heading).toBe(`${audit.prefix}@example.com`);
    await publicPage.goto("/contact");
    await expect(publicPage.locator(`main a[href="mailto:${audit.prefix}@example.com"]`).first()).toBeVisible();
    await expect(publicPage.getByText("Temporary audit location", { exact: true }).first()).toBeVisible();
  } finally {
    expect((await audit.service.from("site_settings").update(settings.data!).eq("id", settings.data!.id)).error).toBeNull();
    expect((await audit.service.from("page_sections").upsert(sections.data!)).error).toBeNull();
    const originalKeys = new Set(sections.data!.map((section) => section.section_key));
    for (const key of ["email", "location", "github", "linkedin"]) {
      if (!originalKeys.has(key)) expect((await audit.service.from("page_sections").delete().eq("page_id", contactPage.data!.id).eq("section_key", key)).error).toBeNull();
    }
    const section = sections.data!.find((row) => row.section_key === "email")!;
    await openAdmin(page, `/admin/content/contact/advanced?edit=${section.id}`);
    await submit(page, "Save section");
    await publicPage.goto("/contact");
    await expect(publicPage.locator(`a[href="mailto:${audit.prefix}@example.com"]`)).toHaveCount(0);
    await visitor.close();
  }
});