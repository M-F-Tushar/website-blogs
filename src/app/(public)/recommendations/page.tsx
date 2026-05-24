import { notFound, permanentRedirect } from "next/navigation";

import {
  RecommendationsDirectory,
  type RecommendationsDirectoryCopy,
} from "@/components/site/recommendations-directory";
import {
  getRecommendationsPageData,
  getDetailTemplateSection,
} from "@/lib/content/queries";
import {
  getPrimarySection,
  getSectionSettingString,
} from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";

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
  const [resolvedData, template] = await Promise.all([
    data ? Promise.resolve(data) : getRecommendationsPageData(),
    getDetailTemplateSection("recommendations", "recommendation-list"),
  ]);
  const { page, sections, recommendations } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);
  const categoryCount = new Set(
    recommendations.map((item) => item.category).filter(Boolean),
  ).size;

  const heroEyebrow =
    getSectionSettingString(heroSection, "eyebrow") ??
    getSectionSettingString(template, "heroEyebrow") ??
    "Curated Resources";
  const heroTitle =
    getSectionSettingString(heroSection, "heroTitle") ??
    page?.title ??
    getSectionSettingString(template, "heroTitleFallback") ??
    "Recommendations";
  const heroDescription =
    heroSection?.subheading ??
    page?.metaDescription ??
    getSectionSettingString(template, "heroDescriptionFallback") ??
    "A hand-picked collection of tools, books, courses, and resources that have helped me on my journey.";
  const railResourcesUnitLabel =
    getSectionSettingString(template, "railResourcesUnitLabel") ?? "resources";
  const railCategoriesUnitLabel =
    getSectionSettingString(template, "railCategoriesUnitLabel") ?? "categories";
  const railDescription =
    getSectionSettingString(template, "railDescription") ??
    "A practical shelf for tools, books, courses, and references worth returning to.";

  const copy: RecommendationsDirectoryCopy = {
    searchPlaceholder:
      getSectionSettingString(template, "searchPlaceholder") ??
      "Search by title, description, or tag...",
    filterAllLabel: getSectionSettingString(template, "filterAllLabel") ?? "All",
    countLabel:
      getSectionSettingString(template, "countLabel") ??
      "Showing {count} curated resources",
    sortNewestLabel:
      getSectionSettingString(template, "sortNewestLabel") ?? "Newest First",
    sortAlphabeticalLabel:
      getSectionSettingString(template, "sortAlphabeticalLabel") ?? "Alphabetical",
    sortLevelLabel:
      getSectionSettingString(template, "sortLevelLabel") ?? "By Level",
    cardActionLabel:
      getSectionSettingString(template, "cardActionLabel") ?? "View Resource",
    cardEyebrowFallback:
      getSectionSettingString(template, "cardEyebrowFallback") ?? "Recommendation",
    emptyEyebrow:
      getSectionSettingString(template, "emptyEyebrow") ?? "Collection state",
    emptyHeading:
      getSectionSettingString(template, "emptyHeading") ??
      "No recommendations match that filter",
    emptyDescription:
      getSectionSettingString(template, "emptyDescription") ??
      "Change the category or search term to widen the curated set again.",
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <section className="redesign-hero rounded-[2rem] border border-white/8 px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
              <span className="text-sky-400" aria-hidden>✦</span>
              {heroEyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-[3.9rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.2rem]">
              {heroTitle.includes("Recommendation") ? (
                <>
                  My <span className="accent-gradient-text">Recommendations</span>
                </>
              ) : (
                <span className="accent-gradient-text">{heroTitle}</span>
              )}
            </h1>
            <p className="mt-5 max-w-3xl text-[1.04rem] leading-8 text-slate-300 md:text-[1.14rem]">
              {heroDescription}
            </p>
          </div>
          <div className="page-rail">
            <div className="grid grid-cols-2 gap-3">
              <span className="signal-pill">
                {recommendations.length} {railResourcesUnitLabel}
              </span>
              <span className="signal-pill">
                {categoryCount} {railCategoriesUnitLabel}
              </span>
            </div>
            <div className="editorial-divider" />
            <p className="text-sm leading-7 text-slate-400">{railDescription}</p>
          </div>
        </div>
      </section>

      <RecommendationsDirectory recommendations={recommendations} copy={copy} />
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
