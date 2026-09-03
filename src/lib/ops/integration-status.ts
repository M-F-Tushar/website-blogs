import "server-only";

import {
  getAppRuntimeStage,
  getContactBotProtectionConfig,
  getPublicSupabaseConfig,
  hasServiceRoleEnv,
  type AppRuntimeStage,
} from "@/lib/supabase/env";

export type IntegrationState = "ok" | "warning" | "error" | "off";

export interface IntegrationStatus {
  key: string;
  label: string;
  state: IntegrationState;
  detail: string;
}

function isConfigured(value: string | undefined) {
  return Boolean(value?.trim());
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * Operator-facing view of which runtime integrations are wired up for the
 * current stage. Never exposes secret values, only presence and derived mode.
 */
export function getIntegrationStatuses(): {
  stage: AppRuntimeStage;
  items: IntegrationStatus[];
} {
  const stage = getAppRuntimeStage();
  const hosted = stage !== "local";
  const items: IntegrationStatus[] = [];

  const publicSupabase = getPublicSupabaseConfig();
  items.push(
    publicSupabase
      ? {
          key: "supabase",
          label: "Supabase (public reads, auth)",
          state: "ok",
          detail: hostOf(publicSupabase.url),
        }
      : {
          key: "supabase",
          label: "Supabase (public reads, auth)",
          state: hosted ? "error" : "warning",
          detail: hosted
            ? "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing; public pages fail closed."
            : "Not configured; local fallback content is being served.",
        },
  );

  items.push(
    hasServiceRoleEnv()
      ? {
          key: "service-role",
          label: "Supabase service role (admin writes)",
          state: "ok",
          detail: "Configured (server-only).",
        }
      : {
          key: "service-role",
          label: "Supabase service role (admin writes)",
          state: "error",
          detail: "SUPABASE_SERVICE_ROLE_KEY missing; saving content and uploads will fail.",
        },
  );

  const bot = getContactBotProtectionConfig();
  const botOptOut = process.env.CONTACT_BOT_PROTECTION?.toLowerCase() === "off";
  items.push(
    botOptOut
      ? {
          key: "turnstile",
          label: "Bot protection (Cloudflare Turnstile)",
          state: hosted ? "warning" : "off",
          detail: "Explicitly disabled via CONTACT_BOT_PROTECTION=off.",
        }
      : bot.mode === "required"
        ? {
            key: "turnstile",
            label: "Bot protection (Cloudflare Turnstile)",
            state: "ok",
            detail: "Site key and secret configured; verification enforced.",
          }
        : bot.mode === "disabled"
          ? {
              key: "turnstile",
              label: "Bot protection (Cloudflare Turnstile)",
              state: "off",
              detail: "Skipped on the local stage.",
            }
          : {
              key: "turnstile",
              label: "Bot protection (Cloudflare Turnstile)",
              state: "error",
              detail:
                "Site key or secret missing; the contact form fails closed (submissions rejected).",
            },
  );

  const rateLimitSecret = isConfigured(process.env.CONTACT_RATE_LIMIT_SECRET);
  items.push(
    rateLimitSecret
      ? {
          key: "rate-limit",
          label: "Contact throttle signing secret",
          state: "ok",
          detail: "CONTACT_RATE_LIMIT_SECRET configured.",
        }
      : {
          key: "rate-limit",
          label: "Contact throttle signing secret",
          state: hosted ? "error" : "off",
          detail: hosted
            ? "CONTACT_RATE_LIMIT_SECRET missing; contact submissions return 500."
            : "Using the built-in local development secret.",
        },
  );

  const trustedIpHeader = process.env.TRUSTED_IP_HEADER?.trim() || "x-vercel-forwarded-for";
  items.push({
    key: "client-ip",
    label: "Per-IP rate limiting",
    state: "ok",
    detail: `Reads client IP from "${trustedIpHeader}". Change TRUSTED_IP_HEADER if not on Vercel.`,
  });

  const resendKey = isConfigured(process.env.RESEND_API_KEY);
  const fromEmail = isConfigured(process.env.CONTACT_NOTIFICATION_FROM_EMAIL);
  const explicitRecipient = isConfigured(process.env.CONTACT_NOTIFICATION_EMAIL);
  items.push(
    resendKey && fromEmail
      ? {
          key: "email",
          label: "Contact email notifications (Resend)",
          state: "ok",
          detail: explicitRecipient
            ? "Sending to CONTACT_NOTIFICATION_EMAIL."
            : "Sending to the contact email from Site settings.",
        }
      : {
          key: "email",
          label: "Contact email notifications (Resend)",
          state: hosted ? "warning" : "off",
          detail: resendKey
            ? "CONTACT_NOTIFICATION_FROM_EMAIL missing; messages are stored but no email is sent."
            : "RESEND_API_KEY not set; messages are stored in the inbox only.",
        },
  );

  return { stage, items };
}
