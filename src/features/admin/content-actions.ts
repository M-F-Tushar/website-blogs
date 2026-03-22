"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth/guards";
import {
  buildSubmissionFingerprint,
  ContactRequestError,
  evaluateContactSubmission,
  verifyTurnstileToken,
} from "@/lib/contact/anti-abuse";
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

async function getContactNotificationRecipient(supabase = createServiceRoleClient()) {
  const explicitRecipient = process.env.CONTACT_NOTIFICATION_EMAIL;
  if (explicitRecipient) {
    return explicitRecipient;
  }

  const { data } = await supabase
    .from("site_settings")
    .select("contact_email")
    .eq("site_key", "primary")
    .maybeSingle();

  return typeof data?.contact_email === "string" ? data.contact_email : null;
}

async function sendContactNotificationEmail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  spamScore: number;
  spamFlags: string[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return;
  }

  const recipient = await getContactNotificationRecipient();
  if (!recipient) {
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipient],
      reply_to: input.email,
      subject: `New contact message: ${input.subject}`,
      text: [
        `From: ${input.name} <${input.email}>`,
        `Spam score: ${input.spamScore}`,
        `Spam flags: ${input.spamFlags.join(", ") || "none"}`,
        "",
        input.message,
      ].join("\n"),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notification provider rejected the request: ${body}`);
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

  await revalidatePublicContent();
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

  await revalidatePublicContent();
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

  await revalidatePublicContent();
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

  await revalidatePublicContent();
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

  try {
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
    captchaToken: optionalText(formData.get("captchaToken")),
    honeypot: normalizeText(formData.get("company")),
  });

  await verifyTurnstileToken(payload.captchaToken, requestMeta.sourceIp);

  const supabase = createServiceRoleClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fingerprint = buildSubmissionFingerprint({
    email: payload.email,
    message: payload.message,
    sourceIp: requestMeta.sourceIp,
    userAgent: requestMeta.userAgent,
  });

  let rateLimitCount = 0;
  let recentEmailCount = 0;
  let duplicateMessageCount = 0;
  let fingerprintCount = 0;

  if (requestMeta.sourceIp) {
    const { count } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("source_ip", requestMeta.sourceIp)
      .gte("created_at", oneHourAgo);

    rateLimitCount = count ?? 0;
  }

  {
    const { count } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("email", payload.email)
      .gte("created_at", oneDayAgo);

    recentEmailCount = count ?? 0;
  }

  {
    const { count } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("email", payload.email)
      .eq("message", payload.message)
      .gte("created_at", oneWeekAgo);

    duplicateMessageCount = count ?? 0;
  }

  if (requestMeta.userAgent) {
    const { data } = await supabase
      .from("contact_messages")
      .select("email, message, source_ip, user_agent")
      .eq("user_agent", requestMeta.userAgent)
      .gte("created_at", oneDayAgo)
      .limit(20);

    fingerprintCount =
      data?.filter((row: {
        email: string;
        message: string;
        source_ip: string | null;
        user_agent: string | null;
      }) => {
        const existingFingerprint = buildSubmissionFingerprint({
          email: row.email,
          message: row.message,
          sourceIp: row.source_ip,
          userAgent: row.user_agent,
        });

        return existingFingerprint === fingerprint;
      }).length ?? 0;
  }

  if (rateLimitCount >= 5 || recentEmailCount >= 6) {
    throw new ContactRequestError(
      "Too many messages sent recently. Please try again later.",
      429,
    );
  }

  const evaluation = evaluateContactSubmission({
    name: payload.name,
    subject: payload.subject,
    message: payload.message,
    duplicateMessageCount,
    recentEmailCount,
    fingerprintCount,
  });

  if (evaluation.rejectReason) {
    throw new ContactRequestError(evaluation.rejectReason, 400);
  }

  const { error } = await supabase.from("contact_messages").insert({
    name: payload.name,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
    status: "new",
    spam_score: evaluation.score,
    spam_flags: evaluation.flags,
    source_ip: requestMeta.sourceIp,
    user_agent: requestMeta.userAgent,
  });

  if (error) {
    console.error("Failed to store contact message", error);
    throw new ContactRequestError(
      "Unable to submit your message right now.",
      500,
      false,
    );
  }

  if (evaluation.score < 40) {
    try {
      await sendContactNotificationEmail({
        name: payload.name,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
        spamScore: evaluation.score,
        spamFlags: evaluation.flags,
      });
    } catch (notificationError) {
      console.error("Failed to send contact notification", notificationError);
    }
  }
}
