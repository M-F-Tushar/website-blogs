export type Role = "admin" | "editor";
export type ContentStatus = "draft" | "published" | "archived";
export type PageKey =
  | "home"
  | "about"
  | "blogs"
  | "academic"
  | "recommendations"
  | "contact";
export type AcademicEntryType =
  | "coursework"
  | "project"
  | "research_note"
  | "paper_note"
  | "experiment"
  | "certificate";
export type RecommendationLevel = "beginner" | "intermediate" | "advanced";
export type NavigationLocation = "header" | "footer" | "social";
export type ContactMessageStatus = "new" | "reviewed" | "replied" | "archived";

export interface SeoFields {
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl?: string | null;
}

export interface MediaAsset {
  id: string;
  label: string | null;
  altText: string | null;
  bucketName: string;
  objectPath: string;
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  isPublic: boolean;
  publicUrl: string | null;
  createdAt: string;
}

export interface SiteSettings extends SeoFields {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  footerBlurb: string;
  contactEmail: string;
  locationLabel: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  resumeUrl: string | null;
  defaultOgImageAssetId?: string | null;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  location: NavigationLocation;
  sortOrder: number;
  isVisible: boolean;
  isExternal: boolean;
}

export interface PageRecord extends SeoFields {
  id: string;
  pageKey: PageKey;
  title: string;
  slug: string;
  status: ContentStatus;
  isVisible: boolean;
}

export interface PageSection {
  id: string;
  pageKey: PageKey;
  pageId: string;
  sectionKey: string;
  sectionType: string;
  heading: string;
  subheading: string | null;
  bodyMarkdown: string;
  sortOrder: number;
  isVisible: boolean;
  featured: boolean;
  imageAssetId?: string | null;
  imageUrl: string | null;
  settings: Record<string, unknown>;
}

export interface PostSummary extends SeoFields {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  bodyMarkdown: string;
  status: ContentStatus;
  featured: boolean;
  publishedAt: string | null;
  coverAssetId?: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  categories: string[];
  tags: string[];
}

export interface AcademicEntry extends SeoFields {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  bodyMarkdown: string;
  entryType: AcademicEntryType;
  status: ContentStatus;
  featured: boolean;
  startedAt: string | null;
  completedAt: string | null;
  externalUrl: string | null;
  coverAssetId?: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
}

export interface Recommendation extends SeoFields {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  bodyMarkdown: string;
  whyRecommend: string | null;
  audience: string | null;
  useCase: string | null;
  level: RecommendationLevel;
  externalUrl: string | null;
  status: ContentStatus;
  featured: boolean;
  category: string | null;
  coverAssetId?: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  spamScore: number;
  spamFlags: string[];
  sourceIp: string | null;
  userAgent: string | null;
  createdAt: string;
  handledAt: string | null;
}

export interface SessionProfile {
  id: string;
  email: string;
  fullName: string | null;
  headline: string | null;
  role: Role;
}

export interface DashboardSnapshot {
  postsCount: number;
  postDraftCount: number;
  academicCount: number;
  recommendationCount: number;
  pageCount: number;
  unreadMessages: number;
  latestPosts: PostSummary[];
  latestAcademicEntries: AcademicEntry[];
}
