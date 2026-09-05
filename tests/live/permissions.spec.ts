import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { test, expect, openAdmin } from "./fixtures";
import type { Database } from "../../src/types/database";

test("wrong password is rejected without granting an admin session", async ({ page, audit }) => {
  await openAdmin(page, "/admin/login");
  await page.getByLabel("Email").fill(audit.email);
  await page.getByLabel("Password").fill(`${randomUUID()}-incorrect`);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Invalid login credentials", { exact: true })).toBeVisible();
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("signed-in editor cannot open admin pages or write posts", async ({ page, audit }) => {
  const email = `${audit.prefix}-editor@example.com`;
  const password = `${randomUUID()}aA1!`;
  const slug = `${audit.prefix}-forbidden-write`;
  const created = await audit.service.auth.admin.createUser({ email, password, email_confirm: true });
  expect(created.error).toBeNull();
  const userId = created.data.user!.id;
  const client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  try {
    const profile = await audit.service.from("profiles").upsert({ id: userId, email, role: "editor" });
    expect(profile.error).toBeNull();
    await openAdmin(page, "/admin/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/login\?reason=forbidden$/);
    for (const route of ["/admin/dashboard", "/admin/content/posts", "/admin/settings", "/admin/messages", "/admin/media"]) {
      await page.goto(route);
      await expect(page, route).toHaveURL(/\/admin\/login\?reason=forbidden$/);
      await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    }
    const login = await client.auth.signInWithPassword({ email, password });
    expect(login.error).toBeNull();
    const write = await client.from("posts").insert({ title: "Forbidden audit write", slug, body_markdown: "This must never be saved.", status: "published" });
    expect(write.error?.code).toBe("42501");
    const rows = await audit.service.from("posts").select("id").eq("slug", slug);
    expect(rows.error).toBeNull();
    expect(rows.data).toEqual([]);
  } finally {
    await client.auth.signOut();
    expect((await audit.service.from("posts").delete().eq("slug", slug)).error).toBeNull();
    expect((await audit.service.auth.admin.deleteUser(userId)).error).toBeNull();
    const remaining = await audit.service.from("profiles").select("id").eq("id", userId);
    expect(remaining.error).toBeNull();
    expect(remaining.data).toEqual([]);
  }
});