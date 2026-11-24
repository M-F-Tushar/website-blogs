import { type NextRequest, NextResponse } from "next/server";

import {
  ContactRequestError,
  CONTACT_THROTTLE_COOKIE,
  readSignedContactThrottleExpiry,
} from "@/lib/contact/anti-abuse";

export async function enforceContactProxyThrottle(request: NextRequest) {
  try {
    if (request.method !== "POST") {
      return NextResponse.next({
        request,
      });
    }

    const activeExpiry = await readSignedContactThrottleExpiry(
      request.cookies.get(CONTACT_THROTTLE_COOKIE)?.value,
    );

    if (activeExpiry && activeExpiry > Math.floor(Date.now() / 1000)) {
      const retryAfter = Math.max(activeExpiry - Math.floor(Date.now() / 1000), 1);

      return NextResponse.json(
        {
          ok: false,
          error: "Please wait a few seconds before sending another message.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        },
      );
    }

    return NextResponse.next({
      request,
    });
  } catch (error) {
    const message =
      error instanceof ContactRequestError && error.exposeMessage
        ? error.message
        : "Contact protection is not configured correctly.";
    const status = error instanceof ContactRequestError ? error.status : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status,
      },
    );
  }
}
