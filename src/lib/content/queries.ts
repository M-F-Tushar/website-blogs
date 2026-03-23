import { cache } from "react";

import {
  fallbackAcademicEntries,
  fallbackNavigation,
  fallbackPageSections,
  fallbackPages,
  fallbackPosts,
  fallbackRecommendations,
  fallbackSiteSettings,
} from "@/lib/content/fallback-data";
import {
  mapAcademicEntry,
  mapPost,
  mapRecommendation,
} from "@/lib/content/query-mappers";
import type {
  AcademicEntryRow,
  PostRow,
  RecommendationRow,
} from "@/lib/content/query-mappers";
import { createPublicServerClient } from "@/lib/supabase/server";
import {
  getSupabaseStoragePublicUrl,
  normalizeEmailAddress,
  normalizeLegacyBrandCopy,
} from "@/lib/utils";
import type {
  NavigationItem,
  PageKey,
  PageRecord,
  PageSection,
  SiteSettings,
} from "@/types/content";
import { getAppRuntimeStage } from "@/lib/supabase/env";

interface SiteSettingsRow {
  site_name: string;
  site_tagline: string;
  site_description: string;
  footer_blurb: string;
  contact_email: string;
  location_label: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  resume_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  default_og_image_asset_id: string | null;
  default_og_image?: {
    bucket_name?: string | null;
    object_path?: string | null;
    alt_text?: string | null;
  } | null;
}

interface NavigationItemRow {
  id: string;
  label: string;
  href: string;
  location: NavigationItem["location"];
  sort_order: number;
  is_visible: boolean;
  is_external: boolean;
}

interface PageRow {
  id: string;
  page_key: PageRecord["pageKey"];
  title: string;
  slug: string;
  status: PageRecord["status"];
  is_visible: boolean;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
}

interface PageSectionRow {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  heading: string;
  subheading: string | null;
  body_markdown: string;
  sort_order: number;
  is_visible: boolean;
  featured: boolean;
  image_asset_id: string | null;
  image?: {
    bucket_name?: string | null;
    object_path?: string | null;
    alt_text?: string | null;
  } | null;
  settings_json: Record<string, unknown> | null;
}

function normalizePageSlug(slug: string) {
  if (!slug || slug === "/") {
    return "/";
  }

  const normalized = slug.startsWith("/") ? slug : `/${slug}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

function canUseLocalFallbacks() {
  return getAppRuntimeStage() === "local";
}

function buildPublicContentFailureMessage(resource: string) {
  return getAppRuntimeStage() === "staging"
    ? `Staging content backend unavailable while loading ${resource}.`
    : `Content backend unavailable while loading ${resource}.`;
}

function failPublicContent(resource: string, reason: string, error?: unknown): never {
  console.error(`[content:${getAppRuntimeStage()}] ${resource} failed: ${reason}`, error);
  throw new Error(buildPublicContentFailureMessage(resource));
}

function resolveLocalFallback<T>(
  resource: string,
  fallbackValue: T,
  reason: string,
  error?: unknown,
) {
  if (canUseLocalFallbacks()) {
    console.warn(`[content:local] using fallback for ${resource}: ${reason}`, error);
    return fallbackValue;
  }

  return failPublicContent(resource, reason, error);
}

function getPublicClientOrFallback(resource: string) {
  const supabase = createPublicServerClient();
  if (supabase) {
    return supabase;
  }

  if (canUseLocalFallbacks()) {
    return null;
  }

  return failPublicContent(resource, "public Supabase environment is missing");
}

const fetchSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = getPublicClientOrFallback("site settings");
  if (!supabase) {
    return fallbackSiteSettings;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "*, default_og_image:media_assets!site_settings_default_og_image_asset_id_fkey(bucket_name, object_path, alt_text)",
    )
    .eq("site_key", "primary")
    .maybeSingle();

  if (error || !data) {
    return resolveLocalFallback(
      "site settings",
      fallbackSiteSettings,
      error?.message ?? "site settings record is missing",
      error,
    );
  }

  const row = data as SiteSettingsRow;

  return {
    siteName: normalizeLegacyBrandCopy(row.site_name) ?? fallbackSiteSettings.siteName,
    siteTagline: row.site_tagline,
    siteDescription: row.site_description,
    footerBlurb: row.footer_blurb,
    contactEmail:
      normalizeEmailAddress(row.contact_email) ?? fallbackSiteSettings.contactEmail,
    locationLabel: row.location_label,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    xUrl: row.x_url,
    resumeUrl: row.resume_url,
    metaTitle: normalizeLegacyBrandCopy(row.meta_title),
    metaDescription: row.meta_description,
    canonicalUrl: row.canonical_url,
    defaultOgImageAssetId: row.default_og_image_asset_id,
    ogImageUrl:
      row.default_og_image?.bucket_name && row.default_og_image.object_path
        ? getSupabaseStoragePublicUrl(
            row.default_og_image.bucket_name,
            row.default_og_image.object_path,
          )
        : null,
  };
});

export const getSiteSettings = fetchSiteSettings;

const fetchNavigation = cache(
  async (location?: NavigationItem["location"]): Promise<NavigationItem[]> => {
    const fallbackItems = fallbackNavigation.filter((item) =>
      location ? item.location === location : true,
    );
    const supabase = getPublicClientOrFallback("navigation");
    if (!supabase) {
      return fallbackItems;
    }

    let query = supabase
      .from("navigation_items")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (location) {
      query = query.eq("location", location);
    }

    const { data, error } = await query;

    if (error || !data) {
      return resolveLocalFallback(
        "navigation",
        fallbackItems,
        error?.message ?? "navigation query returned no data",
        error,
      );
    }

    return (data as NavigationItemRow[]).map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      location: item.location,
      sortOrder: item.sort_order,
      isVisible: item.is_visible,
      isExternal: item.is_external,
    }));
  },
);

const fetchPages = cache(async (): Promise<PageRecord[]> => {
  const supabase = getPublicClientOrFallback("pages");
  if (!supabase) {
    return fallbackPages;
  }

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("status", "published")
    .eq("is_visible", true)
    .order("page_key", { ascending: true });

  if (error || !data) {
    return resolveLocalFallback(
      "pages",
      fallbackPages,
      error?.message ?? "pages query returned no data",
      error,
    );
  }

  return (data as PageRow[]).map((page) => ({
    id: page.id,
    pageKey: page.page_key,
    title: page.title,
    slug: normalizePageSlug(page.slug),
    status: page.status,
    isVisible: page.is_visible,
    metaTitle: normalizeLegacyBrandCopy(page.meta_title),
    metaDescription: page.meta_description,
    canonicalUrl: page.canonical_url,
  }));
});

const fetchPageSections = cache(async (pageKey: PageKey): Promise<PageSection[]> => {
  const fallbackSections = fallbackPageSections
    .filter((section) => section.pageKey === pageKey)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const supabase = getPublicClientOrFallback(`page sections for ${pageKey}`);
  if (!supabase) {
    return fallbackSections;
  }

  const { data, error } = await supabase
    .from("page_sections")
    .select(
      "*, image:media_assets!page_sections_image_asset_id_fkey(bucket_name, object_path, alt_text), pages!inner(page_key)",
    )
    .eq("is_visible", true)
    .eq("pages.page_key", pageKey)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return resolveLocalFallback(
      `page sections for ${pageKey}`,
      fallbackSections,
      error?.message ?? "page sections query returned no data",
      error,
    );
  }

  return (data as PageSectionRow[]).map((section) => ({
    id: section.id,
    pageKey,
    pageId: section.page_id,
    sectionKey: section.section_key,
    sectionType: section.section_type,
    heading: section.heading,
    subheading: section.subheading,
    bodyMarkdown: section.body_markdown,
    sortOrder: section.sort_order,
    isVisible: section.is_visible,
    featured: section.featured,
    imageAssetId: section.image_asset_id,
    imageUrl:
      section.image?.bucket_name && section.image.object_path
        ? getSupabaseStoragePublicUrl(
            section.image.bucket_name,
            section.image.object_path,
          )
        : null,
    settings: section.settings_json ?? {},
  }));
});

async function hydratePostTaxonomy(posts: ReturnType<typeof mapPost>[]) {
  const supabase = getPublicClientOrFallback("post taxonomy");
  if (!supabase || posts.length === 0) {
    return posts;
  }

  const postIds = posts.map((post) => post.id);
  const [
    { data: categories, error: categoriesError },
    { data: tags, error: tagsError },
  ] = await Promise.all([
    supabase
      .from("post_categories")
      .select("post_id, categories(name)")
      .in("post_id", postIds),
    supabase
      .from("post_tags")
      .select("post_id, tags(name)")
      .in("post_id", postIds),
  ]);

  if (categoriesError || tagsError) {
    return resolveLocalFallback(
      "post taxonomy",
      posts,
      categoriesError?.message ?? tagsError?.message ?? "post taxonomy query failed",
      categoriesError ?? tagsError,
    );
  }

  const categoriesByPost = new Map<string, string[]>();
  categories?.forEach((item: { post_id: string; categories: unknown }) => {
    const list = categoriesByPost.get(item.post_id) ?? [];
    if (
      item.categories &&
      typeof item.categories === "object" &&
      "name" in item.categories &&
      typeof item.categories.name === "string"
    ) {
      list.push(item.categories.name);
    }
    categoriesByPost.set(item.post_id, list);
  });

  const tagsByPost = new Map<string, string[]>();
  tags?.forEach((item: { post_id: string; tags: unknown }) => {
    const list = tagsByPost.get(item.post_id) ?? [];
    if (
      item.tags &&
      typeof item.tags === "object" &&
      "name" in item.tags &&
      typeof item.tags.name === "string"
    ) {
      list.push(item.tags.name);
    }
    tagsByPost.set(item.post_id, list);
  });

  return posts.map((post) => ({
    ...post,
    categories: categoriesByPost.get(post.id) ?? [],
    tags: tagsByPost.get(post.id) ?? [],
  }));
}

export const getPublishedPosts = cache(
  async (options?: { featuredOnly?: boolean; limit?: number }) => {
    const fallbackSource = options?.featuredOnly
      ? fallbackPosts.filter((post) => post.featured)
      : fallbackPosts;
    const supabase = getPublicClientOrFallback("published posts");
    if (!supabase) {
      return fallbackSource.slice(0, options?.limit ?? fallbackSource.length);
    }

    let query = supabase
      .from("posts")
      .select(
        "*, cover:media_assets!posts_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false });

    if (options?.featuredOnly) {
      query = query.eq("featured", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      return resolveLocalFallback(
        "published posts",
        fallbackSource.slice(0, options?.limit ?? fallbackSource.length),
        error?.message ?? "published posts query returned no data",
        error,
      );
    }

    return hydratePostTaxonomy((data as PostRow[]).map(mapPost));
  },
);

export const getPostBySlug = cache(async (slug: string) => {
  const supabase = getPublicClientOrFallback(`post ${slug}`);
  if (!supabase) {
    return fallbackPosts.find((post) => post.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, cover:media_assets!posts_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return resolveLocalFallback(
      `post ${slug}`,
      fallbackPosts.find((post) => post.slug === slug) ?? null,
      error.message,
      error,
    );
  }

  if (!data) {
    return null;
  }

  const [post] = await hydratePostTaxonomy([mapPost(data as PostRow)]);
  return post ?? null;
});

export const getPublishedAcademicEntries = cache(
  async (options?: { featuredOnly?: boolean; limit?: number }) => {
    const fallbackSource = options?.featuredOnly
      ? fallbackAcademicEntries.filter((entry) => entry.featured)
      : fallbackAcademicEntries;
    const supabase = getPublicClientOrFallback("published academic entries");
    if (!supabase) {
      return fallbackSource.slice(0, options?.limit ?? fallbackSource.length);
    }

    let query = supabase
      .from("academic_entries")
      .select(
        "*, cover:media_assets!academic_entries_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .order("featured", { ascending: false })
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (options?.featuredOnly) {
      query = query.eq("featured", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      return resolveLocalFallback(
        "published academic entries",
        fallbackSource.slice(0, options?.limit ?? fallbackSource.length),
        error?.message ?? "academic entries query returned no data",
        error,
      );
    }

    return (data as AcademicEntryRow[]).map(mapAcademicEntry);
  },
);

export const getAcademicEntryBySlug = cache(async (slug: string) => {
  const supabase = getPublicClientOrFallback(`academic entry ${slug}`);
  if (!supabase) {
    return fallbackAcademicEntries.find((entry) => entry.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("academic_entries")
    .select(
      "*, cover:media_assets!academic_entries_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return resolveLocalFallback(
      `academic entry ${slug}`,
      fallbackAcademicEntries.find((entry) => entry.slug === slug) ?? null,
      error.message,
      error,
    );
  }

  if (!data) {
    return null;
  }

  return mapAcademicEntry(data as AcademicEntryRow);
});

export const getPublishedRecommendations = cache(
  async (options?: { featuredOnly?: boolean; limit?: number }) => {
    const fallbackSource = options?.featuredOnly
      ? fallbackRecommendations.filter((item) => item.featured)
      : fallbackRecommendations;
    const supabase = getPublicClientOrFallback("published recommendations");
    if (!supabase) {
      return fallbackSource.slice(0, options?.limit ?? fallbackSource.length);
    }

    let query = supabase
      .from("recommendations")
      .select(
        "*, recommendation_categories(name), cover:media_assets!recommendations_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (options?.featuredOnly) {
      query = query.eq("featured", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      return resolveLocalFallback(
        "published recommendations",
        fallbackSource.slice(0, options?.limit ?? fallbackSource.length),
        error?.message ?? "recommendations query returned no data",
        error,
      );
    }

    return (data as RecommendationRow[]).map(mapRecommendation);
  },
);

export const getRecommendationBySlug = cache(async (slug: string) => {
  const supabase = getPublicClientOrFallback(`recommendation ${slug}`);
  if (!supabase) {
    return fallbackRecommendations.find((item) => item.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("recommendations")
    .select(
      "*, recommendation_categories(name), cover:media_assets!recommendations_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return resolveLocalFallback(
      `recommendation ${slug}`,
      fallbackRecommendations.find((item) => item.slug === slug) ?? null,
      error.message,
      error,
    );
  }

  if (!data) {
    return null;
  }

  return mapRecommendation(data as RecommendationRow);
});

export async function getSiteChromeData() {
  const [siteSettings, navigationItems, recentPosts] = await Promise.all([
    fetchSiteSettings(),
    fetchNavigation(),
    getPublishedPosts({ limit: 3 }),
  ]);

  return { siteSettings, navigationItems, recentPosts };
}

export async function getPageContent(pageKey: PageKey) {
  const [pages, sections] = await Promise.all([
    fetchPages(),
    fetchPageSections(pageKey),
  ]);

  const page =
    pages.find((item) => item.pageKey === pageKey) ??
    (canUseLocalFallbacks()
      ? fallbackPages.find((item) => item.pageKey === pageKey)
      : null) ??
    null;

  return {
    page,
    sections,
  };
}

export async function getPublicPageBySlug(slug: string) {
  const normalizedSlug = normalizePageSlug(slug);
  const pages = await fetchPages();

  return pages.find((page) => page.slug === normalizedSlug) ?? null;
}

export async function getHomePageData() {
  const [
    siteSettings,
    pageContent,
    featuredPosts,
    featuredAcademic,
    featuredRecommendations,
    recentPosts,
  ] = await Promise.all([
    fetchSiteSettings(),
    getPageContent("home"),
    getPublishedPosts({ featuredOnly: true, limit: 3 }),
    getPublishedAcademicEntries({ featuredOnly: true, limit: 3 }),
    getPublishedRecommendations({ featuredOnly: true, limit: 3 }),
    getPublishedPosts({ limit: 5 }),
  ]);

  return {
    siteSettings,
    page: pageContent.page,
    sections: pageContent.sections,
    featuredPosts,
    featuredAcademic,
    featuredRecommendations,
    recentPosts,
  };
}

export async function getAboutPageData() {
  const [siteSettings, pageContent, posts, academicEntries, recommendations] =
    await Promise.all([
    fetchSiteSettings(),
    getPageContent("about"),
    getPublishedPosts(),
    getPublishedAcademicEntries(),
    getPublishedRecommendations(),
    ]);

  return {
    siteSettings,
    page: pageContent.page,
    sections: pageContent.sections,
    posts,
    academicEntries,
    recommendations,
  };
}

export async function getContactPageData() {
  const [siteSettings, pageContent] = await Promise.all([
    fetchSiteSettings(),
    getPageContent("contact"),
  ]);

  return {
    siteSettings,
    page: pageContent.page,
    sections: pageContent.sections,
  };
}

export async function getBlogsPageData() {
  const [pageContent, posts] = await Promise.all([
    getPageContent("blogs"),
    getPublishedPosts(),
  ]);

  return {
    page: pageContent.page,
    sections: pageContent.sections,
    posts,
  };
}

export async function getAcademicPageData() {
  const [pageContent, entries] = await Promise.all([
    getPageContent("academic"),
    getPublishedAcademicEntries(),
  ]);

  return {
    page: pageContent.page,
    sections: pageContent.sections,
    entries,
  };
}

export async function getRecommendationsPageData() {
  const [pageContent, recommendations] = await Promise.all([
    getPageContent("recommendations"),
    getPublishedRecommendations(),
  ]);

  return {
    page: pageContent.page,
    sections: pageContent.sections,
    recommendations,
  };
}
