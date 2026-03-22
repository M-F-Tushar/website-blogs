import { notFound, permanentRedirect } from "next/navigation";

import { ContentCard } from "@/components/site/content-card";
import { Markdown } from "@/components/site/markdown";
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
          <div className="surface-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="signal-label">{panelLabel}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {panelItems.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-[1.35rem] border border-border bg-white/60 p-4"
                >
                  <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em]">
                    {item.value}
                  </p>
                  {item.description ? (
                    <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {supportingSections.length > 0 ? (
        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          {supportingSections.map((section) => (
            <div key={section.id} className="surface-panel rounded-[1.75rem] p-6 md:p-8">
              <p className="signal-label">
                {getSectionSettingString(section, "eyebrow") ?? section.sectionKey}
              </p>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.05em] text-balance">
                {section.heading}
              </h2>
              {section.subheading ? (
                <p className="mt-3 text-sm leading-7 text-muted">{section.subheading}</p>
              ) : null}
              <Markdown className="mt-5" content={section.bodyMarkdown} />
            </div>
          ))}
        </section>
      ) : null}

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((recommendation) => (
          <ContentCard
            key={recommendation.id}
            href={`/recommendations/${recommendation.slug}`}
            eyebrow={recommendation.category ?? "Recommendation"}
            title={recommendation.title}
            description={recommendation.summary}
            meta={recommendation.level}
            imageUrl={recommendation.coverUrl}
            imageAlt={recommendation.coverAlt}
          />
        ))}
      </div>

      {recommendations.length === 0 ? (
        <div className="surface-panel mt-10 rounded-[1.75rem] p-8 text-sm text-muted">
          {emptyState}
        </div>
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
