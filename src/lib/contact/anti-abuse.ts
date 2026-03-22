import { getAppRuntimeStage } from "@/lib/supabase/env";

export const CONTACT_THROTTLE_COOKIE = "contact-throttle";
export const CONTACT_PROXY_THROTTLE_SECONDS = 8;
export const CONTACT_SUCCESS_THROTTLE_SECONDS = 20;

const textEncoder = new TextEncoder();
const suspiciousKeywordPatterns = [
  /guest\s*post/i,
  /backlink/i,
  /seo\s+service/i,
  /casino/i,
  /betting/i,
  /forex/i,
  /crypto\s+investment/i,
  /loan/i,
  /whatsapp/i,
  /telegram/i,
  /traffic\s+boost/i,
];

export class ContactRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly exposeMessage = true,
  ) {
    super(message);
    this.name = "ContactRequestError";
  }
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function countUrls(value: string) {
  return (value.match(/https?:\/\/|www\./gi) ?? []).length;
}

function normalizeIp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const candidate = value.trim();
  if (!candidate) {
    return null;
  }

  if (candidate.includes(",")) {
    return normalizeIp(candidate.split(",")[0]);
  }

  if (candidate.startsWith("for=")) {
    return normalizeIp(candidate.replace(/^for=/i, "").replace(/^"|"$/g, ""));
  }

  return candidate;
}

function normalizeHeaderValue(value: string | null) {
  return value?.trim() || null;
}

function getTurnstileSecretKey() {
  return process.env.TURNSTILE_SECRET_KEY ?? null;
}

function getContactThrottleSecret() {
  const explicitSecret = process.env.CONTACT_RATE_LIMIT_SECRET?.trim();
  if (explicitSecret) {
    return explicitSecret;
  }

  if (getAppRuntimeStage() === "local") {
    return "local-contact-dev-secret";
  }

  throw new ContactRequestError(
    "Contact rate limiting is not configured correctly.",
    500,
    false,
  );
}

async function signValue(value: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getContactThrottleSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, textEncoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createSignedContactThrottleValue(expiryUnixSeconds: number) {
  const payload = String(expiryUnixSeconds);
  const signature = await signValue(payload);
  return `${payload}.${signature}`;
}

export async function readSignedContactThrottleExpiry(cookieValue: string | null | undefined) {
  if (!cookieValue) {
    return null;
  }

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signValue(payload);
  if (signature !== expectedSignature) {
    return null;
  }

  const expiryUnixSeconds = Number(payload);
  return Number.isFinite(expiryUnixSeconds) ? expiryUnixSeconds : null;
}

export async function createContactThrottleCookie(secondsFromNow: number) {
  const expiryUnixSeconds = Math.floor(Date.now() / 1000) + secondsFromNow;
  return {
    value: await createSignedContactThrottleValue(expiryUnixSeconds),
    expiryUnixSeconds,
  };
}

export function extractClientIp(headers: Headers) {
  const candidates = [
    normalizeHeaderValue(headers.get("cf-connecting-ip")),
    normalizeHeaderValue(headers.get("x-real-ip")),
    normalizeHeaderValue(headers.get("x-vercel-forwarded-for")),
    normalizeHeaderValue(headers.get("x-forwarded-for")),
    normalizeHeaderValue(headers.get("forwarded")),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIp(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export async function verifyTurnstileToken(token: string | null, sourceIp: string | null) {
  const stage = getAppRuntimeStage();
  const secret = getTurnstileSecretKey();

  if (!secret) {
    if (stage === "local") {
      return;
    }

    throw new ContactRequestError(
      "Bot protection is not configured correctly.",
      500,
      false,
    );
  }

  if (!token) {
    throw new ContactRequestError(
      "Complete the bot protection check and try again.",
      400,
    );
  }

  const payload = new URLSearchParams({
    secret,
    response: token,
  });

  if (sourceIp) {
    payload.set("remoteip", sourceIp);
  }

  let response: Response;

  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    });
  } catch {
    throw new ContactRequestError(
      "Bot protection verification is temporarily unavailable.",
      502,
      false,
    );
  }

  if (!response.ok) {
    throw new ContactRequestError(
      "Bot protection verification is temporarily unavailable.",
      502,
      false,
    );
  }

  const result = (await response.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };

  if (!result.success) {
    throw new ContactRequestError(
      "Bot protection verification failed. Please try again.",
      400,
    );
  }
}

export function buildSubmissionFingerprint(input: {
  email: string;
  message: string;
  sourceIp: string | null;
  userAgent: string | null;
}) {
  const normalized = [
    input.email.trim().toLowerCase(),
    input.message.trim().toLowerCase().replace(/\s+/g, " "),
    input.sourceIp ?? "",
    input.userAgent ?? "",
  ].join("|");
  return normalized;
}

export function evaluateContactSubmission(input: {
  name: string;
  subject: string;
  message: string;
  duplicateMessageCount: number;
  recentEmailCount: number;
  fingerprintCount: number;
}) {
  const flags: string[] = [];
  let score = 0;
  let rejectReason: string | null = null;

  const urlCount = countUrls(`${input.subject}\n${input.message}`);
  if (urlCount >= 3) {
    flags.push("many_links");
    score += 20;
  }

  if (urlCount > 5) {
    rejectReason = "Too many links in the submission.";
  }

  const suspiciousKeywords = suspiciousKeywordPatterns
    .filter((pattern) => pattern.test(`${input.subject}\n${input.message}`))
    .map((pattern) => pattern.source);

  if (suspiciousKeywords.length > 0) {
    flags.push("suspicious_keywords");
    score += 25;
  }

  if (/(.)\1{6,}/.test(input.message)) {
    flags.push("repeated_characters");
    score += 15;
  }

  const words = input.message
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  const uniqueWords = new Set(words);

  if (words.length > 12 && uniqueWords.size / words.length < 0.45) {
    flags.push("low_word_diversity");
    score += 15;
  }

  const alphaCharacters = (input.message.match(/[a-z]/gi) ?? []).length;
  if (alphaCharacters < 20) {
    flags.push("low_alpha_content");
    score += 15;
  }

  if (input.message.length < 80) {
    flags.push("short_message");
    score += 10;
  }

  if (input.duplicateMessageCount > 0) {
    flags.push("duplicate_message");
    score += 30;
  }

  if (input.recentEmailCount >= 3) {
    flags.push("high_email_velocity");
    score += 20;
  }

  if (input.fingerprintCount >= 2) {
    flags.push("fingerprint_reuse");
    score += 20;
  }

  const suspiciousName = input.name.replace(/[^a-z]/gi, "").length < 2;
  if (suspiciousName) {
    flags.push("weak_name_signal");
    score += 10;
  }

  if (!rejectReason && score >= 70) {
    rejectReason = "This submission looks automated or abusive. Please revise it and try again.";
  }

  return {
    score,
    flags,
    rejectReason,
  };
}
