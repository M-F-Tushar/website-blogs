import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Capture values set explicitly by the operator/CI before .env.local is merged,
// so a developer's local site URL cannot break the same-origin contact check.
const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const explicitAppEnv = process.env.APP_ENV;

// Make local Supabase credentials available to the test process (the Next.js
// web server loads .env.local on its own).
dotenv.config({ path: ".env.local", quiet: true });

const port = Number(process.env.PORT ?? "3205");
const host = process.env.HOST ?? "127.0.0.1";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${host}:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
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
      APP_ENV: explicitAppEnv ?? "local",
      NEXT_PUBLIC_SITE_URL: explicitSiteUrl ?? baseURL,
    },
  },
});
