import http, { type IncomingHttpHeaders } from "node:http";
import https from "node:https";

import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  ContactRequestError,
  extractClientIp,
} from "@/lib/contact/anti-abuse";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface ChunkedResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: {
    ok?: boolean;
    error?: string;
    message?: string;
  };
}

async function postChunked(
  baseURL: string,
  chunks: readonly (string | Buffer)[],
  contentType: string,
  cookie?: string,
): Promise<ChunkedResponse> {
  const target = new URL("/api/contact", baseURL);
  const transport = target.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Transfer-Encoding": "chunked",
      Origin: target.origin,
    };
    if (cookie) {
      headers.Cookie = cookie;
    }

    const request = transport.request(
      target,
      {
        method: "POST",
        headers,
      },
      (response) => {
        const responseChunks: Buffer[] = [];
        response.on("data", (chunk) => responseChunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          const rawBody = Buffer.concat(responseChunks).toString("utf8");
          let body: ChunkedResponse["body"] = {};

          try {
            body = JSON.parse(rawBody);
          } catch {
            // Assertions use the status and headers when a non-JSON response escapes.
          }

          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body,
          });
        });
      },
    );

    request.on("error", reject);
    for (const chunk of chunks) {
      request.write(chunk);
    }
    request.end();
  });
}

function responseCookie(response: ChunkedResponse) {
  const setCookie = response.headers["set-cookie"] ?? [];
  return setCookie
    .find((value) => value.startsWith("contact-throttle=") && !value.includes("Max-Age=0"))
    ?.split(";", 1)[0];
}

test.describe("contact route security", () => {
  test.skip(
    !supabaseUrl || !serviceRoleKey,
    "Set service-role credentials to verify persisted contact requests.",
  );

  let service: SupabaseClient;
  const cleanupEmails: string[] = [];

  test.beforeAll(() => {
    service = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    if (cleanupEmails.length > 0) {
      const { error } = await service
        .from("contact_messages")
        .delete()
        .in("email", cleanupEmails);
      expect(error, "contact security cleanup").toBeNull();
    }
  });

  test("bounds chunked bodies and clears validation failures before a retry", async ({
    baseURL,
  }) => {
    const suffix = Date.now().toString();
    const email = `contact-security-${suffix}@example.com`;
    cleanupEmails.push(email);
    const validPayload = JSON.stringify({
      name: "Contact Security Test",
      email,
      subject: `Chunked route validation ${suffix}`,
      message:
        "This chunked contact security request verifies bounded parsing, immediate retry, and persistence without leaking test records.",
      captchaToken: "",
      company: "",
    });

    const malformed = await postChunked(
      baseURL!,
      ['{"name":', '"unterminated"'],
      "application/json",
    );
    expect(malformed.status).toBe(400);
    expect(malformed.body.error).toContain("malformed");
    expect(malformed.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("contact-throttle=")]),
    );
    expect(malformed.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("Max-Age=0")]),
    );
    expect(responseCookie(malformed)).toBeUndefined();

    const splitAt = Math.floor(validPayload.length / 2);
    const firstValid = await postChunked(
      baseURL!,
      [validPayload.slice(0, splitAt), validPayload.slice(splitAt)],
      "application/json; charset=utf-8",
    );
    expect(firstValid.status).toBe(200);
    expect(firstValid.body.ok).toBe(true);

    const throttleCookie = responseCookie(firstValid);
    expect(throttleCookie).toBeTruthy();

    const repeated = await postChunked(
      baseURL!,
      [validPayload],
      "application/json",
      throttleCookie,
    );
    expect(repeated.status).toBe(429);
    expect(repeated.body.error).toContain("wait a few seconds");
  });

  test("rejects unsupported and oversized streamed bodies", async ({ baseURL }) => {
    const unsupported = await postChunked(
      baseURL!,
      ["plain text"],
      "text/plain",
    );
    expect(unsupported.status).toBe(415);
    expect(unsupported.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("Max-Age=0")]),
    );

    const oversized = await postChunked(
      baseURL!,
      [Buffer.alloc(8 * 1024, 0x61), Buffer.alloc(8 * 1024 + 1, 0x62)],
      "application/json",
    );
    expect(oversized.status).toBe(413);

    const boundary = "contact-security-boundary";
    const oversizedMultipart = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="message"\r\n\r\n`,
      ),
      Buffer.alloc(MAX_CONTACT_BODY_BYTES, 0x61),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const multipart = await postChunked(
      baseURL!,
      [oversizedMultipart.subarray(0, 4_000), oversizedMultipart.subarray(4_000)],
      `multipart/form-data; boundary=${boundary}`,
    );
    expect(multipart.status).toBe(413);
  });

  test("serializes concurrent limits and canonicalizes email casing", async ({
    baseURL,
  }) => {
    const suffix = Date.now().toString();
    const normalizedEmail = `contact-atomic-${suffix}@example.com`;
    cleanupEmails.push(normalizedEmail);

    const responses = await Promise.all(
      Array.from({ length: 7 }, (_, index) =>
        postChunked(
          baseURL!,
          [
            JSON.stringify({
              name: "Atomic Contact Test",
              email:
                index % 2 === 0
                  ? normalizedEmail.toUpperCase()
                  : normalizedEmail,
              subject: `Atomic route probe ${suffix}-${index}`,
              message: `This is an independently varied contact message ${index} for verifying that concurrent abuse limits are applied in one database transaction and cannot be bypassed.`,
              captchaToken: "",
              company: "",
            }),
          ],
          "application/json",
        ),
      ),
    );

    expect(responses.filter((response) => response.status === 200)).toHaveLength(6);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(1);

    const { data, error } = await service
      .from("contact_messages")
      .select("email")
      .eq("email", normalizedEmail);
    expect(error).toBeNull();
    expect(data).toHaveLength(6);
    expect(data?.every((row) => row.email === normalizedEmail)).toBe(true);
  });
});

const MAX_CONTACT_BODY_BYTES = 16 * 1024;

test.describe("contact anti-abuse controls", () => {
  test("requires trusted source-IP configuration on hosted stages", () => {
    const previous = {
      appEnv: process.env.APP_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      trustedHeader: process.env.TRUSTED_IP_HEADER,
    };

    try {
      process.env.APP_ENV = "staging";
      delete process.env.VERCEL_ENV;
      delete process.env.TRUSTED_IP_HEADER;

      expect(() => extractClientIp(new Headers())).toThrowError(ContactRequestError);

      process.env.TRUSTED_IP_HEADER = "x-trusted-client-ip";
      expect(() => extractClientIp(new Headers())).toThrowError(ContactRequestError);
      expect(
        extractClientIp(
          new Headers({
            "x-trusted-client-ip": "203.0.113.18, 10.0.0.1",
          }),
        ),
      ).toBe("203.0.113.18");

      delete process.env.TRUSTED_IP_HEADER;
      process.env.VERCEL_ENV = "preview";
      expect(
        extractClientIp(
          new Headers({
            "x-vercel-forwarded-for": "198.51.100.7",
          }),
        ),
      ).toBe("198.51.100.7");

      process.env.APP_ENV = "local";
      delete process.env.VERCEL_ENV;
      expect(
        extractClientIp(
          new Headers({
            "x-forwarded-for": "192.0.2.10",
          }),
        ),
      ).toBeNull();
    } finally {
      restoreEnv("APP_ENV", previous.appEnv);
      restoreEnv("VERCEL_ENV", previous.vercelEnv);
      restoreEnv("TRUSTED_IP_HEADER", previous.trustedHeader);
    }
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
