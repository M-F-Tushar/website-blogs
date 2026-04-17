import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? "3100");
const host = process.env.HOST ?? "127.0.0.1";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${host}:${port}`;

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --hostname ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 600_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      APP_ENV: process.env.APP_ENV ?? "local",
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? baseURL,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
    },
  },
});
