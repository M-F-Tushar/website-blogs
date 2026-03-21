import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Use lowercase letters, numbers, and hyphens only. Example: learning-llm-evals",
  });

const nullableUrlSchema = z
  .string()
  .trim()
  .url()
  .or(z.literal(""))
  .transform((value) => (value.length > 0 ? value : null));

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(2),
  siteTagline: z.string().trim().min(2),
  siteDescription: z.string().trim().min(20),
  footerBlurb: z.string().trim().min(10),
  contactEmail: z.string().email(),
  locationLabel: z.string().trim().nullable(),
  githubUrl: nullableUrlSchema.nullable(),
  linkedinUrl: nullableUrlSchema.nullable(),
  xUrl: nullableUrlSchema.nullable(),
  resumeUrl: nullableUrlSchema.nullable(),
  metaTitle: z.string().trim().nullable(),
  metaDescription: z.string().trim().nullable(),
  canonicalUrl: nullableUrlSchema.nullable(),
  defaultOgImageAssetId: z.string().uuid().nullable(),
});

export const navigationItemSchema = z.object({
  id: z.string().uuid().nullable(),
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
  location: z.enum(["header", "footer", "social"]),
  sortOrder: z.coerce.number().int().min(0),
  isVisible: z.boolean(),
  isExternal: z.boolean(),
});

export const pageSchema = z.object({
  id: z.string().uuid().nullable(),
  pageKey: z.enum([
    "home",
    "about",
    "blogs",
    "academic",
    "recommendations",
    "contact",
  ]),
  title: z.string().trim().min(2),
  slug: z.string().trim().min(1),
  status: z.enum(["draft", "published", "archived"]),
  isVisible: z.boolean(),
  metaTitle: z.string().trim().nullable(),
  metaDescription: z.string().trim().nullable(),
  canonicalUrl: nullableUrlSchema.nullable(),
});

export const pageSectionSchema = z.object({
  id: z.string().uuid().nullable(),
  pageKey: z.enum([
    "home",
    "about",
    "blogs",
    "academic",
    "recommendations",
    "contact",
  ]),
  sectionKey: z.string().trim().min(2),
  sectionType: z.string().trim().min(2),
  heading: z.string().trim().min(2),
  subheading: z.string().trim().nullable(),
  bodyMarkdown: z.string().trim().min(2),
  sortOrder: z.coerce.number().int().min(0),
  isVisible: z.boolean(),
  featured: z.boolean(),
  imageAssetId: z.string().uuid().nullable(),
  settingsJson: z.record(z.string(), z.unknown()).default({}),
});

export const postSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(4),
  slug: slugSchema,
  excerpt: z.string().trim().nullable(),
  bodyMarkdown: z.string().trim().min(20),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
  publishedAt: z.string().trim().nullable(),
  coverAssetId: z.string().uuid().nullable(),
  metaTitle: z.string().trim().nullable(),
  metaDescription: z.string().trim().nullable(),
  canonicalUrl: nullableUrlSchema.nullable(),
  categories: z.array(z.string().trim()).default([]),
  tags: z.array(z.string().trim()).default([]),
});

export const academicEntrySchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(4),
  slug: slugSchema,
  summary: z.string().trim().nullable(),
  bodyMarkdown: z.string().trim().min(20),
  entryType: z.enum([
    "coursework",
    "project",
    "research_note",
    "paper_note",
    "experiment",
    "certificate",
  ]),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
  startedAt: z.string().trim().nullable(),
  completedAt: z.string().trim().nullable(),
  externalUrl: nullableUrlSchema.nullable(),
  coverAssetId: z.string().uuid().nullable(),
  metaTitle: z.string().trim().nullable(),
  metaDescription: z.string().trim().nullable(),
  canonicalUrl: nullableUrlSchema.nullable(),
});

export const recommendationSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(4),
  slug: slugSchema,
  summary: z.string().trim().nullable(),
  bodyMarkdown: z.string().trim().min(20),
  whyRecommend: z.string().trim().nullable(),
  audience: z.string().trim().nullable(),
  useCase: z.string().trim().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  externalUrl: nullableUrlSchema.nullable(),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
  coverAssetId: z.string().uuid().nullable(),
  metaTitle: z.string().trim().nullable(),
  metaDescription: z.string().trim().nullable(),
  canonicalUrl: nullableUrlSchema.nullable(),
  categoryName: z.string().trim().nullable(),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  subject: z.string().trim().min(4).max(150),
  message: z.string().trim().min(20).max(4000),
  honeypot: z.string().trim().max(0),
});
