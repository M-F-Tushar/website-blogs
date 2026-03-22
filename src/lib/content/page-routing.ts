import type { PageKey, PageRecord } from "@/types/content";
import { getPageContent, getPublicPageBySlug } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";

export const DEFAULT_TOP_LEVEL_PAGE_PATHS: Record<PageKey, string> = {
  home: "/",
  about: "/about",
  blogs: "/blogs",
  academic: "/academic",
  recommendations: "/recommendations",
  contact: "/contact",
};

export function normalizeTopLevelSlugFromSegments(segments: string[]) {
  if (segments.length === 0) {
    return "/";
  }

  return `/${segments.join("/")}`;
}

export async function getAuthoritativeTopLevelPage(pageKey: PageKey) {
  const { page } = await getPageContent(pageKey);
  return page;
}

export async function getAuthoritativeTopLevelPageBySlug(slug: string) {
  return getPublicPageBySlug(slug);
}

export async function buildTopLevelPageMetadata(
  pageKey: PageKey,
  fallback: {
    title: string;
    description: string;
  },
  page?: PageRecord | null,
) {
  const resolvedPage = page ?? (await getAuthoritativeTopLevelPage(pageKey));

  return buildSiteMetadata({
    title: resolvedPage?.metaTitle ?? resolvedPage?.title ?? fallback.title,
    description: resolvedPage?.metaDescription ?? fallback.description,
    path: resolvedPage?.slug ?? DEFAULT_TOP_LEVEL_PAGE_PATHS[pageKey],
    canonicalUrl: resolvedPage?.canonicalUrl ?? null,
  });
}
