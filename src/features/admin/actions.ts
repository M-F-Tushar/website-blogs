"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth/guards";
import { DEFAULT_TOP_LEVEL_PAGE_PATHS } from "@/lib/content/page-routing";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createAuthenticatedServerClient } from "@/lib/supabase/server";
import {
  navigationItemSchema,
  pageSchema,
  pageSectionSchema,
  siteSettingsSchema,
} from "@/lib/content/validators";
import {
  normalizeText,
  optionalText,
  parseJsonObject,
  toBoolean,
} from "@/lib/utils";

function normalizePageSlug(slug: string | null | undefined) {
  if (!slug || slug === "/") {
    return "/";
  }

  const normalized = slug.startsWith("/") ? slug : `/${slug}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

async function revalidatePublicRoutes(extraPaths: string[] = []) {
  const paths = new Set<string>([
    "/",
    "/about",
    "/blogs",
    "/academic",
    "/recommendations",
    "/contact",
    ...extraPaths.map((path) => normalizePageSlug(path)),
  ]);

  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from("pages").select("slug");

    for (const page of data ?? []) {
      if (page.slug) {
        paths.add(normalizePageSlug(page.slug));
      }
    }
  } catch {
    // If page lookup fails, still revalidate the known top-level routes.
  }

  revalidatePath("/", "layout");

  for (const path of paths) {
    revalidatePath(path);
  }
}

function assertPageSlugIsSupported(pageKey: string, slug: string) {
  const reservedSystemSlugs = new Set(["/admin", "/api"]);
  if (reservedSystemSlugs.has(slug)) {
    throw new Error(`The slug "${slug}" is reserved by the application.`);
  }

  const reservedTopLevelSlugs = Object.entries(DEFAULT_TOP_LEVEL_PAGE_PATHS)
    .filter(([key]) => key !== pageKey)
    .map(([, path]) => path);

  if (reservedTopLevelSlugs.includes(slug)) {
    throw new Error(
      `The slug "${slug}" is reserved by another top-level page route.`,
    );
  }
}

export async function signOutAction() {
  const supabase = await createAuthenticatedServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}

export async function saveSiteSettingsAction(formData: FormData) {
  await requireAdminSession();

  const payload = siteSettingsSchema.parse({
    siteName: normalizeText(formData.get("siteName")),
    siteTagline: normalizeText(formData.get("siteTagline")),
    siteDescription: normalizeText(formData.get("siteDescription")),
    footerBlurb: normalizeText(formData.get("footerBlurb")),
    contactEmail: normalizeText(formData.get("contactEmail")),
    locationLabel: optionalText(formData.get("locationLabel")),
    githubUrl: optionalText(formData.get("githubUrl")),
    linkedinUrl: optionalText(formData.get("linkedinUrl")),
    xUrl: optionalText(formData.get("xUrl")),
    resumeUrl: optionalText(formData.get("resumeUrl")),
    metaTitle: optionalText(formData.get("metaTitle")),
    metaDescription: optionalText(formData.get("metaDescription")),
    canonicalUrl: optionalText(formData.get("canonicalUrl")),
    defaultOgImageAssetId: optionalText(formData.get("defaultOgImageAssetId")),
  });

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      site_key: "primary",
      site_name: payload.siteName,
      site_tagline: payload.siteTagline,
      site_description: payload.siteDescription,
      footer_blurb: payload.footerBlurb,
      contact_email: payload.contactEmail,
      location_label: payload.locationLabel,
      github_url: payload.githubUrl,
      linkedin_url: payload.linkedinUrl,
      x_url: payload.xUrl,
      resume_url: payload.resumeUrl,
      meta_title: payload.metaTitle,
      meta_description: payload.metaDescription,
      canonical_url: payload.canonicalUrl,
      default_og_image_asset_id: payload.defaultOgImageAssetId,
    },
    { onConflict: "site_key" },
  );

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePublicRoutes();
  redirect("/admin/settings?saved=1");
}

export async function saveNavigationItemAction(formData: FormData) {
  await requireAdminSession();

  const payload = navigationItemSchema.parse({
    id: optionalText(formData.get("id")),
    label: normalizeText(formData.get("label")),
    href: normalizeText(formData.get("href")),
    location: normalizeText(formData.get("location")),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isVisible: toBoolean(formData.get("isVisible")),
    isExternal: toBoolean(formData.get("isExternal")),
  });

  const supabase = createServiceRoleClient();
  const { error } = payload.id
    ? await supabase
        .from("navigation_items")
        .update({
          label: payload.label,
          href: payload.href,
          location: payload.location,
          sort_order: payload.sortOrder,
          is_visible: payload.isVisible,
          is_external: payload.isExternal,
        })
        .eq("id", payload.id)
    : await supabase.from("navigation_items").insert({
        label: payload.label,
        href: payload.href,
        location: payload.location,
        sort_order: payload.sortOrder,
        is_visible: payload.isVisible,
        is_external: payload.isExternal,
      });

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePublicRoutes();
  redirect("/admin/navigation?saved=1");
}

export async function deleteNavigationItemAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  if (!id) {
    redirect("/admin/navigation");
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("navigation_items").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePublicRoutes();
  redirect("/admin/navigation?deleted=1");
}

export async function savePageAction(formData: FormData) {
  await requireAdminSession();

  const payload = pageSchema.parse({
    id: optionalText(formData.get("id")),
    pageKey: normalizeText(formData.get("pageKey")),
    title: normalizeText(formData.get("title")),
    slug: normalizeText(formData.get("slug")),
    status: normalizeText(formData.get("status")),
    isVisible: toBoolean(formData.get("isVisible")),
    metaTitle: optionalText(formData.get("metaTitle")),
    metaDescription: optionalText(formData.get("metaDescription")),
    canonicalUrl: optionalText(formData.get("canonicalUrl")),
  });
  assertPageSlugIsSupported(payload.pageKey, payload.slug);

  const supabase = createServiceRoleClient();
  const previousSlug = payload.id
    ? (
        await supabase
          .from("pages")
          .select("slug")
          .eq("id", payload.id)
          .maybeSingle()
      ).data?.slug ?? null
    : null;
  const { error } = payload.id
    ? await supabase
        .from("pages")
        .update({
          page_key: payload.pageKey,
          title: payload.title,
          slug: payload.slug,
          status: payload.status,
          is_visible: payload.isVisible,
          meta_title: payload.metaTitle,
          meta_description: payload.metaDescription,
          canonical_url: payload.canonicalUrl,
        })
        .eq("id", payload.id)
    : await supabase.from("pages").insert({
        page_key: payload.pageKey,
        title: payload.title,
        slug: payload.slug,
        status: payload.status,
        is_visible: payload.isVisible,
        meta_title: payload.metaTitle,
        meta_description: payload.metaDescription,
        canonical_url: payload.canonicalUrl,
      });

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePublicRoutes([
    DEFAULT_TOP_LEVEL_PAGE_PATHS[payload.pageKey],
    payload.slug,
    previousSlug,
  ].filter((path): path is string => Boolean(path)));
  redirect("/admin/content/pages?saved=1");
}

export async function savePageSectionAction(formData: FormData) {
  await requireAdminSession();

  const payload = pageSectionSchema.parse({
    id: optionalText(formData.get("id")),
    pageKey: normalizeText(formData.get("pageKey")),
    sectionKey: normalizeText(formData.get("sectionKey")),
    sectionType: normalizeText(formData.get("sectionType")),
    heading: normalizeText(formData.get("heading")),
    subheading: optionalText(formData.get("subheading")),
    bodyMarkdown: normalizeText(formData.get("bodyMarkdown")),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isVisible: toBoolean(formData.get("isVisible")),
    featured: toBoolean(formData.get("featured")),
    imageAssetId: optionalText(formData.get("imageAssetId")),
    settingsJson: parseJsonObject(
      optionalText(formData.get("settingsJson")) ?? "{}",
      "Settings JSON",
    ),
  });

  const supabase = createServiceRoleClient();
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("page_key", payload.pageKey)
    .maybeSingle();

  if (!page) {
    throw new Error("Page record not found for section update.");
  }

  const { error } = payload.id
    ? await supabase
        .from("page_sections")
        .update({
          page_id: page.id,
          section_key: payload.sectionKey,
          section_type: payload.sectionType,
          heading: payload.heading,
          subheading: payload.subheading,
          body_markdown: payload.bodyMarkdown,
          sort_order: payload.sortOrder,
          is_visible: payload.isVisible,
          featured: payload.featured,
          image_asset_id: payload.imageAssetId,
          settings_json: payload.settingsJson,
        })
        .eq("id", payload.id)
    : await supabase.from("page_sections").insert({
        page_id: page.id,
        section_key: payload.sectionKey,
        section_type: payload.sectionType,
        heading: payload.heading,
        subheading: payload.subheading,
        body_markdown: payload.bodyMarkdown,
        sort_order: payload.sortOrder,
        is_visible: payload.isVisible,
        featured: payload.featured,
        image_asset_id: payload.imageAssetId,
        settings_json: payload.settingsJson,
      });

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePublicRoutes();
  redirect(`/admin/content/${payload.pageKey}?saved=1`);
}

export async function deletePageSectionAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  const pageKey = normalizeText(formData.get("pageKey"));

  if (!id) {
    redirect(`/admin/content/${pageKey}`);
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("page_sections").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await revalidatePublicRoutes();
  redirect(`/admin/content/${pageKey}?deleted=1`);
}
