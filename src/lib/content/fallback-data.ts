import type {
  AcademicEntry,
  NavigationItem,
  PageRecord,
  PageSection,
  PostSummary,
  Recommendation,
  SiteSettings,
} from "@/types/content";

export const fallbackSiteSettings: SiteSettings = {
  siteName: "Arian's Lab Notes",
  siteTagline: "Student builder. Research-minded. AI/ML in motion.",
  siteDescription:
    "A production-grade personal knowledge platform documenting the path from CSE student to AI, ML, LLM, and MLOps professional.",
  footerBlurb:
    "A long-horizon digital identity for documenting projects, research interests, notes, and real technical growth.",
  contactEmail: "hello@example.com",
  locationLabel: "Dhaka, Bangladesh",
  githubUrl: "https://github.com/",
  linkedinUrl: "https://linkedin.com/",
  xUrl: null,
  resumeUrl: null,
  metaTitle: "Arian's Lab Notes",
  metaDescription:
    "A technical identity platform for blogging, academic notes, recommendations, and learning progress in AI, ML, LLM, and MLOps.",
  canonicalUrl: null,
  ogImageUrl: null,
  defaultOgImageAssetId: null,
};

export const fallbackNavigation: NavigationItem[] = [
  {
    id: "nav-home",
    label: "Home",
    href: "/",
    location: "header",
    sortOrder: 10,
    isVisible: true,
    isExternal: false,
  },
  {
    id: "nav-about",
    label: "About",
    href: "/about",
    location: "header",
    sortOrder: 20,
    isVisible: true,
    isExternal: false,
  },
  {
    id: "nav-blogs",
    label: "Blogs",
    href: "/blogs",
    location: "header",
    sortOrder: 30,
    isVisible: true,
    isExternal: false,
  },
  {
    id: "nav-academic",
    label: "Academic",
    href: "/academic",
    location: "header",
    sortOrder: 40,
    isVisible: true,
    isExternal: false,
  },
  {
    id: "nav-recommendations",
    label: "Recommendations",
    href: "/recommendations",
    location: "header",
    sortOrder: 50,
    isVisible: true,
    isExternal: false,
  },
  {
    id: "nav-contact",
    label: "Contact",
    href: "/contact",
    location: "header",
    sortOrder: 60,
    isVisible: true,
    isExternal: false,
  },
];

export const fallbackPages: PageRecord[] = [
  {
    id: "page-home",
    pageKey: "home",
    title: "Home",
    slug: "/",
    status: "published",
    isVisible: true,
    metaTitle: "Home | Arian's Lab Notes",
    metaDescription: "AI/ML learning journey, technical writing, and research growth.",
    canonicalUrl: null,
  },
  {
    id: "page-about",
    pageKey: "about",
    title: "About",
    slug: "/about",
    status: "published",
    isVisible: true,
    metaTitle: "About | Arian's Lab Notes",
    metaDescription: "Who I am, what I study, and where I'm headed in AI/ML.",
    canonicalUrl: null,
  },
  {
    id: "page-blogs",
    pageKey: "blogs",
    title: "Blogs",
    slug: "/blogs",
    status: "published",
    isVisible: true,
    metaTitle: "Blogs | Arian's Lab Notes",
    metaDescription: "Learning notes, project logs, and evidence-driven technical writing.",
    canonicalUrl: null,
  },
  {
    id: "page-academic",
    pageKey: "academic",
    title: "Academic",
    slug: "/academic",
    status: "published",
    isVisible: true,
    metaTitle: "Academic | Arian's Lab Notes",
    metaDescription: "Coursework, experiments, research notes, and academic growth.",
    canonicalUrl: null,
  },
  {
    id: "page-recommendations",
    pageKey: "recommendations",
    title: "Recommendations",
    slug: "/recommendations",
    status: "published",
    isVisible: true,
    metaTitle: "Recommendations | Arian's Lab Notes",
    metaDescription: "Books, tools, courses, and resources worth recommending.",
    canonicalUrl: null,
  },
  {
    id: "page-contact",
    pageKey: "contact",
    title: "Contact",
    slug: "/contact",
    status: "published",
    isVisible: true,
    metaTitle: "Contact | Arian's Lab Notes",
    metaDescription: "Reach out for collaboration, conversation, or research exchange.",
    canonicalUrl: null,
  },
];

export const fallbackPageSections: PageSection[] = [
  {
    id: "home-hero",
    pageKey: "home",
    pageId: "page-home",
    sectionKey: "hero",
    sectionType: "hero",
    heading:
      "I'm a CSE student building toward AI, machine learning, LLM systems, and dependable engineering practice.",
    subheading:
      "This platform documents what I'm learning, what I'm building, and how my technical direction evolves over time.",
    bodyMarkdown:
      "I care about research depth, practical systems thinking, and honest progress. The goal is not to look finished. The goal is to become difficult to ignore through consistency and real work.",
    sortOrder: 10,
    isVisible: true,
    featured: true,
    imageAssetId: null,
    imageUrl: null,
    settings: {},
  },
  {
    id: "home-focus",
    pageKey: "home",
    pageId: "page-home",
    sectionKey: "current-focus",
    sectionType: "focus",
    heading: "Current focus areas",
    subheading: "The work streams shaping the next stage of growth.",
    bodyMarkdown:
      "- ML fundamentals and applied experimentation\n- LLM systems, prompting, and evaluation\n- MLOps habits: reproducibility, observability, deployment readiness\n- Technical writing and paper-reading discipline",
    sortOrder: 20,
    isVisible: true,
    featured: false,
    imageAssetId: null,
    imageUrl: null,
    settings: {},
  },
  {
    id: "about-roadmap",
    pageKey: "about",
    pageId: "page-about",
    sectionKey: "roadmap",
    sectionType: "timeline",
    heading: "Current learning roadmap",
    subheading: "Depth first, then leverage.",
    bodyMarkdown:
      "I'm building from CS fundamentals toward practical AI systems. That means strengthening statistics, ML workflows, LLM application design, and the deployment discipline needed to move from notebooks to reliable products.",
    sortOrder: 10,
    isVisible: true,
    featured: false,
    imageAssetId: null,
    imageUrl: null,
    settings: {},
  },
];

export const fallbackPosts: PostSummary[] = [
  {
    id: "post-1",
    title: "Designing a learning system instead of chasing random tutorials",
    slug: "designing-a-learning-system",
    excerpt:
      "A note on replacing fragmented resource consumption with a structured research and build workflow.",
    bodyMarkdown:
      "I'm learning to treat technical growth as a system. That means choosing themes, keeping notes, building small proofs, and revisiting ideas until they compound.",
    status: "published",
    featured: true,
    publishedAt: "2026-03-18T08:00:00.000Z",
    coverUrl: null,
    coverAlt: null,
    categories: ["learning notes"],
    tags: ["roadmap", "systems"],
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
  },
  {
    id: "post-2",
    title: "What I'm looking for in an LLM project worth building",
    slug: "what-makes-an-llm-project-worth-building",
    excerpt:
      "A practical filter for choosing projects that build durable skill rather than shallow novelty.",
    bodyMarkdown:
      "I want projects that force decisions around data, retrieval quality, evaluation, and deployment tradeoffs. That's where real learning starts.",
    status: "published",
    featured: false,
    publishedAt: "2026-03-12T08:00:00.000Z",
    coverUrl: null,
    coverAlt: null,
    categories: ["llm", "project logs"],
    tags: ["evaluation"],
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
  },
];

export const fallbackAcademicEntries: AcademicEntry[] = [
  {
    id: "academic-1",
    title: "Paper-reading workflow for ML and LLM topics",
    slug: "paper-reading-workflow-for-ml-and-llm-topics",
    summary:
      "A lightweight process for reading papers with better retention and clearer downstream experiments.",
    bodyMarkdown:
      "I'm structuring paper reading around four passes: context, core mechanism, assumptions, and implementation ideas. The goal is to turn reading into experiments and writing.",
    entryType: "paper_note",
    status: "published",
    featured: true,
    startedAt: "2026-03-01",
    completedAt: "2026-03-02",
    externalUrl: null,
    coverUrl: null,
    coverAlt: null,
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
  },
];

export const fallbackRecommendations: Recommendation[] = [
  {
    id: "rec-1",
    title: "Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow",
    slug: "hands-on-machine-learning-book",
    summary:
      "A practical book for grounding intuition while still connecting ideas to real implementation.",
    bodyMarkdown:
      "I recommend this when you want a serious but approachable bridge from concepts to actual ML workflows.",
    whyRecommend:
      "It balances theory, code, and engineering sensibility better than most beginner-to-intermediate resources.",
    audience: "Students moving from fundamentals into hands-on ML practice.",
    useCase: "Building intuition while implementing end-to-end workflows.",
    level: "intermediate",
    externalUrl:
      "https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/",
    status: "published",
    featured: true,
    category: "books",
    coverUrl: null,
    coverAlt: null,
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
  },
];
