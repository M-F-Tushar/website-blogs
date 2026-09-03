#!/usr/bin/env node
/**
 * Verifies that the linked (remote) Supabase project's migration ledger matches
 * supabase/migrations exactly, and prints the repair commands if it does not.
 *
 * Exit codes: 0 in sync, 1 drift detected, 2 CLI/link error.
 *
 * Usage:
 *   npm run db:check           # against the linked project (requires `supabase link`)
 *   npm run db:check -- --local
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const target = process.argv.includes("--local") ? "--local" : "--linked";

const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
const localVersions = fs
  .readdirSync(migrationsDir)
  .filter((file) => /^\d{14}_.+\.sql$/.test(file))
  .map((file) => file.slice(0, 14))
  .sort();

let output;
try {
  output = execFileSync(
    "npx",
    ["supabase", "migration", "list", target, "--output-format", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (error) {
  output = error.stdout?.toString() ?? "";
  if (!output.includes("{")) {
    console.error(`Could not read the ${target.slice(2)} migration ledger.`);
    console.error(error.stderr?.toString().trim() || error.message);
    process.exit(2);
  }
}

const jsonStart = output.indexOf("{");
const parsed = JSON.parse(output.slice(jsonStart));

if (parsed._tag === "Error" || parsed.error) {
  const message = parsed.error?.message ?? "Unknown CLI error";
  console.error(`Could not read the ${target.slice(2)} migration ledger: ${message}`);
  if (/link/i.test(message)) {
    console.error("Run `npx supabase link --project-ref <ref>` first.");
  }
  process.exit(2);
}

const rows = parsed.migrations ?? [];

const remoteApplied = new Set(rows.map((row) => row.remote).filter(Boolean));
const remoteOnly = rows.filter((row) => row.remote && !row.local).map((row) => row.remote);
const missingRemote = localVersions.filter((version) => !remoteApplied.has(version));

console.log(`Local migrations:  ${localVersions.length}`);
console.log(`Remote applied:    ${remoteApplied.size}`);

if (missingRemote.length === 0 && remoteOnly.length === 0) {
  console.log("Ledger in sync. `supabase db push` is safe.");
  process.exit(0);
}

console.log("");
console.log("DRIFT DETECTED — do not run `supabase db push` until this is resolved.");

if (missingRemote.length > 0) {
  console.log("");
  console.log("Tracked migrations not recorded remotely:");
  for (const version of missingRemote) {
    console.log(`  ${version}`);
  }
  console.log("");
  console.log(
    "If these were already applied by hand (see scripts/db/README.md), mark them applied:",
  );
  console.log(
    `  npx supabase migration repair ${target} --status applied ${missingRemote.join(" ")}`,
  );
  console.log("");
  console.log(
    "If a version was genuinely never applied, run `npx supabase db push --dry-run` first and review the SQL.",
  );
}

if (remoteOnly.length > 0) {
  console.log("");
  console.log("Remote ledger has versions with no local file (mark reverted or add the file):");
  for (const version of remoteOnly) {
    console.log(`  ${version}`);
  }
  console.log(`  npx supabase migration repair ${target} --status reverted ${remoteOnly.join(" ")}`);
}

process.exit(1);
