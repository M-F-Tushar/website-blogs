import { notFound, permanentRedirect } from "next/navigation";

import { DetailCard } from "@/components/site/detail-card";
import { Markdown } from "@/components/site/markdown";
import { RecommendationsDirectory } from "@/components/site/recommendations-directory";
import { getRecommendationsPageData } from "@/lib/content/queries";
import {
  getPrimarySection,
  getSectionSettingString,
} from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("recommendations", {
    title: "Recommendations",
    description:
      "Books, tools, courses, websites, and communities that support serious technical growth.",
  });
}

export async function RecommendationsPageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getRecommendationsPageData>>;
} = {}) {
  const resolvedData = data ?? (await getRecommendationsPageData());
  const { page, sections, recommendations } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);
  const supportingSections = sections.filter((section) => section.id !== heroSection?.id);
  const categoryCount = new Set(
    recommendations.map((item) => item.category).filter(Boolean),
  ).size;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="mx-auto max-w-4xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
          <span className="text-sky-400">✦</span>
          {getSectionSettingString(heroSection, "eyebrow") ?? "Curated Resources"}
        </p>
        <h1 className="mt-6 font-display text-[3.9rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.2rem]">
          {page?.title?.includes("Recommendation") ? (
            <>
              My <span className="accent-gradient-text">Recommendations</span>
            </>
          ) : (
            <span className="accent-gradient-text">{page?.title ?? "Recommendations"}</span>
          )}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-[1.04rem] leading-8 text-slate-300 md:text-[1.14rem]">
          {heroSection?.subheading ??
            page?.metaDescription ??
            "A hand-picked collection of tools, books, courses, and resources that have helped me on my journey."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="signal-pill">{recommendations.length} resources</span>
          <span className="signal-pill">{categoryCount} categories</span>
        </div>
      </section>

      {heroSection?.bodyMarkdown ? (
        <section className="mx-auto mt-10 max-w-6xl">
          <DetailCard
            eyebrow="Curation note"
            title={heroSection.heading}
            description="Everything here should be something worth returning to, not filler."
          >
            <Markdown content={heroSection.bodyMarkdown} />
          </DetailCard>
        </section>
      ) : null}

      {supportingSections.length > 0 ? (
        <section
          className={cn(
            "mt-10 gap-5",
            supportingSections.length === 1 ? "mx-auto max-w-3xl" : "grid lg:grid-cols-2",
          )}
        >
          {supportingSections.map((section) => (
            <DetailCard
              key={section.id}
              eyebrow={getSectionSettingString(section, "eyebrow") ?? section.sectionKey}
              title={section.heading}
              description={section.subheading}
            >
              <Markdown content={section.bodyMarkdown} />
            </DetailCard>
          ))}
        </section>
      ) : null}

      <RecommendationsDirectory recommendations={recommendations} />
    </div>
  );
}

export default async function RecommendationsPage() {
  const data = await getRecommendationsPageData();

  if (!data.page) {
    notFound();
  }

  if (data.page.slug !== DEFAULT_TOP_LEVEL_PAGE_PATHS.recommendations) {
    permanentRedirect(data.page.slug);
  }

  return <RecommendationsPageContent data={data} />;
}
