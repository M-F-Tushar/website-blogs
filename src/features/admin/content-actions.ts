"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import type { AdminActionState } from "@/features/admin/action-state";
import { requireAdminSession } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  academicEntrySchema,
  postSchema,
  recommendationSchema,
} from "@/lib/content/validators";
import {
  normalizeText,
  optionalText,
  parseDelimitedList,
  slugify,
  toBoolean,
} from "@/lib/utils";
import type { ContactMessageStatus } from "@/types/content";

const CONTACT_MESSAGE_STATUSES: readonly ContactMessageStatus[] = [
  "new",
  "reviewed",
  "replied",
  "archived",
];

const MAX_MEDIA_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MEDIA_BUCKETS = new Set(["site-public", "site-admin"]);
const CONTENT_VALIDATION_LABELS: Record<string, string> = {
  canonicalUrl: "Canonical URL",
  externalUrl: "External URL",
};

interface SupportedMediaType {
  contentType: "image/png" | "image/jpeg" | "image/webp" | "image/gif" | "image/avif";
  extension: "png" | "jpg" | "webp" | "gif" | "avif";
}

class ContentActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentActionError";
  }
}

function isNextRedirectError(error: unknown) {
  if (!error || typeof error !== "object" || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function getContentValidationMessage(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) {
    return "Please check the form values and try again.";
  }

  const fieldName = String(issue.path.at(-1) ?? "");
  const fieldLabel = CONTENT_VALIDATION_LABELS[fieldName];
  return fieldLabel ? `${fieldLabel}: ${issue.message}` : issue.message;
}

async function runContentFormAction(
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
        message: getContentValidationMessage(error),
      };
    }

    return {
      status: "error",
      message:
        error instanceof ContentActionError ? error.message : fallbackMessage,
    };
  }

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

async function revalidatePublicContent(extraPaths: string[] = []) {
  const paths = new Set<string>([
    "/",
    "/blogs",
    "/academic",
    "/recommendations",
    "/contact",
    ...extraPaths.map((path) => normalizePageSlug(path)),
  ]);

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from("pages").select("slug");

    if (error) {
      console.error("[admin action] public content revalidation paths failed", {
        code: error.code,
      });
    } else {
      for (const page of data ?? []) {
        if (page.slug) {
          paths.add(normalizePageSlug(page.slug));
        }
      }
    }
  } catch {
    console.error("[admin action] public content revalidation paths failed", {
      code: "client_error",
    });
  }

  revalidatePath("/", "layout");

  for (const path of paths) {
    revalidatePath(path);
  }
}

async function ensureUniqueSlug(
  table: "posts" | "academic_entries" | "recommendations",
  slug: string,
  currentId?: string | null,
) {
  const supabase = createServiceRoleClient();
  let query = supabase.from(table).select("id").eq("slug", slug).limit(1);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new ContentActionError(
      "The content library could not verify that slug. Please try again.",
    );
  }

  if (data && data.length > 0) {
    throw new ContentActionError(`The slug "${slug}" is already in use.`);
  }
}

async function upsertRecommendationCategory(name: string | null) {
  if (!name) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const slug = slugify(name);

  const { error: upsertError } = await supabase
    .from("recommendation_categories")
    .upsert(
    {
      name,
      slug,
    },
    { onConflict: "slug" },
    );

  if (upsertError) {
    throw new ContentActionError(
      "The recommendation category could not be saved. Please try again.",
    );
  }

  const { data, error } = await supabase
    .from("recommendation_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    throw new ContentActionError(
      "The recommendation category could not be loaded after saving. Please retry.",
    );
  }

  return data.id;
}

async function cleanupUploadedMediaObject(
  bucketName: string,
  objectPath: string,
  supabase = createServiceRoleClient(),
) {
  const { error } = await supabase.storage.from(bucketName).remove([objectPath]);

  if (error) {
    console.error("Failed to clean up uploaded media object", {
      bucketName,
      objectPath,
      error: error.message,
    });
  }
}

export async function savePostAction(formData: FormData) {
  const { profile } = await requireAdminSession();

  const payload = postSchema.parse({
    id: optionalText(formData.get("id")),
    title: normalizeText(formData.get("title")),
    slug: slugify(normalizeText(formData.get("slug")) || normalizeText(formData.get("title"))),
    excerpt: optionalText(formData.get("excerpt")),
    bodyMarkdown: normalizeText(formData.get("bodyMarkdown")),
    status: normalizeText(formData.get("status")),
    featured: toBoolean(formData.get("featured")),
    publishedAt: optionalText(formData.get("publishedAt")),
    coverAssetId: optionalText(formData.get("coverAssetId")),
    metaTitle: optionalText(formData.get("metaTitle")),
    metaDescription: optionalText(formData.get("metaDescription")),
    canonicalUrl: optionalText(formData.get("canonicalUrl")),
    categories: parseDelimitedList(formData.get("categories")),
    tags: parseDelimitedList(formData.get("tags")),
  });

  await ensureUniqueSlug("posts", payload.slug, payload.id);

  const supabase = createServiceRoleClient();
  const publishedAt =
    payload.status === "published"
      ? payload.publishedAt
        ? new Date(payload.publishedAt).toISOString()
        : new Date().toISOString()
      : null;

  const postId = payload.id ?? randomUUID();
  const { error } = await supabase.rpc("save_post_with_taxonomy", {
    p_id: postId,
    p_author_profile_id: profile.id,
    p_title: payload.title,
    p_slug: payload.slug,
    p_excerpt: payload.excerpt ?? "",
    p_body_markdown: payload.bodyMarkdown,
    p_status: payload.status,
    p_featured: payload.featured,
    p_published_at: publishedAt ?? "",
    p_cover_asset_id: payload.coverAssetId ?? "",
    p_meta_title: payload.metaTitle ?? "",
    p_meta_description: payload.metaDescription ?? "",
    p_canonical_url: payload.canonicalUrl ?? "",
    p_categories: payload.categories.map((name, index) => ({
      name,
      slug: slugify(name),
      sort_order: index,
    })),
    p_tags: payload.tags.map((name) => ({
      name,
      slug: slugify(name),
    })),
  });

  if (error) {
    console.error("[admin action] atomic post save failed", {
      code: error.code,
    });
    throw new ContentActionError(
      "The post and its taxonomy could not be saved together. Please try again.",
    );
  }

  await revalidatePublicContent();
  redirect(`/admin/content/posts?edit=${postId}&saved=1`);
}

export async function archivePostAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  if (!id) {
    redirect("/admin/content/posts");
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("posts")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new ContentActionError("The post could not be archived. Please try again.");
  }

  await revalidatePublicContent();
  redirect("/admin/content/posts?deleted=1");
}

export async function saveAcademicEntryAction(formData: FormData) {
  await requireAdminSession();

  const payload = academicEntrySchema.parse({
    id: optionalText(formData.get("id")),
    title: normalizeText(formData.get("title")),
    slug: slugify(normalizeText(formData.get("slug")) || normalizeText(formData.get("title"))),
    summary: optionalText(formData.get("summary")),
    bodyMarkdown: normalizeText(formData.get("bodyMarkdown")),
    entryType: normalizeText(formData.get("entryType")),
    status: normalizeText(formData.get("status")),
    featured: toBoolean(formData.get("featured")),
    startedAt: optionalText(formData.get("startedAt")),
    completedAt: optionalText(formData.get("completedAt")),
    externalUrl: optionalText(formData.get("externalUrl")),
    coverAssetId: optionalText(formData.get("coverAssetId")),
    metaTitle: optionalText(formData.get("metaTitle")),
    metaDescription: optionalText(formData.get("metaDescription")),
    canonicalUrl: optionalText(formData.get("canonicalUrl")),
  });

  await ensureUniqueSlug("academic_entries", payload.slug, payload.id);

  const supabase = createServiceRoleClient();
  const mutation = payload.id
    ? await supabase
        .from("academic_entries")
        .update({
          title: payload.title,
          slug: payload.slug,
          summary: payload.summary,
          body_markdown: payload.bodyMarkdown,
          entry_type: payload.entryType,
          status: payload.status,
          featured: payload.featured,
          started_at: payload.startedAt,
          completed_at: payload.completedAt,
          external_url: payload.externalUrl,
          cover_asset_id: payload.coverAssetId,
          meta_title: payload.metaTitle,
          meta_description: payload.metaDescription,
          canonical_url: payload.canonicalUrl,
          deleted_at: null,
        })
        .eq("id", payload.id)
        .select("id")
        .single()
    : await supabase
        .from("academic_entries")
        .insert({
          title: payload.title,
          slug: payload.slug,
          summary: payload.summary,
          body_markdown: payload.bodyMarkdown,
          entry_type: payload.entryType,
          status: payload.status,
          featured: payload.featured,
          started_at: payload.startedAt,
          completed_at: payload.completedAt,
          external_url: payload.externalUrl,
          cover_asset_id: payload.coverAssetId,
          meta_title: payload.metaTitle,
          meta_description: payload.metaDescription,
          canonical_url: payload.canonicalUrl,
        })
        .select("id")
        .single();

  if (mutation.error || !mutation.data) {
    throw new Error(mutation.error?.message ?? "Unable to save academic entry.");
  }

  await revalidatePublicContent();
  redirect(`/admin/content/academic?edit=${mutation.data.id}&saved=1`);
}

export async function archiveAcademicEntryAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  if (!id) {
    redirect("/admin/content/academic");
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("academic_entries")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new ContentActionError(
      "The academic entry could not be archived. Please try again.",
    );
  }

  await revalidatePublicContent();
  redirect("/admin/content/academic?deleted=1");
}

export async function saveRecommendationAction(formData: FormData) {
  await requireAdminSession();

  const payload = recommendationSchema.parse({
    id: optionalText(formData.get("id")),
    title: normalizeText(formData.get("title")),
    slug: slugify(normalizeText(formData.get("slug")) || normalizeText(formData.get("title"))),
    summary: optionalText(formData.get("summary")),
    bodyMarkdown: normalizeText(formData.get("bodyMarkdown")),
    whyRecommend: optionalText(formData.get("whyRecommend")),
    audience: optionalText(formData.get("audience")),
    useCase: optionalText(formData.get("useCase")),
    level: normalizeText(formData.get("level")),
    externalUrl: optionalText(formData.get("externalUrl")),
    status: normalizeText(formData.get("status")),
    featured: toBoolean(formData.get("featured")),
    coverAssetId: optionalText(formData.get("coverAssetId")),
    metaTitle: optionalText(formData.get("metaTitle")),
    metaDescription: optionalText(formData.get("metaDescription")),
    canonicalUrl: optionalText(formData.get("canonicalUrl")),
    categoryName: optionalText(formData.get("categoryName")),
  });

  await ensureUniqueSlug("recommendations", payload.slug, payload.id);
  const categoryId = await upsertRecommendationCategory(payload.categoryName);

  const supabase = createServiceRoleClient();
  const mutation = payload.id
    ? await supabase
        .from("recommendations")
        .update({
          title: payload.title,
          slug: payload.slug,
          summary: payload.summary,
          body_markdown: payload.bodyMarkdown,
          why_recommend: payload.whyRecommend,
          audience: payload.audience,
          use_case: payload.useCase,
          level: payload.level,
          external_url: payload.externalUrl,
          status: payload.status,
          featured: payload.featured,
          cover_asset_id: payload.coverAssetId,
          meta_title: payload.metaTitle,
          meta_description: payload.metaDescription,
          canonical_url: payload.canonicalUrl,
          category_id: categoryId,
          deleted_at: null,
        })
        .eq("id", payload.id)
        .select("id")
        .single()
    : await supabase
        .from("recommendations")
        .insert({
          title: payload.title,
          slug: payload.slug,
          summary: payload.summary,
          body_markdown: payload.bodyMarkdown,
          why_recommend: payload.whyRecommend,
          audience: payload.audience,
          use_case: payload.useCase,
          level: payload.level,
          external_url: payload.externalUrl,
          status: payload.status,
          featured: payload.featured,
          cover_asset_id: payload.coverAssetId,
          meta_title: payload.metaTitle,
          meta_description: payload.metaDescription,
          canonical_url: payload.canonicalUrl,
          category_id: categoryId,
        })
        .select("id")
        .single();

  if (mutation.error || !mutation.data) {
    throw new Error(mutation.error?.message ?? "Unable to save recommendation.");
  }

  await revalidatePublicContent();
  redirect(`/admin/content/recommendations?edit=${mutation.data.id}&saved=1`);
}

export async function archiveRecommendationAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  if (!id) {
    redirect("/admin/content/recommendations");
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("recommendations")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new ContentActionError(
      "The recommendation could not be archived. Please try again.",
    );
  }

  await revalidatePublicContent();
  redirect("/admin/content/recommendations?deleted=1");
}

function hasSignature(bytes: Buffer, signature: readonly number[]) {
  return (
    bytes.length >= signature.length &&
    signature.every((value, index) => bytes[index] === value)
  );
}

function asciiAt(bytes: Buffer, offset: number, length: number) {
  return bytes.length >= offset + length
    ? bytes.subarray(offset, offset + length).toString("ascii")
    : "";
}

function isAvif(bytes: Buffer) {
  if (bytes.length < 16 || asciiAt(bytes, 4, 4) !== "ftyp") {
    return false;
  }

  const boxSize = bytes.readUInt32BE(0);
  const compatibleBrandsEnd =
    boxSize >= 16 && boxSize <= bytes.length ? boxSize : Math.min(bytes.length, 64);
  const majorBrand = asciiAt(bytes, 8, 4);

  if (majorBrand === "avif" || majorBrand === "avis") {
    return true;
  }

  for (let offset = 16; offset + 4 <= compatibleBrandsEnd; offset += 4) {
    const brand = asciiAt(bytes, offset, 4);
    if (brand === "avif" || brand === "avis") {
      return true;
    }
  }

  return false;
}

function detectSupportedMediaType(bytes: Buffer): SupportedMediaType | null {
  if (hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { contentType: "image/png", extension: "png" };
  }

  if (hasSignature(bytes, [0xff, 0xd8, 0xff])) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }

  const gifSignature = asciiAt(bytes, 0, 6);
  if (gifSignature === "GIF87a" || gifSignature === "GIF89a") {
    return { contentType: "image/gif", extension: "gif" };
  }

  if (asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }

  if (isAvif(bytes)) {
    return { contentType: "image/avif", extension: "avif" };
  }

  return null;
}

async function uploadMediaAsset(formData: FormData) {
  const { profile } = await requireAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file before uploading.");
  }

  if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
    throw new Error("File is too large. Upload an asset smaller than 10 MB.");
  }

  const label = optionalText(formData.get("label"));
  const altText = optionalText(formData.get("altText"));
  const bucketName = normalizeText(formData.get("bucketName")) || "site-public";

  if (!ALLOWED_MEDIA_BUCKETS.has(bucketName)) {
    throw new Error("Choose a valid upload bucket.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_MEDIA_UPLOAD_BYTES) {
    throw new Error("File is too large. Upload an asset smaller than 10 MB.");
  }

  const detectedType = detectSupportedMediaType(bytes);
  if (!detectedType) {
    throw new Error("Unsupported file type. Upload a PNG, JPEG, WebP, AVIF, or GIF.");
  }

  const objectPath = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${detectedType.extension}`;

  const supabase = createServiceRoleClient();
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, bytes, {
      contentType: detectedType.contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  try {
    const { error: insertError } = await supabase.from("media_assets").insert({
      label,
      alt_text: altText,
      bucket_name: bucketName,
      object_path: objectPath,
      mime_type: detectedType.contentType,
      file_size: bytes.byteLength,
      uploaded_by: profile.id,
      is_public: bucketName === "site-public",
    });

    if (insertError) {
      throw insertError;
    }
  } catch (error) {
    await cleanupUploadedMediaObject(bucketName, objectPath, supabase);

    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Unable to save uploaded media metadata.");
  }

  revalidatePath("/admin/media");
}

export async function uploadMediaAssetAction(formData: FormData) {
  await uploadMediaAsset(formData);
  redirect("/admin/media?uploaded=1");
}

export async function uploadMediaAssetFormAction(
  _previousState: {
    status: "idle" | "error";
    message: string | null;
  },
  formData: FormData,
): Promise<{
  status: "idle" | "error";
  message: string | null;
}> {
  try {
    await uploadMediaAsset(formData);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unable to upload the selected media asset.",
    };
  }

  redirect("/admin/media?uploaded=1");
}

export async function updateMessageStatusAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  const statusInput = normalizeText(formData.get("status"));
  const status = CONTACT_MESSAGE_STATUSES.find((value) => value === statusInput);

  if (!id || !status) {
    redirect("/admin/messages");
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({
      status,
      handled_at: status === "new" ? null : new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/messages");
  redirect("/admin/messages?updated=1");
}

export async function deleteMediaAssetAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  if (!id) {
    redirect("/admin/media");
  }

  const supabase = createServiceRoleClient();
  const { data: deletedRows, error: deleteRecordError } = await supabase.rpc(
    "delete_media_asset_record",
    {
      p_asset_id: id,
    },
  );
  const asset = deletedRows?.[0];

  if (deleteRecordError) {
    if (deleteRecordError.message === "MEDIA_IN_USE") {
      throw new ContentActionError(
        "This media asset is still used by site content. Remove those references before deleting it.",
      );
    }

    throw new ContentActionError(
      "The media asset could not be found or safely reserved for deletion. Refresh and try again.",
    );
  }

  if (!asset) {
    throw new ContentActionError(
      "The media record was not returned after deletion. Refresh the library before retrying.",
    );
  }

  const { error: storageError } = await supabase.storage
    .from(asset.bucket_name)
    .remove([asset.object_path]);

  if (storageError) {
    const { error: restoreError } = await supabase
      .from("media_assets")
      .insert(asset);

    if (restoreError) {
      console.error("[admin action] media metadata restore failed", {
        code: restoreError.code,
      });
    }

    throw new ContentActionError(
      restoreError
        ? "The stored file and library record could not be reconciled. Check Storage and the media library before retrying."
        : "The stored file could not be deleted. The library entry was restored.",
    );
  }

  revalidatePath("/admin/media");
  redirect("/admin/media?deleted=1");
}

export async function savePostFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runContentFormAction(
    formData,
    savePostAction,
    "The post could not be saved. Check the form and try again.",
  );
}

export async function archivePostFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runContentFormAction(
    formData,
    archivePostAction,
    "The post could not be archived. Please try again.",
  );
}

export async function saveAcademicEntryFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runContentFormAction(
    formData,
    saveAcademicEntryAction,
    "The academic entry could not be saved. Check the form and try again.",
  );
}

export async function archiveAcademicEntryFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runContentFormAction(
    formData,
    archiveAcademicEntryAction,
    "The academic entry could not be archived. Please try again.",
  );
}

export async function saveRecommendationFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runContentFormAction(
    formData,
    saveRecommendationAction,
    "The recommendation could not be saved. Check the form and try again.",
  );
}

export async function archiveRecommendationFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runContentFormAction(
    formData,
    archiveRecommendationAction,
    "The recommendation could not be archived. Please try again.",
  );
}

export async function updateMessageStatusFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runContentFormAction(
    formData,
    updateMessageStatusAction,
    "The message status could not be updated. Please try again.",
  );
}

export async function deleteMediaAssetFormAction(
  previousState: AdminActionState,
  formData: FormData,
) {
  void previousState;
  return runContentFormAction(
    formData,
    deleteMediaAssetAction,
    "The media asset could not be deleted. Please try again.",
  );
}
