import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const backend = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://invalid");
if (!["127.0.0.1", "localhost"].includes(backend.hostname)) {
  throw new Error("The live audit only permits a loopback Supabase backend.");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("The live audit requires real local Supabase credentials.");
}

const baseURL = "http://127.0.0.1:3215";

export default defineConfig({
  testDir: "./tests/live",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: "test-results/live",
  reporter: process.argv.includes("--list")
    ? "list"
    : [["list"], ["html", { outputFolder: "playwright-report/live", open: "never" }], ["json", { outputFile: "test-results/live-summary.json" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3215",
    url: baseURL,
    reuseExistingServer: process.env.LIVE_REUSE_SERVER === "1",
    timeout: 600_000,
    env: {
      ...process.env,
      APP_ENV: "local",
      VERCEL_ENV: "",
      NEXT_PUBLIC_SITE_URL: baseURL,
      NEXT_PRIVATE_BUILD_WORKER: "false",
      NODE_OPTIONS: "--max-old-space-size=1536",
      RESEND_API_KEY: "",
      CONTACT_RATE_LIMIT_SECRET: "local-live-audit-rate-limit-only-2026",
    },
  },
});