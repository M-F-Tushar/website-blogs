import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { getAppRuntimeStage } from "@/lib/supabase/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDisplayDate(value: string | null | undefined) {
  if (!value) {
    return "Draft";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function normalizeText(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function optionalText(value: FormDataEntryValue | string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

export function normalizeEmailAddress(
  value: FormDataEntryValue | string | null | undefined,
) {
  const normalized = normalizeText(value)
    .replace(/^mailto:/i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export function normalizeLegacyBrandCopy(value: string | null | undefined) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  return value.replace(/Arian's Lab Notes/gi, "Tusher's Blog");
}

export function toBoolean(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") {
    return false;
  }

  return value === "true" || value === "on" || value === "1";
}

export function parseDelimitedList(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function safeJsonParse(value: string | null | undefined) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function parseJsonObject(value: string | null | undefined, fieldName = "JSON") {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be a JSON object.`);
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message.includes("must be a JSON object")) {
      throw error;
    }

    throw new Error(`${fieldName} must be valid JSON.`);
  }
}

export function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptFromMarkdown(markdown: string, length = 180) {
  const plainText = stripMarkdown(markdown);
  if (plainText.length <= length) {
    return plainText;
  }

  return `${plainText.slice(0, length).trim()}...`;
}

export function countWords(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const plainText = stripMarkdown(value);
  if (!plainText) {
    return 0;
  }

  return plainText.split(/\s+/).filter(Boolean).length;
}

export function estimateReadingTime(value: string | null | undefined, wordsPerMinute = 200) {
  const wordCount = countWords(value);

  if (wordCount === 0) {
    return "1 min read";
  }

  return `${Math.max(1, Math.ceil(wordCount / wordsPerMinute))} min read`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function getSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    try {
      const url = new URL(configuredSiteUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      // Fall through to environment-aware handling below.
    }
  }

  if (getAppRuntimeStage() === "local") {
    return "http://localhost:3000";
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL must be configured for staging and production deployments.",
  );
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function getSupabaseStoragePublicUrl(bucketName: string, objectPath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${objectPath}`;
}
