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

export type AppRuntimeStage = "local" | "staging" | "production";

export function getAppRuntimeStage(): AppRuntimeStage {
  const explicitStage = process.env.APP_ENV?.toLowerCase();

  if (explicitStage === "local" || explicitStage === "development") {
    return "local";
  }

  if (explicitStage === "staging" || explicitStage === "preview") {
    return "staging";
  }

  if (explicitStage === "production") {
    return "production";
  }

  const vercelStage = process.env.VERCEL_ENV?.toLowerCase();
  if (vercelStage === "preview") {
    return "staging";
  }

  if (vercelStage === "production") {
    return "production";
  }

  return process.env.NODE_ENV === "production" ? "production" : "local";
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
