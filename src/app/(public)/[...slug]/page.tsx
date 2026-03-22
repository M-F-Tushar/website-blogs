import { notFound } from "next/navigation";

import { AboutPageContent } from "@/app/(public)/about/page";
import { AcademicPageContent } from "@/app/(public)/academic/page";
import { BlogsPageContent } from "@/app/(public)/blogs/page";
import { ContactPageContent } from "@/app/(public)/contact/page";
import { HomePageContent } from "@/app/(public)/page";
import { RecommendationsPageContent } from "@/app/(public)/recommendations/page";
import {
  buildTopLevelPageMetadata,
  getAuthoritativeTopLevelPageBySlug,
  normalizeTopLevelSlugFromSegments,
} from "@/lib/content/page-routing";
import { buildSiteMetadata } from "@/lib/content/seo";

interface DynamicTopLevelPageProps {
  params: Promise<{ slug: string[] }>;
}

const PAGE_METADATA_FALLBACKS = {
  home: {
    title: "Home",
    description:
      "A technical identity platform documenting learning, projects, academic growth, and long-term direction in AI, ML, LLM, and MLOps.",
  },
  about: {
    title: "About",
    description:
      "Who I am, what I study, why AI/ML matters to me, and the values shaping my long-term professional direction.",
  },
  blogs: {
    title: "Blogs",
    description:
      "Writing across AI/ML, LLMs, MLOps, project logs, paper notes, and the career journey behind them.",
  },
  academic: {
    title: "Academic",
    description:
      "Coursework, research interests, paper-reading notes, experiments, and academic growth over time.",
  },
  recommendations: {
    title: "Recommendations",
    description:
      "Books, tools, courses, websites, and communities that support serious technical growth.",
  },
  contact: {
    title: "Contact",
    description:
      "Reach out for collaboration, conversation, project ideas, or research-oriented discussion.",
  },
} as const;

export async function generateMetadata({ params }: DynamicTopLevelPageProps) {
  const { slug } = await params;
  const page = await getAuthoritativeTopLevelPageBySlug(
    normalizeTopLevelSlugFromSegments(slug),
  );

  if (!page) {
    return buildSiteMetadata({
      title: "Page not found",
      description: "The requested page could not be found.",
      path: normalizeTopLevelSlugFromSegments(slug),
    });
  }

  return buildTopLevelPageMetadata(
    page.pageKey,
    PAGE_METADATA_FALLBACKS[page.pageKey],
    page,
  );
}

export default async function DynamicTopLevelPage({
  params,
}: DynamicTopLevelPageProps) {
  const { slug } = await params;
  const page = await getAuthoritativeTopLevelPageBySlug(
    normalizeTopLevelSlugFromSegments(slug),
  );

  if (!page) {
    notFound();
  }

  switch (page.pageKey) {
    case "home":
      return <HomePageContent />;
    case "about":
      return <AboutPageContent />;
    case "blogs":
      return <BlogsPageContent />;
    case "academic":
      return <AcademicPageContent />;
    case "recommendations":
      return <RecommendationsPageContent />;
    case "contact":
      return <ContactPageContent />;
    default:
      notFound();
  }
}
