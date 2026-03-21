import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const [, , email, password, ...nameParts] = process.argv;

function loadEnvFile(fileName) {
  const envPath = path.resolve(process.cwd(), fileName);

  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your environment variables.",
  );
  process.exit(1);
}

if (!email) {
  console.error(
    "Usage: npm run bootstrap-admin -- admin@example.com [password] [Full Name]",
  );
  process.exit(1);
}

const fullName = nameParts.join(" ").trim() || null;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function main() {
  const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  let user = listedUsers.users.find(
    (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    if (!password) {
      throw new Error(
        "No existing auth user found for that email. Provide a password to create one.",
      );
    }

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : undefined,
    });

    if (createError) {
      throw createError;
    }

    user = createdUser.user;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName ?? user.user_metadata?.full_name ?? null,
      role: "admin",
    },
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    throw profileError;
  }

  console.log(`Admin access ensured for ${email}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
