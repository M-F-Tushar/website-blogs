import { notFound, permanentRedirect } from "next/navigation";

import { ContentCard } from "@/components/site/content-card";
import { DetailCard } from "@/components/site/detail-card";
import { Markdown } from "@/components/site/markdown";
import { SignalCard } from "@/components/site/signal-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getRecommendationsPageData } from "@/lib/content/queries";
import {
  getPrimarySection,
  getSectionPanelItems,
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

function getCollectionGridClasses(count: number) {
  if (count <= 1) {
    return "mt-12 max-w-4xl";
  }

  return "mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3";
}

function isFeaturedCollectionCard(count: number, index: number) {
  return count === 1 || (count >= 3 && index === 0);
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
  const panelLabel = getSectionSettingString(heroSection, "panelLabel") ?? "Curated stack";
  const panelItems = getSectionPanelItems(heroSection, "panelItems", [
    {
      label: "Saved resources",
      value: String(recommendations.length).padStart(2, "0"),
      description: "Published recommendations",
    },
    {
      label: "Filter",
      value: "Useful in practice",
      description:
        "Books, tools, and references that actually hold up in practice.",
    },
  ]);
  const emptyState =
    getSectionSettingString(heroSection, "emptyState") ??
    "No published recommendations yet. Add your first recommendation from the admin panel.";

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="grid-backdrop overflow-hidden rounded-[2.15rem] border border-white/45">
        <div className="grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SectionHeading
              eyebrow={
                getSectionSettingString(heroSection, "eyebrow") ??
                page?.title ??
                "Recommendations"
              }
              title={
                heroSection?.heading ??
                page?.title ??
                "Resources I'd recommend because they support real progress"
              }
              description={
                heroSection?.subheading ??
                page?.metaDescription ??
                "Books, tools, and learning assets filtered through actual use, not generic listicle energy."
              }
            />
            {heroSection?.bodyMarkdown ? (
              <Markdown className="mt-8" content={heroSection.bodyMarkdown} />
            ) : null}
          </div>
          <div className="editorial-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="signal-label">{panelLabel}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {panelItems.map((item) => (
                <SignalCard
                  key={`${item.label}-${item.value}`}
                  eyebrow={item.label}
                  title={item.value}
                  description={item.description}
                  emphasis="display"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {supportingSections.length > 0 ? (
        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          {supportingSections.map((section) => (
            <DetailCard
              key={section.id}
              eyebrow={getSectionSettingString(section, "eyebrow") ?? section.sectionKey}
              title={section.heading}
              description={section.subheading}
              className="md:p-8"
            >
              <Markdown content={section.bodyMarkdown} />
            </DetailCard>
          ))}
        </section>
      ) : null}

      {recommendations.length > 0 ? (
        <div className={getCollectionGridClasses(recommendations.length)}>
          {recommendations.map((recommendation, index) => (
            <ContentCard
              key={recommendation.id}
              href={`/recommendations/${recommendation.slug}`}
              eyebrow={recommendation.category ?? "Recommendation"}
              title={recommendation.title}
              description={recommendation.summary}
              meta={recommendation.level}
              imageUrl={recommendation.coverUrl}
              imageAlt={recommendation.coverAlt}
              size={
                isFeaturedCollectionCard(recommendations.length, index)
                  ? "feature"
                  : "default"
              }
              className={cn(
                recommendations.length >= 3 &&
                  index === 0 &&
                  "md:col-span-2 xl:col-span-2",
              )}
            />
          ))}
        </div>
      ) : null}

      {recommendations.length === 0 ? (
        <DetailCard
          className="mt-10 md:p-8"
          eyebrow="Archive status"
          title="No published recommendations yet"
          description={emptyState}
        />
      ) : null}
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
