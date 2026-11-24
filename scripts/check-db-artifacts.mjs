#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const databaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const typesPath = path.resolve(process.cwd(), "src", "types", "database.ts");
const mode = process.argv[2] ?? "all";
const modes = new Set(["all", "types", "diff"]);

if (!modes.has(mode)) {
  console.error(
    "Usage: node scripts/check-db-artifacts.mjs [all|types|diff]",
  );
  process.exit(2);
}

function runSupabase(arguments_) {
  try {
    return execFileSync("npx", ["supabase", ...arguments_], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const details = error.stderr?.toString().trim() || error.message;
    throw new Error(
      `Supabase command failed (npx supabase ${arguments_.join(" ")}).\n${details}`,
    );
  }
}

function checkTypes() {
  const generated = runSupabase([
    "gen",
    "types",
    "typescript",
    "--db-url",
    databaseUrl,
  ]);
  const committed = fs.readFileSync(typesPath, "utf8");

  if (generated !== committed) {
    console.error(
      `Database type drift detected: ${path.relative(process.cwd(), typesPath)} is not current.`,
    );
    console.error(
      "Regenerate the file intentionally from the local Supabase database, review the diff, and commit it.",
    );
    return false;
  }

  console.log("Generated database types match src/types/database.ts.");
  return true;
}

function checkSchema() {
  const output = runSupabase([
    "db",
    "diff",
    "--db-url",
    databaseUrl,
    "--schema",
    "public",
    "--output-format",
    "json",
  ]);
  const result = JSON.parse(output);

  if (result._tag === "Error" || result.error) {
    throw new Error(result.error?.message ?? "Supabase db diff failed.");
  }

  if (typeof result.diff !== "string") {
    throw new Error("Supabase db diff did not return structured diff output.");
  }

  const diff = result.diff.trim();
  if (diff.length > 0) {
    console.error(
      "Database schema drift detected between supabase/migrations and the local database:",
    );
    console.error("");
    console.error(diff);
    return false;
  }

  console.log("Local public schema matches supabase/migrations.");
  return true;
}

let passed = true;

try {
  if (mode === "all" || mode === "types") {
    passed = checkTypes() && passed;
  }

  if (mode === "all" || mode === "diff") {
    passed = checkSchema() && passed;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  passed = false;
}

if (!passed) {
  process.exit(1);
}
