import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("contact flow", () => {
  test.skip(
    !adminEmail || !adminPassword || !supabaseUrl || !serviceRoleKey,
    "Set admin and service-role credentials to run contact verification.",
  );

  let service: SupabaseClient;
  const cleanupEmails: string[] = [];

  test.beforeAll(() => {
    service = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    if (cleanupEmails.length > 0) {
      const { error } = await service
        .from("contact_messages")
        .delete()
        .in("email", cleanupEmails);
      expect(error, "contact flow cleanup").toBeNull();
    }
  });

  test("public contact submission reaches admin and repeat submits are throttled", async ({
    page,
  }) => {
    const uniqueSuffix = Date.now().toString();
    const email = `contact-e2e-${uniqueSuffix}@example.com`;
    cleanupEmails.push(email);
    const subject = `Codex contact flow ${uniqueSuffix}`;
    const message =
      "This end-to-end verification message confirms that the public contact form stores a valid message and that the admin panel can read it immediately afterward.";

    await page.goto("/contact");

    await page.getByRole("textbox", { name: "Your Name" }).fill("Contact Flow Test");
    await page.getByRole("textbox", { name: "Email Address" }).fill(email);
    await page.getByRole("textbox", { name: "Subject" }).fill(subject);
    await page.getByRole("textbox", { name: "Message" }).fill(message);
    await page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Send Message" }) })
      .evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
      });

    await expect(page.getByText("Your message has been received.")).toBeVisible();

    await page.getByRole("textbox", { name: "Your Name" }).fill("Contact Flow Test");
    await page.getByRole("textbox", { name: "Email Address" }).fill(email);
    await page.getByRole("textbox", { name: "Subject" }).fill(`${subject} retry`);
    await page.getByRole("textbox", { name: "Message" }).fill(message);
    await page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Send Message" }) })
      .evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
      });

    await expect(
      page.getByText("Please wait a few seconds before sending another message."),
    ).toBeVisible();

    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(adminEmail ?? "");
    await page.getByLabel("Password").fill(adminPassword ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await page.goto("/admin/messages");
    await expect(page.getByText(subject)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });
});
