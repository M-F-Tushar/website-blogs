import { cache } from "react";

import {
  mapAcademicEntry,
  mapPost,
  mapRecommendation,
} from "@/lib/content/query-mappers";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  getSupabaseStoragePublicUrl,
  normalizeEmailAddress,
  normalizeLegacyBrandCopy,
} from "@/lib/utils";
import type {
  AcademicEntry,
  ContactMessage,
  DashboardSnapshot,
  MediaAsset,
  NavigationItem,
  PageKey,
  PageRecord,
  PageSection,
  PostSummary,
  Recommendation,
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

interface MediaAssetRow {
  id: string;
  label: string | null;
  alt_text: string | null;
  bucket_name: string;
  object_path: string;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  is_public: boolean;
  created_at: string;
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessage["status"];
  spam_score: number;
  spam_flags: string[] | null;
  source_ip: string | null;
  user_agent: string | null;
  created_at: string;
  handled_at: string | null;
}

function mapMediaAsset(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    label: row.label,
    altText: row.alt_text,
    bucketName: row.bucket_name,
    objectPath: row.object_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    width: row.width,
    height: row.height,
    isPublic: row.is_public,
    publicUrl:
      row.is_public && row.bucket_name && row.object_path
        ? getSupabaseStoragePublicUrl(row.bucket_name, row.object_path)
        : null,
    createdAt: row.created_at,
  };
}

export const getAdminSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("site_settings")
    .select(
      "*, default_og_image:media_assets!site_settings_default_og_image_asset_id_fkey(bucket_name, object_path, alt_text)",
    )
    .eq("site_key", "primary")
    .maybeSingle();

  if (!data) {
    return null;
  }

  const row = data as SiteSettingsRow;

  return {
    siteName: normalizeLegacyBrandCopy(row.site_name) ?? row.site_name,
    siteTagline: row.site_tagline,
    siteDescription: row.site_description,
    footerBlurb: row.footer_blurb,
    contactEmail: normalizeEmailAddress(row.contact_email) ?? row.contact_email,
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

export const getAdminNavigationItems = cache(async (): Promise<NavigationItem[]> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("navigation_items")
    .select("*")
    .order("location", { ascending: true })
    .order("sort_order", { ascending: true });

  return ((data ?? []) as NavigationItemRow[]).map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    location: item.location,
    sortOrder: item.sort_order,
    isVisible: item.is_visible,
    isExternal: item.is_external,
  }));
});

export const getAdminPages = cache(async (): Promise<PageRecord[]> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("pages").select("*").order("page_key");

  return ((data ?? []) as PageRow[]).map((page) => ({
    id: page.id,
    pageKey: page.page_key,
    title: page.title,
    slug: page.slug,
    status: page.status,
    isVisible: page.is_visible,
    metaTitle: normalizeLegacyBrandCopy(page.meta_title),
    metaDescription: page.meta_description,
    canonicalUrl: page.canonical_url,
  }));
});

export const getAdminPageSections = cache(
  async (pageKey: PageKey): Promise<PageSection[]> => {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("page_sections")
      .select(
        "*, image:media_assets!page_sections_image_asset_id_fkey(bucket_name, object_path, alt_text), pages!inner(page_key)",
      )
      .eq("pages.page_key", pageKey)
      .order("sort_order", { ascending: true });

    return ((data ?? []) as PageSectionRow[]).map((section) => ({
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
  },
);

export const getAdminPosts = cache(async (): Promise<PostSummary[]> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "*, cover:media_assets!posts_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapPost);
});

export const getAdminAcademicEntries = cache(async (): Promise<AcademicEntry[]> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("academic_entries")
    .select(
      "*, cover:media_assets!academic_entries_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapAcademicEntry);
});

export const getAdminRecommendations = cache(async (): Promise<Recommendation[]> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("recommendations")
    .select(
      "*, recommendation_categories(name), cover:media_assets!recommendations_cover_asset_id_fkey(bucket_name, object_path, alt_text)",
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapRecommendation);
});

export const getAdminMediaAssets = cache(async (): Promise<MediaAsset[]> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapMediaAsset);
});

export const getAdminMessages = cache(async (): Promise<ContactMessage[]> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return ((data ?? []) as MessageRow[]).map((message) => ({
    id: message.id,
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    status: message.status,
    spamScore: message.spam_score,
    spamFlags: message.spam_flags ?? [],
    sourceIp: message.source_ip,
    userAgent: message.user_agent,
    createdAt: message.created_at,
    handledAt: message.handled_at,
  }));
});

export const getAdminDashboardSnapshot = cache(
  async (): Promise<DashboardSnapshot> => {
    const [posts, academicEntries, recommendations, pages, messages] =
      await Promise.all([
        getAdminPosts(),
        getAdminAcademicEntries(),
        getAdminRecommendations(),
        getAdminPages(),
        getAdminMessages(),
      ]);

    return {
      postsCount: posts.length,
      postDraftCount: posts.filter((post) => post.status === "draft").length,
      academicCount: academicEntries.length,
      recommendationCount: recommendations.length,
      pageCount: pages.length,
      unreadMessages: messages.filter((message) => message.status === "new").length,
      latestPosts: posts.slice(0, 4),
      latestAcademicEntries: academicEntries.slice(0, 4),
    };
  },
);
