import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServiceRoleSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

let serviceClient: SupabaseClient<Database> | null = null;

export function createServiceRoleClient(): SupabaseClient<Database> {
  const config = getServiceRoleSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase service role environment variables are missing. Check .env.local.",
    );
  }

  if (!serviceClient) {
    serviceClient = createClient<Database>(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serviceClient;
}
