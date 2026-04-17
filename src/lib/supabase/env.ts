function isValidHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalSiteUrl(value: string | undefined) {
  if (!isValidHttpUrl(value)) {
    return false;
  }

  const parsed = new URL(value as string);
  return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
}

export type AppRuntimeStage = "local" | "staging" | "production";
export type ContactBotProtectionMode = "disabled" | "required" | "misconfigured";

export function getAppRuntimeStage(): AppRuntimeStage {
  const explicitStage = process.env.APP_ENV?.toLowerCase();
  const vercelStage = process.env.VERCEL_ENV?.toLowerCase();

  // Hosted Vercel environments should never behave like local, even if APP_ENV
  // was copied from a developer machine.
  if (vercelStage === "preview") {
    return "staging";
  }

  if (vercelStage === "production") {
    return "production";
  }

  if (explicitStage === "local" || explicitStage === "development") {
    return "local";
  }

  if (explicitStage === "staging" || explicitStage === "preview") {
    return "staging";
  }

  if (explicitStage === "production") {
    return "production";
  }

  if (isLocalSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)) {
    return "local";
  }

  return process.env.NODE_ENV === "production" ? "production" : "local";
}

function readConfiguredEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getContactBotProtectionConfig(): {
  mode: ContactBotProtectionMode;
  siteKey: string | null;
  stage: AppRuntimeStage;
} {
  const stage = getAppRuntimeStage();
  const siteKey = readConfiguredEnvValue(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const secretKey = readConfiguredEnvValue(process.env.TURNSTILE_SECRET_KEY);

  if (stage === "local") {
    return {
      mode: "disabled",
      siteKey: null,
      stage,
    };
  }

  if (siteKey && secretKey) {
    return {
      mode: "required",
      siteKey,
      stage,
    };
  }

  return {
    mode: "misconfigured",
    siteKey: null,
    stage,
  };
}

export function hasPublicSupabaseEnv() {
  return Boolean(
    isValidHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasServiceRoleEnv() {
  return Boolean(
    isValidHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getPublicSupabaseConfig() {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  };
}

export function getServiceRoleSupabaseConfig() {
  if (!hasServiceRoleEnv()) {
    return null;
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}
