import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("media upload security", () => {
  test.skip(
    !adminEmail || !adminPassword || !supabaseUrl || !serviceRoleKey,
    "Set admin and service-role credentials to run upload verification.",
  );

  let service: SupabaseClient;
  const cleanupLabels: string[] = [];

  test.beforeAll(() => {
    service = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    if (cleanupLabels.length === 0) {
      return;
    }

    const { data, error } = await service
      .from("media_assets")
      .select("id, bucket_name, object_path")
      .in("label", cleanupLabels);
    expect(error, "upload security lookup cleanup").toBeNull();

    const rows = data ?? [];
    for (const bucketName of new Set(rows.map((row) => row.bucket_name))) {
      const paths = rows
        .filter((row) => row.bucket_name === bucketName)
        .map((row) => row.object_path);
      const { error: storageError } = await service.storage.from(bucketName).remove(paths);
      expect(storageError, "upload storage cleanup").toBeNull();
    }

    if (rows.length > 0) {
      const { error: deleteError } = await service
        .from("media_assets")
        .delete()
        .in(
          "id",
          rows.map((row) => row.id),
        );
      expect(deleteError, "upload metadata cleanup").toBeNull();
    }
  });

  test("rejects SVG bytes declared as PNG and stores verified PNG bytes", async ({
    page,
  }) => {
    const suffix = Date.now().toString();
    const spoofedLabel = `Upload spoof probe ${suffix}`;
    const validLabel = `Upload valid probe ${suffix}`;
    cleanupLabels.push(spoofedLabel, validLabel);

    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(adminEmail!);
    await page.getByLabel("Password").fill(adminPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await page.goto("/admin/media");
    await page.getByLabel("File").setInputFiles({
      name: "declared-safe.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      ),
    });
    await page.getByLabel("Label").fill(spoofedLabel);
    await page.getByLabel("Alt text").fill("Spoofed SVG rejection probe");
    await page.getByRole("button", { name: "Upload asset" }).click();

    await expect(
      page.getByText("Unsupported file type. Upload a PNG, JPEG, WebP, AVIF, or GIF."),
    ).toBeVisible();

    const { data: spoofedRows, error: spoofedError } = await service
      .from("media_assets")
      .select("id")
      .eq("label", spoofedLabel);
    expect(spoofedError).toBeNull();
    expect(spoofedRows).toEqual([]);

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    await page.getByLabel("File").setInputFiles({
      name: "verified.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.getByLabel("Label").fill(validLabel);
    await page.getByLabel("Alt text").fill("Verified PNG upload probe");
    await page.getByRole("button", { name: "Upload asset" }).click();

    await expect(page).toHaveURL(/\/admin\/media\?uploaded=1$/);
    await expect(page.getByText("Media asset uploaded successfully.")).toBeVisible();

    const { data: stored, error: storedError } = await service
      .from("media_assets")
      .select("id, bucket_name, object_path, mime_type, file_size")
      .eq("label", validLabel)
      .single();
    expect(storedError).toBeNull();
    expect(stored?.bucket_name).toBe("site-public");
    expect(stored?.object_path).toMatch(/\.png$/);
    expect(stored?.mime_type).toBe("image/png");
    expect(stored?.file_size).toBe(png.byteLength);

    const storedCard = page
      .getByText(validLabel, { exact: true })
      .locator("xpath=ancestor::div[contains(@class, 'rounded-[1.25rem]')][1]");
    const { error: pageReferenceError } = await service
      .from("pages")
      .update({ og_image_asset_id: stored!.id })
      .eq("page_key", "home");
    expect(pageReferenceError).toBeNull();

    page.once("dialog", (dialog) => dialog.accept());
    await storedCard.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "still used by site content" }),
    ).toBeVisible();
    await expect(page.getByText(validLabel, { exact: true })).toBeVisible();

    const { error: clearReferenceError } = await service
      .from("pages")
      .update({ og_image_asset_id: null })
      .eq("page_key", "home");
    expect(clearReferenceError).toBeNull();

    page.once("dialog", (dialog) => dialog.accept());
    await storedCard.getByRole("button", { name: "Delete" }).click();

    await expect(page).toHaveURL(/\/admin\/media\?deleted=1$/);
    await expect(page.getByText("Media asset deleted successfully.")).toBeVisible();
    await expect(page.getByText(validLabel, { exact: true })).toHaveCount(0);

    const { data: deletedRows, error: deletedError } = await service
      .from("media_assets")
      .select("id")
      .eq("label", validLabel);
    expect(deletedError).toBeNull();
    expect(deletedRows).toEqual([]);
  });
});
