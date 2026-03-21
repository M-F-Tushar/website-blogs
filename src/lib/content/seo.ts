import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/utils";

interface MetadataInput {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image,
}: MetadataInput): Metadata {
  const canonicalUrl = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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
