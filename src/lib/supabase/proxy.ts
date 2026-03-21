import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicSupabaseConfig } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const config = getPublicSupabaseConfig();

  if (!config) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Force auth revalidation so refreshed cookies are written by Proxy,
  // not deferred to Server Components that cannot persist them reliably.
  await supabase.auth.getUser();

  return response;
}
