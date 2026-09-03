import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicSupabaseConfig } from "@/lib/supabase/env";

function isProtectedAdminPath(pathname: string) {
  return pathname.startsWith("/admin") && pathname !== "/admin/login";
}

function redirectToLogin(request: NextRequest, sessionResponse?: NextResponse) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  const redirectResponse = NextResponse.redirect(loginUrl);

  // Preserve any refreshed/cleared auth cookies from the session check.
  sessionResponse?.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const config = getPublicSupabaseConfig();
  const protectedPath = isProtectedAdminPath(request.nextUrl.pathname);

  if (!config) {
    // No backend means no session can exist; only the login page is reachable.
    return protectedPath ? redirectToLogin(request) : NextResponse.next({ request });
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Early, cheap gate: anonymous requests never reach protected admin segments.
  // Role authorization still happens server-side in requireAdminSession().
  if (!user && protectedPath) {
    return redirectToLogin(request, response);
  }

  return response;
}
