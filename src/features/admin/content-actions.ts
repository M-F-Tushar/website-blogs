"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  academicEntrySchema,
  contactMessageSchema,
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

interface NamedLookupRow {
  id: string;
  slug: string;
}

function revalidatePublicContent() {
  revalidatePath("/", "layout");
  revalidatePath("/blogs");
  revalidatePath("/academic");
  revalidatePath("/recommendations");
  revalidatePath("/contact");
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

  const { data } = await query;

  if (data && data.length > 0) {
    throw new Error(`The slug "${slug}" is already in use.`);
  }
}

async function upsertNamedRows(table: "categories" | "tags", names: string[]) {
  if (names.length === 0) {
    return [];
  }

  const supabase = createServiceRoleClient();
  const rows = names.map((name, index) => ({
    name,
    slug: slugify(name),
    sort_order: index,
  }));

  await supabase.from(table).upsert(rows, { onConflict: "slug" });

  const { data } = await supabase
    .from(table)
    .select("id, slug")
    .in(
      "slug",
      rows.map((row) => row.slug),
    );

  return (data ?? []) as NamedLookupRow[];
}

async function syncPostTaxonomy(postId: string, categories: string[], tags: string[]) {
  const supabase = createServiceRoleClient();
  const [categoryRows, tagRows] = await Promise.all([
    upsertNamedRows("categories", categories),
    upsertNamedRows("tags", tags),
  ]);

  await Promise.all([
    supabase.from("post_categories").delete().eq("post_id", postId),
    supabase.from("post_tags").delete().eq("post_id", postId),
  ]);

  if (categoryRows.length > 0) {
    await supabase.from("post_categories").insert(
      categoryRows.map((row: NamedLookupRow) => ({
        post_id: postId,
        category_id: row.id,
      })),
    );
  }

  if (tagRows.length > 0) {
    await supabase.from("post_tags").insert(
      tagRows.map((row: NamedLookupRow) => ({
        post_id: postId,
        tag_id: row.id,
      })),
    );
  }
}

async function upsertRecommendationCategory(name: string | null) {
  if (!name) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const slug = slugify(name);

  await supabase.from("recommendation_categories").upsert(
    {
      name,
      slug,
    },
    { onConflict: "slug" },
  );

  const { data } = await supabase
    .from("recommendation_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return data?.id ?? null;
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

  const mutation = payload.id
    ? await supabase
        .from("posts")
        .update({
          title: payload.title,
          slug: payload.slug,
          excerpt: payload.excerpt,
          body_markdown: payload.bodyMarkdown,
          status: payload.status,
          featured: payload.featured,
          published_at: publishedAt,
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
        .from("posts")
        .insert({
          title: payload.title,
          slug: payload.slug,
          excerpt: payload.excerpt,
          body_markdown: payload.bodyMarkdown,
          status: payload.status,
          featured: payload.featured,
          published_at: publishedAt,
          cover_asset_id: payload.coverAssetId,
          meta_title: payload.metaTitle,
          meta_description: payload.metaDescription,
          canonical_url: payload.canonicalUrl,
          author_profile_id: profile.id,
        })
        .select("id")
        .single();

  if (mutation.error || !mutation.data) {
    throw new Error(mutation.error?.message ?? "Unable to save post.");
  }

  await syncPostTaxonomy(mutation.data.id, payload.categories, payload.tags);

  revalidatePublicContent();
  redirect("/admin/content/posts?saved=1");
}

export async function archivePostAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  if (!id) {
    redirect("/admin/content/posts");
  }

  const supabase = createServiceRoleClient();
  await supabase
    .from("posts")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePublicContent();
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
    : await supabase.from("academic_entries").insert({
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
      });

  if (mutation.error) {
    throw new Error(mutation.error.message);
  }

  revalidatePublicContent();
  redirect("/admin/content/academic?saved=1");
}

export async function archiveAcademicEntryAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  if (!id) {
    redirect("/admin/content/academic");
  }

  const supabase = createServiceRoleClient();
  await supabase
    .from("academic_entries")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePublicContent();
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
    : await supabase.from("recommendations").insert({
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
      });

  if (mutation.error) {
    throw new Error(mutation.error.message);
  }

  revalidatePublicContent();
  redirect("/admin/content/recommendations?saved=1");
}

export async function archiveRecommendationAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  if (!id) {
    redirect("/admin/content/recommendations");
  }

  const supabase = createServiceRoleClient();
  await supabase
    .from("recommendations")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePublicContent();
  redirect("/admin/content/recommendations?deleted=1");
}

export async function uploadMediaAssetAction(formData: FormData) {
  await requireAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file before uploading.");
  }

  const label = optionalText(formData.get("label"));
  const altText = optionalText(formData.get("altText"));
  const bucketName = normalizeText(formData.get("bucketName")) || "site-public";
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : "bin";
  const objectPath = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  const supabase = createServiceRoleClient();
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: insertError } = await supabase.from("media_assets").insert({
    label,
    alt_text: altText,
    bucket_name: bucketName,
    object_path: objectPath,
    mime_type: file.type,
    file_size: file.size,
    is_public: bucketName === "site-public",
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/admin/media");
  redirect("/admin/media?uploaded=1");
}

export async function updateMessageStatusAction(formData: FormData) {
  await requireAdminSession();

  const id = optionalText(formData.get("id"));
  const status = normalizeText(formData.get("status"));

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

export async function submitContactMessage(formData: FormData, requestMeta: {
  sourceIp: string | null;
  userAgent: string | null;
}) {
  const payload = contactMessageSchema.parse({
    name: normalizeText(formData.get("name")),
    email: normalizeText(formData.get("email")),
    subject: normalizeText(formData.get("subject")),
    message: normalizeText(formData.get("message")),
    honeypot: normalizeText(formData.get("company")),
  });

  const supabase = createServiceRoleClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  let rateLimitCount = 0;

  if (requestMeta.sourceIp) {
    const { count } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("source_ip", requestMeta.sourceIp)
      .gte("created_at", oneHourAgo);

    rateLimitCount = count ?? 0;
  }

  if (rateLimitCount >= 5) {
    throw new Error("Too many messages sent recently. Please try again later.");
  }

  const spamFlags: string[] = [];
  let spamScore = 0;

  if (payload.message.length < 40) {
    spamFlags.push("very_short_message");
    spamScore += 10;
  }

  const { error } = await supabase.from("contact_messages").insert({
    name: payload.name,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
    status: "new",
    spam_score: spamScore,
    spam_flags: spamFlags,
    source_ip: requestMeta.sourceIp,
    user_agent: requestMeta.userAgent,
  });

  if (error) {
    throw new Error(error.message);
  }
}
