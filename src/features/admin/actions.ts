"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { requireAdminSession } from "@/lib/auth/guards";
import { DEFAULT_TOP_LEVEL_PAGE_PATHS } from "@/lib/content/page-routing";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createAuthenticatedServerClient } from "@/lib/supabase/server";
import type { AdminActionState } from "@/features/admin/action-state";
import type { Json } from "@/types/database";
import {
  navigationItemSchema,
  pageSchema,
  pageSectionSchema,
  siteSettingsSchema,
} from "@/lib/content/validators";
import {
  normalizeText,
  normalizeEmailAddress,
  optionalText,
  parseJsonObject,
  toBoolean,
} from "@/lib/utils";

class AdminActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminActionError";
  }
}

const ADMIN_VALIDATION_LABELS: Record<string, string> = {
  canonicalUrl: "Canonical URL",
  githubUrl: "GitHub URL",
  linkedinUrl: "LinkedIn URL",
  resumeUrl: "Resume URL",
  xUrl: "X URL",
};

function getSanitizedActionErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return "unknown";
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^[a-z0-9_.-]{1,32}$/i.test(code)
    ? code
    : "unknown";
}

function logAdminActionFailure(operation: string, error: unknown) {
  console.error(`[admin action] ${operation} failed`, {
    code: getSanitizedActionErrorCode(error),
  });
}

function failAdminAction(operation: string, error: unknown): never {
  logAdminActionFailure(operation, error);
  throw new AdminActionError(`Unable to ${operation}. Please try again.`);
}

function isNextRedirectError(error: unknown) {
  if (!error || typeof error !== "object" || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function getAdminValidationMessage(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) {
    return "Please check the form values and try again.";
  }

  const fieldName = String(issue.path.at(-1) ?? "");
  const fieldLabel = ADMIN_VALIDATION_LABELS[fieldName];
  return fieldLabel ? `${fieldLabel}: ${issue.message}` : issue.message;
}

async function runAdminFormAction(
  formData: FormData,
  action: (input: FormData) => Promise<void>,
  fallbackMessage: string,
): Promise<AdminActionState> {
  try {
    await action(formData);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof ZodError) {
      return {
        status: "error",
        message: getAdminValidationMessage(error),
      };
    }

    return {
      status: "error",
      message:
        error instanceof AdminActionError ? error.message : fallbackMessage,
    };
  }

  return initialActionState();
}

function initialActionState(): AdminActionState {
  return {
    status: "idle",
    message: null,
  };
}

function normalizePageSlug(slug: string | null | undefined) {
  if (!slug || slug === "/") {
    return "/";
  }

  const normalized = slug.startsWith("/") ? slug : `/${slug}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

// Validates a form-supplied returnTo so admin actions cannot be coerced into
// redirecting to an external URL after a successful mutation.
function safeReturnTo(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  if (!value.startsWith("/admin/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\") || value.includes("@")) return fallback;
  return value;
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

  let pageRows: Array<{ slug: string }> = [];

  try {
    const { data, error } = await createServiceRoleClient()
      .from("pages")
      .select("slug");

    if (error) {
      failAdminAction("load page paths for revalidation", error);
    }

    pageRows = (data ?? []) as Array<{ slug: string }>;
  } catch (error) {
    if (error instanceof AdminActionError) {
      throw error;
    }

    failAdminAction("load page paths for revalidation", error);
  }

  for (const page of pageRows) {
    if (page.slug) {
      paths.add(normalizePageSlug(page.slug));
    }
  }

  revalidatePath("/", "layout");

  for (const path of paths) {
    revalidatePath(path);
  }
}

function assertPageSlugIsSupported(pageKey: string, slug: string) {
  const reservedSystemSlugs = new Set(["/admin", "/api"]);
  if (reservedSystemSlugs.has(slug)) {
    throw new AdminActionError(
      `The slug "${slug}" is reserved by the application.`,
    );
  }

  const reservedTopLevelSlugs = Object.entries(DEFAULT_TOP_LEVEL_PAGE_PATHS)
    .filter(([key]) => key !== pageKey)
    .map(([, path]) => path);

  if (reservedTopLevelSlugs.includes(slug)) {
    throw new AdminActionError(
      `The slug "${slug}" is reserved by another top-level page route.`,
    );
  }
}

function normalizeOptionalUrlField(
  value: FormDataEntryValue | string | null | undefined,
  fieldName: string,
) {
  const normalized = optionalText(value);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new AdminActionError(
        `${fieldName} must be a valid http or https URL.`,
      );
    }

    return url.toString();
  } catch {
    throw new AdminActionError(
      `${fieldName} must be a valid http or https URL.`,
    );
  }
}

interface ContactQuickLinkSectionRow {
  id: string;
  section_key: string;
  subheading: string | null;
  body_markdown: string;
  featured: boolean;
  settings_json: Record<string, unknown> | null;
}

export async function signOutAction() {
  const supabase = await createAuthenticatedServerClient();

  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      failAdminAction("sign out", error);
    }
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
    failAdminAction("save site settings", error);
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
        failAdminAction("save the navigation item", error);
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
    failAdminAction("delete the navigation item", error);
  }

  await revalidatePublicRoutes();
  redirect("/admin/navigation?deleted=1");
}

export async function savePageAction(formData: FormData) {
  await requireAdminSession();
  const returnTo = optionalText(formData.get("returnTo"));

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
  const lockedSlug = DEFAULT_TOP_LEVEL_PAGE_PATHS[payload.pageKey];
  assertPageSlugIsSupported(payload.pageKey, lockedSlug);

  const supabase = createServiceRoleClient();
  let previousSlug: string | null = null;

  if (payload.id) {
    const { data: existingPage, error: pageLookupError } = await supabase
      .from("pages")
      .select("slug")
      .eq("id", payload.id)
      .maybeSingle();

    if (pageLookupError) {
      failAdminAction("load the page before saving", pageLookupError);
    }

    if (!existingPage) {
      throw new AdminActionError(
        "This page record no longer exists. Refresh the admin page and try again.",
      );
    }

    previousSlug = existingPage.slug;
  }

  const { error } = payload.id
    ? await supabase
        .from("pages")
        .update({
          page_key: payload.pageKey,
          title: payload.title,
          slug: lockedSlug,
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
        slug: lockedSlug,
        status: payload.status,
        is_visible: payload.isVisible,
        meta_title: payload.metaTitle,
        meta_description: payload.metaDescription,
        canonical_url: payload.canonicalUrl,
      });

  if (error) {
    failAdminAction("save the page settings", error);
  }

  await revalidatePublicRoutes([
    DEFAULT_TOP_LEVEL_PAGE_PATHS[payload.pageKey],
    lockedSlug,
    previousSlug,
  ].filter((path): path is string => Boolean(path)));
  redirect(`${safeReturnTo(returnTo, "/admin/content/pages")}?saved=1`);
}

export async function savePageSectionAction(formData: FormData) {
  await requireAdminSession();
  const returnTo = optionalText(formData.get("returnTo"));

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
  const { data: page, error: pageLookupError } = await supabase
    .from("pages")
    .select("id")
    .eq("page_key", payload.pageKey)
    .maybeSingle();

  if (pageLookupError) {
    failAdminAction("load the page for this section", pageLookupError);
  }

  if (!page) {
    throw new AdminActionError(
      "The page for this section no longer exists. Refresh the admin page and try again.",
    );
  }

  if (payload.id) {
    const { data: existingSection, error: sectionLookupError } = await supabase
      .from("page_sections")
      .select("id, section_type")
      .eq("id", payload.id)
      .eq("page_id", page.id)
      .maybeSingle();

    if (sectionLookupError) {
      failAdminAction("load this page section", sectionLookupError);
    }

    if (!existingSection) {
      throw new AdminActionError(
        "This page section no longer exists. Refresh the admin page and try again.",
      );
    }

    if (
      existingSection.section_type === "template" &&
      payload.sectionType !== "template"
    ) {
      throw new AdminActionError(
        "This section is a consumed page template, so its type cannot be changed.",
      );
    }
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
          settings_json: payload.settingsJson as Json,
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
        settings_json: payload.settingsJson as Json,
      });

  if (error) {
    failAdminAction("save the page section", error);
  }

  await revalidatePublicRoutes();
  const basePath = safeReturnTo(returnTo, `/admin/content/${payload.pageKey}`);
  const redirectTarget = payload.id
    ? `${basePath}?edit=${payload.id}&saved=1`
    : `${basePath}?saved=1`;
  redirect(redirectTarget);
}

export async function saveContactQuickLinksAction(formData: FormData) {
  await requireAdminSession();

  const returnTo = safeReturnTo(optionalText(formData.get("returnTo")), "/admin/content/contact");
  const email = normalizeEmailAddress(formData.get("email"));
  const githubUrl = normalizeOptionalUrlField(formData.get("githubUrl"), "GitHub URL");
  const linkedinUrl = normalizeOptionalUrlField(formData.get("linkedinUrl"), "LinkedIn URL");
  const locationLabel = optionalText(formData.get("locationLabel"));

  if (!email) {
    throw new AdminActionError("Public email must be a valid email address.");
  }

  const supabase = createServiceRoleClient();
  const { data: page, error: pageLookupError } = await supabase
    .from("pages")
    .select("id")
    .eq("page_key", "contact")
    .maybeSingle();

  if (pageLookupError) {
    failAdminAction("load the contact page", pageLookupError);
  }

  if (!page) {
    throw new AdminActionError(
      "The contact page record no longer exists. Restore it before editing quick links.",
    );
  }

  const { data: existingSections, error: sectionsError } = await supabase
    .from("page_sections")
    .select("id, section_key, subheading, body_markdown, featured, settings_json")
    .eq("page_id", page.id)
    .in("section_key", ["email", "github", "linkedin", "location"]);

  if (sectionsError) {
    failAdminAction("load the contact quick-link sections", sectionsError);
  }

  const existingByKey = new Map(
    ((existingSections ?? []) as ContactQuickLinkSectionRow[]).map((section) => [
      section.section_key,
      section,
    ]),
  );

  const sectionDefinitions = [
    {
      key: "email",
      hasValue: true,
      heading: email,
      subheading:
        existingByKey.get("email")?.subheading ?? "Best for professional inquiries",
      bodyMarkdown:
        existingByKey.get("email")?.body_markdown ??
        "Email is still the clearest way to start a useful technical conversation here.",
      sortOrder: 20,
      featured: true,
      settingsJson: {
        ...(existingByKey.get("email")?.settings_json ?? {}),
        eyebrow: "Email",
        href: `mailto:${email}`,
        icon: "mail",
      },
    },
    {
      key: "github",
      hasValue: Boolean(githubUrl),
      heading: "GitHub",
      subheading:
        existingByKey.get("github")?.subheading ?? "Check out my open-source work",
      bodyMarkdown: existingByKey.get("github")?.body_markdown ?? "",
      sortOrder: 30,
      featured: false,
      settingsJson: {
        ...(existingByKey.get("github")?.settings_json ?? {}),
        eyebrow: "GitHub",
        href: githubUrl,
        icon: "github",
      },
    },
    {
      key: "linkedin",
      hasValue: Boolean(linkedinUrl),
      heading: "LinkedIn",
      subheading:
        existingByKey.get("linkedin")?.subheading ?? "Connect professionally",
      bodyMarkdown: existingByKey.get("linkedin")?.body_markdown ?? "",
      sortOrder: 40,
      featured: false,
      settingsJson: {
        ...(existingByKey.get("linkedin")?.settings_json ?? {}),
        eyebrow: "LinkedIn",
        href: linkedinUrl,
        icon: "linkedin",
      },
    },
    {
      key: "location",
      hasValue: Boolean(locationLabel),
      heading: locationLabel ?? "",
      subheading:
        existingByKey.get("location")?.subheading ??
        "Remote-friendly and open to thoughtful technical conversations across time zones.",
      bodyMarkdown:
        existingByKey.get("location")?.body_markdown ??
        "Open to async conversation, remote collaboration, and practical discussions that can become real work.",
      sortOrder: 50,
      featured: false,
      settingsJson: {
        ...(existingByKey.get("location")?.settings_json ?? {}),
        eyebrow: "Location",
        icon: "location",
      },
    },
  ] as const;

  for (const definition of sectionDefinitions) {
    const existingSection = existingByKey.get(definition.key);

    if (existingSection) {
      const { error } = await supabase
        .from("page_sections")
        .update({
          page_id: page.id,
          section_key: definition.key,
          section_type: "detail",
          heading: definition.heading,
          subheading: definition.subheading,
          body_markdown: definition.bodyMarkdown,
          sort_order: definition.sortOrder,
          is_visible: definition.hasValue,
          featured: definition.featured,
          settings_json: definition.settingsJson,
        })
        .eq("id", existingSection.id);

      if (error) {
        failAdminAction("save the contact quick-link sections", error);
      }

      continue;
    }

    if (!definition.hasValue) {
      continue;
    }

    const { error } = await supabase.from("page_sections").insert({
      page_id: page.id,
      section_key: definition.key,
      section_type: "detail",
      heading: definition.heading,
      subheading: definition.subheading,
      body_markdown: definition.bodyMarkdown,
      sort_order: definition.sortOrder,
      is_visible: true,
      featured: definition.featured,
      settings_json: definition.settingsJson,
    });

    if (error) {
      failAdminAction("save the contact quick-link sections", error);
    }
  }

  const { error: settingsError } = await supabase
    .from("site_settings")
    .update({
      contact_email: email,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
      location_label: locationLabel,
    })
    .eq("site_key", "primary");

  if (settingsError) {
    failAdminAction("save the contact details in site settings", settingsError);
  }

  await revalidatePublicRoutes(["/contact"]);
  redirect(`${safeReturnTo(returnTo, "/admin/content/contact")}?saved=1`);
}

export async function deletePageSectionAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  const pageKey = normalizeText(formData.get("pageKey"));
  const returnTo = optionalText(formData.get("returnTo"));

  if (!id) {
    redirect(safeReturnTo(returnTo, `/admin/content/${pageKey}`));
  }

  const supabase = createServiceRoleClient();
  const { data: existingSection, error: sectionLookupError } = await supabase
    .from("page_sections")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (sectionLookupError) {
    failAdminAction("load the page section before deleting it", sectionLookupError);
  }

  if (!existingSection) {
    throw new AdminActionError(
      "This page section no longer exists. Refresh the admin page and try again.",
    );
  }

  const { error } = await supabase.from("page_sections").delete().eq("id", id);

  if (error) {
    failAdminAction("delete the page section", error);
  }

  await revalidatePublicRoutes();
  redirect(`${safeReturnTo(returnTo, `/admin/content/${pageKey}`)}?deleted=1`);
}

export async function signOutFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runAdminFormAction(
    formData,
    signOutAction,
    "Unable to sign out. Please try again.",
  );
}

export async function saveSiteSettingsFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runAdminFormAction(
    formData,
    saveSiteSettingsAction,
    "The site settings could not be saved. Check the form and try again.",
  );
}

export async function saveNavigationItemFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runAdminFormAction(
    formData,
    saveNavigationItemAction,
    "The navigation item could not be saved. Check the form and try again.",
  );
}

export async function deleteNavigationItemFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runAdminFormAction(
    formData,
    deleteNavigationItemAction,
    "The navigation item could not be deleted. Please try again.",
  );
}

export async function savePageFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runAdminFormAction(
    formData,
    savePageAction,
    "The page settings could not be saved. Check the form and try again.",
  );
}

export async function savePageSectionFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runAdminFormAction(
    formData,
    savePageSectionAction,
    "The page section could not be saved. Check the form and try again.",
  );
}

export async function saveContactQuickLinksFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runAdminFormAction(
    formData,
    saveContactQuickLinksAction,
    "The contact links could not be saved. Check the form and try again.",
  );
}

export async function deletePageSectionFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runAdminFormAction(
    formData,
    deletePageSectionAction,
    "The page section could not be deleted. Please try again.",
  );
}
