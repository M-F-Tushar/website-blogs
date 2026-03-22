import { type NextRequest } from "next/server";

import { enforceContactProxyThrottle } from "@/lib/contact/proxy";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/contact") {
    return enforceContactProxyThrottle(request);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/contact"],
};
