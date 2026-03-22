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

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
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
