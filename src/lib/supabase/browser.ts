"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

let client: SupabaseClient<Database> | null = null;

export function getBrowserSupabaseClient(): SupabaseClient<Database> | null {
  const config = getPublicSupabaseConfig();

  if (!config) {
    return null;
  }

  if (!client) {
    client = createBrowserClient<Database>(config.url, config.anonKey);
  }

  return client;
}
