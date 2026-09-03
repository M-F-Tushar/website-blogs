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
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] px-8 py-12 shadow-2xl backdrop-blur-xl md:px-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.1),transparent_50%)]" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[0.85rem] font-semibold uppercase tracking-widest text-emerald-200 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              {heroEyebrow}
            </p>
            <h1 className="mt-8 max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground dark:text-white md:text-[5.5rem] drop-shadow-sm">
              {heroTitle.includes("Recommendation") ? (
                <>
                  My <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">Recommendations</span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">{heroTitle}</span>
              )}
            </h1>
            <p className="mt-8 max-w-2xl text-[1.1rem] font-light leading-[1.7] text-muted dark:text-slate-300 md:text-[1.25rem]">
              {heroDescription}
            </p>
          </div>
          <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-8 shadow-lg backdrop-blur-md transition-colors hover:bg-black/[0.04] dark:bg-white/[0.04] hover:border-emerald-500/20 hover:shadow-[0_12px_40px_rgba(16,185,129,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 flex gap-4">
              <div className="flex-1">
                <p className="font-display text-[2.5rem] font-bold tracking-[-0.05em] text-foreground dark:text-white">
                  {recommendations.length}
                </p>
                <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-emerald-400">
                  {railResourcesUnitLabel}
                </p>
              </div>
              <div className="w-px bg-black/10 dark:bg-white/10" />
              <div className="flex-1">
                <p className="font-display text-[2.5rem] font-bold tracking-[-0.05em] text-foreground dark:text-white">
                  {categoryCount}
                </p>
                <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-emerald-400">
                  {railCategoriesUnitLabel}
                </p>
              </div>
            </div>
            <div className="relative z-10 mt-6 pt-6 border-t border-border dark:border-white/10">
              <p className="text-[0.95rem] leading-relaxed text-muted dark:text-slate-400 group-hover:text-muted dark:text-slate-300 transition-colors">
                {railDescription}
              </p>
            </div>
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
