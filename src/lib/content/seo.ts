import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/content/queries";
import { absoluteUrl } from "@/lib/utils";

interface MetadataInput {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  canonicalUrl?: string | null;
  includeCanonical?: boolean;
  absoluteTitle?: boolean;
  ogType?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

const RSS_ALTERNATE_TYPE = "application/rss+xml";

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
  includeCanonical = true,
  absoluteTitle = false,
  ogType = "website",
  publishedTime,
  modifiedTime,
}: MetadataInput): Metadata {
  const resolvedCanonicalUrl = includeCanonical
    ? resolveCanonicalUrl(path, canonicalUrl)
    : null;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      ...(resolvedCanonicalUrl ? { canonical: resolvedCanonicalUrl } : {}),
      types: {
        [RSS_ALTERNATE_TYPE]: "/feed.xml",
      },
    },
    openGraph: {
      title,
      description,
      ...(resolvedCanonicalUrl ? { url: resolvedCanonicalUrl } : {}),
      type: ogType,
      ...(ogType === "article" && publishedTime
        ? { publishedTime }
        : {}),
      ...(ogType === "article" && modifiedTime ? { modifiedTime } : {}),
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
  const resolvedCanonicalUrl =
    input.includeCanonical === false
      ? null
      : resolveCanonicalUrl(
          path,
          input.canonicalUrl,
          siteSettings.canonicalUrl,
        );
  const normalizedSiteName = siteSettings.siteName.trim().toLowerCase();
  const normalizedTitle = input.title.trim().toLowerCase();
  const absoluteTitle =
    input.absoluteTitle ??
    (normalizedTitle.includes("|") ||
      (normalizedSiteName.length > 0 && normalizedTitle.includes(normalizedSiteName)));

  return buildMetadata({
    ...input,
    path,
    image: input.image ?? siteSettings.ogImageUrl ?? null,
    canonicalUrl: resolvedCanonicalUrl,
    absoluteTitle,
  });
}

interface ContentStructuredDataInput {
  type: "BlogPosting" | "ScholarlyArticle" | "Recommendation";
  title: string;
  description?: string | null;
  path: string;
  canonicalUrl?: string | null;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  keywords?: string[];
  wordCount?: number;
  category?: string | null;
  externalUrl?: string | null;
}

export async function buildContentStructuredData({
  type,
  title,
  description,
  path,
  canonicalUrl,
  image,
  datePublished,
  dateModified,
  keywords = [],
  wordCount,
  category,
  externalUrl,
}: ContentStructuredDataInput) {
  const siteSettings = await getSiteSettings();
  const canonical = resolveCanonicalUrl(
    path,
    canonicalUrl,
    siteSettings.canonicalUrl,
  );
  const siteUrl = resolveCanonicalUrl("/", null, siteSettings.canonicalUrl);
  const identityName = siteSettings.siteName;
  const personId = new URL("#author", siteUrl).toString();
  const publisherId = new URL("#publisher", siteUrl).toString();
  const contentImage = image ?? siteSettings.ogImageUrl ?? undefined;
  const modified = dateModified ?? datePublished ?? undefined;

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${canonical}#content`,
    ...(type === "Recommendation" ? { name: title } : { headline: title }),
    description: description ?? undefined,
    url: canonical,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    image: contentImage ?? undefined,
    datePublished: datePublished ?? undefined,
    dateModified: modified,
    author: {
      "@type": "Person",
      "@id": personId,
      name: identityName,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": publisherId,
      name: identityName,
      url: siteUrl,
      ...(siteSettings.ogImageUrl
        ? {
            logo: {
              "@type": "ImageObject",
              url: siteSettings.ogImageUrl,
            },
          }
        : {}),
    },
    ...(keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
    ...(wordCount !== undefined ? { wordCount } : {}),
    ...(category ? { category } : {}),
    ...(externalUrl ? { sameAs: externalUrl } : {}),
    inLanguage: "en",
  };
}
