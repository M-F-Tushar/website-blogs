import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/content/queries";
import { absoluteUrl } from "@/lib/utils";

interface MetadataInput {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  canonicalUrl?: string | null;
  absoluteTitle?: boolean;
}

function normalizeConfiguredCanonical(
  canonicalUrl?: string | null,
  baseUrl?: string | null,
) {
  if (!canonicalUrl) {
    return null;
  }

  try {
    return new URL(canonicalUrl).toString();
  } catch {
    if (!baseUrl) {
      return null;
    }

    try {
      return new URL(canonicalUrl, baseUrl).toString();
    } catch {
      return null;
    }
  }
}

function resolveCanonicalUrl(
  path: string,
  pageCanonicalUrl?: string | null,
  siteCanonicalUrl?: string | null,
) {
  const normalizedSiteCanonical = normalizeConfiguredCanonical(siteCanonicalUrl);
  const normalizedPageCanonical = normalizeConfiguredCanonical(
    pageCanonicalUrl,
    normalizedSiteCanonical,
  );

  if (normalizedPageCanonical) {
    return normalizedPageCanonical;
  }

  if (normalizedSiteCanonical) {
    if (path === "/") {
      return normalizedSiteCanonical;
    }

    try {
      return new URL(path, normalizedSiteCanonical).toString();
    } catch {
      return absoluteUrl(path);
    }
  }

  return absoluteUrl(path);
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  canonicalUrl,
  absoluteTitle = false,
}: MetadataInput): Metadata {
  const resolvedCanonicalUrl = resolveCanonicalUrl(path, canonicalUrl);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: resolvedCanonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: resolvedCanonicalUrl,
      type: "website",
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export async function buildSiteMetadata(input: MetadataInput): Promise<Metadata> {
  const siteSettings = await getSiteSettings();
  const path = input.path ?? "/";
  const resolvedCanonicalUrl = resolveCanonicalUrl(
    path,
    input.canonicalUrl,
    siteSettings.canonicalUrl,
  );
  const normalizedSiteName = siteSettings.siteName.trim().toLowerCase();
  const normalizedTitle = input.title.trim().toLowerCase();
  const absoluteTitle =
    input.absoluteTitle ??
    (normalizedSiteName.length > 0 && normalizedTitle.includes(normalizedSiteName));

  return buildMetadata({
    ...input,
    path,
    image: input.image ?? siteSettings.ogImageUrl ?? null,
    canonicalUrl: resolvedCanonicalUrl,
    absoluteTitle,
  });
}
