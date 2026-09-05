import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { test as base, expect, type Page } from "@playwright/test";
import type { Database } from "../../src/types/database";

type Client = SupabaseClient<Database>;
type Audit = {
  service: Client;
  anon: Client;
  email: string;
  password: string;
  prefix: string;
};

export async function openAdmin(page: Page, route: string) {
  await page.goto(route);
  await page.waitForFunction(() => Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'))
    .every((element) => Object.keys(element).some((key) => key.startsWith("__reactProps$"))));
}

export async function submit(page: Page, name: string) {
  const pathname = new URL(page.url()).pathname;
  const pending = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname === pathname,
  );
  await page.getByRole("button", { name, exact: true }).click();
  const response = await pending;
  expect(response.status(), `submit ${name}`).toBeLessThan(400);
  const redirect = response.headers()["x-action-redirect"]?.split(";")[0];
  if (redirect) {
    await expect(page).toHaveURL(new URL(redirect, response.url()).href);
  }
  await expect(page.getByText("Application error:", { exact: false })).toHaveCount(0);
}

export const test = base.extend<{ adminPage: Page }, { audit: Audit }>({
  audit: [async ({ browser }, provide) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    expect(["127.0.0.1", "localhost"]).toContain(new URL(url).hostname);
    const options = { auth: { autoRefreshToken: false, persistSession: false } };
    const service = createClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, options);
    const anon = createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, options);
    const prefix = `live-audit-${randomUUID()}`;
    const email = `${prefix}@example.com`;
    const password = `${randomUUID()}aA1!`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    expect(error).toBeNull();
    const user = data.user!;
    const maintenance = await browser.newContext({ baseURL: "http://127.0.0.1:3215" });
    const maintenancePage = await maintenance.newPage();
    const refreshPublicCache = async () => {
      const navigation = await service.from("navigation_items").insert({
        label: `${prefix}-cache-refresh`, href: "/about", location: "footer", is_visible: false,
      }).select("id").single();
      expect(navigation.error).toBeNull();
      await openAdmin(maintenancePage, `/admin/navigation?edit=${navigation.data!.id}`);
      await submit(maintenancePage, "Delete item");
      const remaining = await service.from("navigation_items").select("id").eq("id", navigation.data!.id);
      expect(remaining.error).toBeNull();
      expect(remaining.data).toEqual([]);
    };
    try {
      const profile = await service.from("profiles").upsert({ id: user.id, email, role: "admin" });
      expect(profile.error).toBeNull();
      await openAdmin(maintenancePage, "/admin/login");
      await maintenancePage.getByLabel("Email").fill(email);
      await maintenancePage.getByLabel("Password").fill(password);
      await maintenancePage.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(maintenancePage).toHaveURL(/\/admin\/dashboard$/);
      await refreshPublicCache();
      await provide({ service, anon, email, password, prefix });
    } finally {
      try {
        for (const table of ["posts", "academic_entries", "recommendations", "categories", "tags", "recommendation_categories"] as const) {
          const cleanup = await service.from(table).delete().like("slug", `${prefix}%`);
          expect(cleanup.error, `cleanup ${table}`).toBeNull();
          const remaining = await service.from(table).select("id").like("slug", `${prefix}%`);
          expect(remaining.error).toBeNull();
          expect(remaining.data, `remaining ${table}`).toEqual([]);
        }
        await refreshPublicCache();
      } finally {
        const navigation = await service.from("navigation_items").delete().eq("label", `${prefix}-cache-refresh`);
        expect(navigation.error).toBeNull();
        const deletion = await service.auth.admin.deleteUser(user.id);
        expect(deletion.error).toBeNull();
        await maintenance.close();
      }
    }
  }, { scope: "worker", auto: true }],
  adminPage: async ({ page, audit }, provide) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(audit.email);
    await page.getByLabel("Password").fill(audit.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await provide(page);
  },
});

export { expect };