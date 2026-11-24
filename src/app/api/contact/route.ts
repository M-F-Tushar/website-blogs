import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  CONTACT_SUCCESS_THROTTLE_SECONDS,
  CONTACT_THROTTLE_COOKIE,
  ContactRequestError,
  createContactThrottleCookie,
  extractClientIp,
  logContactOperationFailure,
} from "@/lib/contact/anti-abuse";
import { submitContactMessage } from "@/lib/contact/service";
import { contactMessageSchema } from "@/lib/content/validators";
import { getAppRuntimeStage } from "@/lib/supabase/env";
import { getSiteUrl, normalizeText, optionalText } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_CONTACT_BODY_BYTES = 16 * 1024;

function ensureSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  let siteOrigin: string;
  try {
    siteOrigin = new URL(getSiteUrl()).origin;
  } catch {
    throw new ContactRequestError(
      "The contact origin is not configured correctly.",
      500,
      false,
    );
  }

  if (origin !== siteOrigin) {
    throw new ContactRequestError("Cross-origin submissions are not allowed.", 403);
  }
}

async function readBoundedBody(request: Request) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (Number.isFinite(parsedLength) && parsedLength > MAX_CONTACT_BODY_BYTES) {
      throw new ContactRequestError("Request body is too large.", 413);
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return new Uint8Array();
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > MAX_CONTACT_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The caller only needs the bounded-body error.
        }

        throw new ContactRequestError("Request body is too large.", 413);
      }

      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ContactRequestError) {
      throw error;
    }

    throw new ContactRequestError("Unable to read the request body.", 400);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}

function jsonObjectToFormData(body: Uint8Array) {
  let decoded: unknown;

  try {
    decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    throw new ContactRequestError("The JSON request body is malformed.", 400);
  }

  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
    throw new ContactRequestError("The JSON request body must be an object.", 400);
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(decoded)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value !== "string") {
      throw new ContactRequestError("JSON form values must be strings.", 400);
    }

    formData.set(key, value);
  }

  return formData;
}

async function formBytesToFormData(
  request: Request,
  contentType: string,
  body: Uint8Array,
) {
  const replayBody = new ArrayBuffer(body.byteLength);
  new Uint8Array(replayBody).set(body);
  const replayedRequest = new Request(request.url, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
    },
    body: replayBody,
  });

  try {
    return await replayedRequest.formData();
  } catch {
    throw new ContactRequestError("The form request body is malformed.", 400);
  }
}

async function parseContactPayload(request: Request) {
  const originalContentType = request.headers.get("content-type")?.trim() ?? "";
  const contentType = originalContentType.split(";", 1)[0]?.trim().toLowerCase();

  if (
    contentType !== "application/json" &&
    contentType !== "application/x-www-form-urlencoded" &&
    contentType !== "multipart/form-data"
  ) {
    throw new ContactRequestError(
      "Submit the contact form using form data or JSON.",
      415,
    );
  }

  const body = await readBoundedBody(request);
  return contentType === "application/json"
    ? jsonObjectToFormData(body)
    : formBytesToFormData(request, originalContentType, body);
}

function validateContactPayload(formData: FormData) {
  return contactMessageSchema.parse({
    name: normalizeText(formData.get("name")),
    email: normalizeText(formData.get("email")),
    subject: normalizeText(formData.get("subject")),
    message: normalizeText(formData.get("message")),
    captchaToken: optionalText(formData.get("captchaToken")),
    honeypot: normalizeText(formData.get("company")),
  });
}

function clearProvisionalThrottleCookie(response: NextResponse) {
  response.cookies.set({
    name: CONTACT_THROTTLE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    const payload = validateContactPayload(await parseContactPayload(request));
    const sourceIp = extractClientIp(request.headers);
    const userAgent = request.headers.get("user-agent");
    const throttleCookie = await createContactThrottleCookie(
      CONTACT_SUCCESS_THROTTLE_SECONDS,
    );

    await submitContactMessage(payload, {
      sourceIp,
      userAgent,
    });

    const response = NextResponse.json({
      ok: true,
      message: "Your message has been received.",
    });

    response.cookies.set({
      name: CONTACT_THROTTLE_COOKIE,
      value: throttleCookie.value,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(throttleCookie.expiryUnixSeconds * 1000),
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
        error.message.includes(
          "Supabase service role environment variables are missing",
        )
      ) {
        message =
          "Local contact storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.";
      }

      logContactOperationFailure("contact_route", error.name);
    }

    const response = NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status,
      },
    );

    if (status === 400 || status === 413 || status === 415) {
      clearProvisionalThrottleCookie(response);
    }

    return response;
  }
}
