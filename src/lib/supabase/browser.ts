/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseConfig } from "@/lib/supabase/env";

let client: any = null;

export function getBrowserSupabaseClient(): any {
  const config = getPublicSupabaseConfig();

  if (!config) {
    return null;
  }

  if (!client) {
    client = createBrowserClient(config.url, config.anonKey) as any;
  }

  return client;
}
