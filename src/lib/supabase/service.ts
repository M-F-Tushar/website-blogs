/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";

import { getServiceRoleSupabaseConfig } from "@/lib/supabase/env";

let serviceClient: any = null;

export function createServiceRoleClient(): any {
  const config = getServiceRoleSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase service role environment variables are missing. Check .env.local.",
    );
  }

  if (!serviceClient) {
    serviceClient = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }) as any;
  }

  return serviceClient;
}
