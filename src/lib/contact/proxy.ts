import { type NextRequest, NextResponse } from "next/server";

import {
  CONTACT_PROXY_THROTTLE_SECONDS,
  ContactRequestError,
  CONTACT_THROTTLE_COOKIE,
  createContactThrottleCookie,
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

    const response = NextResponse.next({
      request,
    });
    const cookie = await createContactThrottleCookie(CONTACT_PROXY_THROTTLE_SECONDS);

    response.cookies.set({
      name: CONTACT_THROTTLE_COOKIE,
      value: cookie.value,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(cookie.expiryUnixSeconds * 1000),
    });

    return response;
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
