import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("row level security", () => {
  test.skip(
    !supabaseUrl || !anonKey || !serviceRoleKey,
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to run RLS verification.",
  );

  let anon: SupabaseClient;
  let service: SupabaseClient;
  const cleanupPostIds: string[] = [];
  const cleanupCategoryIds: string[] = [];
  const cleanupAssetIds: string[] = [];

  test.beforeAll(() => {
    anon = createClient(supabaseUrl!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    service = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    if (cleanupPostIds.length > 0) {
      await service.from("posts").delete().in("id", cleanupPostIds);
    }
    if (cleanupCategoryIds.length > 0) {
      await service.from("categories").delete().in("id", cleanupCategoryIds);
    }
    if (cleanupAssetIds.length > 0) {
      await service.from("media_assets").delete().in("id", cleanupAssetIds);
    }
  });

  test("anon cannot read draft posts", async () => {
    const slug = `rls-draft-${Date.now()}`;
    const { data: created, error: insertError } = await service
      .from("posts")
      .insert({
        title: "RLS draft probe",
        slug,
        body_markdown: "Draft content that must stay private.",
        status: "draft",
      })
      .select("id")
      .single();

    expect(insertError).toBeNull();
    cleanupPostIds.push(created!.id);

    const { data: anonRows } = await anon.from("posts").select("id").eq("slug", slug);
    expect(anonRows).toEqual([]);
  });

  test("anon cannot read soft-deleted published posts", async () => {
    const slug = `rls-deleted-${Date.now()}`;
    const { data: created, error: insertError } = await service
      .from("posts")
      .insert({
        title: "RLS soft-deleted probe",
        slug,
        body_markdown: "Deleted content that must stay private.",
        status: "published",
        published_at: new Date().toISOString(),
        deleted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    expect(insertError).toBeNull();
    cleanupPostIds.push(created!.id);

    const { data: anonRows } = await anon.from("posts").select("id").eq("slug", slug);
    expect(anonRows).toEqual([]);
  });

  test("anon cannot read categories unreferenced by published posts", async () => {
    const slug = `rls-cat-${Date.now()}`;
    const { data: created, error: insertError } = await service
      .from("categories")
      .insert({ name: "RLS probe category", slug })
      .select("id")
      .single();

    expect(insertError).toBeNull();
    cleanupCategoryIds.push(created!.id);

    const { data: anonRows } = await anon
      .from("categories")
      .select("id")
      .eq("slug", slug);
    expect(anonRows).toEqual([]);
  });

  test("anon cannot read private media assets", async () => {
    const objectPath = `rls-probe/${Date.now()}.png`;
    const { data: created, error: insertError } = await service
      .from("media_assets")
      .insert({
        bucket_name: "site-admin",
        object_path: objectPath,
        mime_type: "image/png",
        is_public: false,
      })
      .select("id")
      .single();

    expect(insertError).toBeNull();
    cleanupAssetIds.push(created!.id);

    const { data: anonRows } = await anon
      .from("media_assets")
      .select("id")
      .eq("id", created!.id);
    expect(anonRows).toEqual([]);
  });

  test("anon cannot read profiles", async () => {
    const { data: anonRows } = await anon.from("profiles").select("id").limit(5);
    expect(anonRows ?? []).toEqual([]);
  });

  test("anon cannot read contact messages", async () => {
    const { data: anonRows, error } = await anon
      .from("contact_messages")
      .select("id")
      .limit(5);
    // Either an explicit permission error or an empty result is acceptable.
    if (!error) {
      expect(anonRows).toEqual([]);
    }
  });

  test("anon cannot write posts", async () => {
    const { error } = await anon.from("posts").insert({
      title: "RLS write probe",
      slug: `rls-write-${Date.now()}`,
      body_markdown: "This insert must be rejected.",
      status: "published",
    });

    expect(error).not.toBeNull();
  });

  test("anon cannot update site settings", async () => {
    const { data: updated, error } = await anon
      .from("site_settings")
      .update({ site_tagline: "hacked" })
      .eq("site_key", "primary")
      .select("site_key");

    // RLS either raises a permission error or silently affects zero rows.
    if (!error) {
      expect(updated).toEqual([]);
    }
  });
});
