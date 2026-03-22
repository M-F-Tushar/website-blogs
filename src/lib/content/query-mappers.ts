import { excerptFromMarkdown, getSupabaseStoragePublicUrl } from "@/lib/utils";
import type { AcademicEntry, PostSummary, Recommendation } from "@/types/content";

export interface AssetRow {
  bucket_name?: string | null;
  object_path?: string | null;
  alt_text?: string | null;
}

export interface PostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_markdown: string | null;
  status: PostSummary["status"];
  featured: boolean;
  published_at: string | null;
  cover_asset_id?: string | null;
  cover?: AssetRow | null;
  category_names?: string[] | null;
  tag_names?: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
}

export interface AcademicEntryRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body_markdown: string | null;
  entry_type: AcademicEntry["entryType"];
  status: AcademicEntry["status"];
  featured: boolean;
  started_at: string | null;
  completed_at: string | null;
  external_url: string | null;
  cover_asset_id?: string | null;
  cover?: AssetRow | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
}

export interface RecommendationCategoryRow {
  name?: string | null;
}

export interface RecommendationRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body_markdown: string | null;
  why_recommend: string | null;
  audience: string | null;
  use_case: string | null;
  level: Recommendation["level"];
  external_url: string | null;
  status: Recommendation["status"];
  featured: boolean;
  recommendation_categories?: RecommendationCategoryRow | null;
  cover_asset_id?: string | null;
  cover?: AssetRow | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
}

function mapAssetUrl(asset: AssetRow | null | undefined) {
  if (!asset?.bucket_name || !asset?.object_path) {
    return null;
  }

  return getSupabaseStoragePublicUrl(asset.bucket_name, asset.object_path);
}

export function mapPost(row: PostRow): PostSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || excerptFromMarkdown(row.body_markdown ?? ""),
    bodyMarkdown: row.body_markdown ?? "",
    status: row.status,
    featured: row.featured,
    publishedAt: row.published_at,
    coverAssetId: row.cover_asset_id ?? null,
    coverUrl: mapAssetUrl(row.cover),
    coverAlt: row.cover?.alt_text ?? null,
    categories: row.category_names ?? [],
    tags: row.tag_names ?? [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    canonicalUrl: row.canonical_url,
  };
}

export function mapAcademicEntry(row: AcademicEntryRow): AcademicEntry {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    bodyMarkdown: row.body_markdown ?? "",
    entryType: row.entry_type,
    status: row.status,
    featured: row.featured,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    externalUrl: row.external_url,
    coverAssetId: row.cover_asset_id ?? null,
    coverUrl: mapAssetUrl(row.cover),
    coverAlt: row.cover?.alt_text ?? null,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    canonicalUrl: row.canonical_url,
  };
}

export function mapRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    bodyMarkdown: row.body_markdown ?? "",
    whyRecommend: row.why_recommend,
    audience: row.audience,
    useCase: row.use_case,
    level: row.level,
    externalUrl: row.external_url,
    status: row.status,
    featured: row.featured,
    category: row.recommendation_categories?.name ?? null,
    coverAssetId: row.cover_asset_id ?? null,
    coverUrl: mapAssetUrl(row.cover),
    coverAlt: row.cover?.alt_text ?? null,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    canonicalUrl: row.canonical_url,
  };
}
