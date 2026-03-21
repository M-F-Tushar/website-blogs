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
import type {
  NavigationItem,
  PageKey,
  PageRecord,
  PageSection,
  SiteSettings,
} from "@/types/content";

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
  settings_json: Record<string, unknown> | null;
}

const fetchSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = createPublicServerClient();
  if (!supabase) {
    return fallbackSiteSettings;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("site_key", "primary")
    .maybeSingle();

  if (error || !data) {
    return fallbackSiteSettings;
  }

  const row = data as SiteSettingsRow;

  return {
    siteName: row.site_name,
    siteTagline: row.site_tagline,
    siteDescription: row.site_description,
    footerBlurb: row.footer_blurb,
    contactEmail: row.contact_email,
    locationLabel: row.location_label,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    xUrl: row.x_url,
    resumeUrl: row.resume_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    canonicalUrl: row.canonical_url,
    ogImageUrl: null,
  };
});

const fetchNavigation = cache(
  async (location?: NavigationItem["location"]): Promise<NavigationItem[]> => {
    const supabase = createPublicServerClient();
    if (!supabase) {
      return fallbackNavigation.filter((item) =>
        location ? item.location === location : true,
      );
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
      return fallbackNavigation.filter((item) =>
        location ? item.location === location : true,
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
  const supabase = createPublicServerClient();
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
    return fallbackPages;
  }

  return (data as PageRow[]).map((page) => ({
    id: page.id,
    pageKey: page.page_key,
    title: page.title,
    slug: page.slug,
    status: page.status,
    isVisible: page.is_visible,
    metaTitle: page.meta_title,
    metaDescription: page.meta_description,
    canonicalUrl: page.canonical_url,
  }));
});

const fetchPageSections = cache(async (pageKey: PageKey): Promise<PageSection[]> => {
  const supabase = createPublicServerClient();
  if (!supabase) {
    return fallbackPageSections
      .filter((section) => section.pageKey === pageKey)
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }

  const { data, error } = await supabase
    .from("page_sections")
    .select("*, pages!inner(page_key)")
    .eq("is_visible", true)
    .eq("pages.page_key", pageKey)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return fallbackPageSections
      .filter((section) => section.pageKey === pageKey)
      .sort((left, right) => left.sortOrder - right.sortOrder);
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
    imageUrl: null,
    settings: section.settings_json ?? {},
  }));
});

async function hydratePostTaxonomy(posts: ReturnType<typeof mapPost>[]) {
  const supabase = createPublicServerClient();
  if (!supabase || posts.length === 0) {
    return posts;
  }

  const postIds = posts.map((post) => post.id);
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase
      .from("post_categories")
      .select("post_id, categories(name)")
      .in("post_id", postIds),
    supabase
      .from("post_tags")
      .select("post_id, tags(name)")
      .in("post_id", postIds),
  ]);

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
    const supabase = createPublicServerClient();
    if (!supabase) {
      const source = options?.featuredOnly
        ? fallbackPosts.filter((post) => post.featured)
        : fallbackPosts;
      return source.slice(0, options?.limit ?? source.length);
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
      return [];
    }

    return hydratePostTaxonomy((data as PostRow[]).map(mapPost));
  },
);

export const getPostBySlug = cache(async (slug: string) => {
  const supabase = createPublicServerClient();
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

  if (error || !data) {
    return null;
  }

  const [post] = await hydratePostTaxonomy([mapPost(data as PostRow)]);
  return post ?? null;
});

export const getPublishedAcademicEntries = cache(
  async (options?: { featuredOnly?: boolean; limit?: number }) => {
    const supabase = createPublicServerClient();
    if (!supabase) {
      const source = options?.featuredOnly
        ? fallbackAcademicEntries.filter((entry) => entry.featured)
        : fallbackAcademicEntries;
      return source.slice(0, options?.limit ?? source.length);
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
      return [];
    }

    return (data as AcademicEntryRow[]).map(mapAcademicEntry);
  },
);

export const getAcademicEntryBySlug = cache(async (slug: string) => {
  const supabase = createPublicServerClient();
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

  if (error || !data) {
    return null;
  }

  return mapAcademicEntry(data as AcademicEntryRow);
});

export const getPublishedRecommendations = cache(
  async (options?: { featuredOnly?: boolean; limit?: number }) => {
    const supabase = createPublicServerClient();
    if (!supabase) {
      const source = options?.featuredOnly
        ? fallbackRecommendations.filter((item) => item.featured)
        : fallbackRecommendations;
      return source.slice(0, options?.limit ?? source.length);
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
      return [];
    }

    return (data as RecommendationRow[]).map(mapRecommendation);
  },
);

export const getRecommendationBySlug = cache(async (slug: string) => {
  const supabase = createPublicServerClient();
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

  if (error || !data) {
    return null;
  }

  return mapRecommendation(data as RecommendationRow);
});

export async function getSiteChromeData() {
  const [siteSettings, navigationItems] = await Promise.all([
    fetchSiteSettings(),
    fetchNavigation(),
  ]);

  return { siteSettings, navigationItems };
}

export async function getPageContent(pageKey: PageKey) {
  const [pages, sections] = await Promise.all([
    fetchPages(),
    fetchPageSections(pageKey),
  ]);

  const page =
    pages.find((item) => item.pageKey === pageKey) ??
    fallbackPages.find((item) => item.pageKey === pageKey) ??
    null;

  return {
    page,
    sections,
  };
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
  const [siteSettings, pageContent] = await Promise.all([
    fetchSiteSettings(),
    getPageContent("about"),
  ]);

  return {
    siteSettings,
    page: pageContent.page,
    sections: pageContent.sections,
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
