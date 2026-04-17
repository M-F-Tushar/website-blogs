import { z } from "zod";

function countUrls(value: string) {
  return (value.match(/https?:\/\/|www\./gi) ?? []).length;
}

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

const topLevelPageSlugSchema = z
  .string()
  .trim()
  .regex(/^\/(?:[a-z0-9-]+)?$/, {
    message:
      "Use / or a single lowercase path segment like /about. Nested paths are not supported here.",
  });

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
  slug: topLevelPageSlugSchema,
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
  excerpt: z.string().trim().min(24, "Add an excerpt so the post intro feels complete."),
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
  summary: z.string().trim().min(24, "Add a summary so the academic intro can orient the reader."),
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
  summary: z.string().trim().min(24, "Add a summary to explain what the recommendation offers."),
  bodyMarkdown: z.string().trim().min(20),
  whyRecommend: z
    .string()
    .trim()
    .min(24, "Explain why this recommendation is worth someone's time."),
  audience: z
    .string()
    .trim()
    .min(12, "Name who benefits most from this recommendation."),
  useCase: z
    .string()
    .trim()
    .min(16, "Describe how someone should use this recommendation in practice."),
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
  name: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .refine((value) => !/https?:\/\/|www\./i.test(value), {
      message: "Name cannot contain links.",
    })
    .refine((value) => /[a-z]/i.test(value), {
      message: "Name must contain letters.",
    }),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(4).max(150),
  message: z
    .string()
    .trim()
    .min(40)
    .max(4000)
    .refine((value) => countUrls(value) <= 5, {
      message: "Too many links in the message.",
    })
    .refine((value) => /[a-z]/i.test(value), {
      message: "Message must contain meaningful text.",
    }),
  captchaToken: z.string().trim().nullable(),
  honeypot: z.string().trim().max(0),
});
