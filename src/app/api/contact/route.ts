import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  CONTACT_SUCCESS_THROTTLE_SECONDS,
  ContactRequestError,
  CONTACT_THROTTLE_COOKIE,
  createContactThrottleCookie,
  extractClientIp,
} from "@/lib/contact/anti-abuse";
import { submitContactMessage } from "@/features/admin/content-actions";
import { getAppRuntimeStage } from "@/lib/supabase/env";

export const runtime = "nodejs";

async function parseContactPayload(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    return request.formData();
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    const formData = new FormData();

    for (const [key, value] of Object.entries(body)) {
      if (value === null || value === undefined) {
        continue;
      }

      formData.set(key, String(value));
    }

    return formData;
  }

  throw new ContactRequestError(
    "Submit the contact form using form data or JSON.",
    415,
  );
}

export async function POST(request: Request) {
  try {
    const formData = await parseContactPayload(request);
    const sourceIp = extractClientIp(request.headers);
    const userAgent = request.headers.get("user-agent");

    await submitContactMessage(formData, {
      sourceIp,
      userAgent,
    });

    const response = NextResponse.json({
      ok: true,
      message: "Your message has been received.",
    });
    const cookie = await createContactThrottleCookie(CONTACT_SUCCESS_THROTTLE_SECONDS);

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
    let status = 500;
    let message = "Unable to submit your message right now.";

    if (error instanceof ZodError) {
      status = 400;
      message =
        error.issues[0]?.message ?? "Check the contact form fields and try again.";
    } else if (error instanceof ContactRequestError) {
      status = error.status;
      message = error.exposeMessage ? error.message : message;
    } else if (error instanceof Error) {
      if (
        getAppRuntimeStage() === "local" &&
        error.message.includes("Supabase service role environment variables are missing")
      ) {
        message =
          "Local contact storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.";
      }

      console.error("Unexpected contact submission failure", error);
    }

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
