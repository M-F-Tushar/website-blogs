import { notFound, permanentRedirect } from "next/navigation";

import { ContentCard } from "@/components/site/content-card";
import { DetailCard } from "@/components/site/detail-card";
import { Markdown } from "@/components/site/markdown";
import { SignalCard } from "@/components/site/signal-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAcademicPageData } from "@/lib/content/queries";
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
  return buildTopLevelPageMetadata("academic", {
    title: "Academic",
    description:
      "Coursework, research interests, paper-reading notes, experiments, and academic growth over time.",
  });
}

export async function AcademicPageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getAcademicPageData>>;
} = {}) {
  const resolvedData = data ?? (await getAcademicPageData());
  const { page, sections, entries } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);
  const supportingSections = sections.filter((section) => section.id !== heroSection?.id);
  const panelLabel =
    getSectionSettingString(heroSection, "panelLabel") ?? "Research continuity";
  const panelItems = getSectionPanelItems(heroSection, "panelItems", [
    {
      label: "Indexed entries",
      value: String(entries.length).padStart(2, "0"),
      description: "Published academic records",
    },
    {
      label: "Emphasis",
      value: "Study and experiments",
      description:
        "Coursework, experiments, paper notes, and the evidence trail behind deeper study.",
    },
  ]);
  const emptyState =
    getSectionSettingString(heroSection, "emptyState") ??
    "No published academic entries yet. Add your first item from the admin panel.";

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="grid-backdrop overflow-hidden rounded-[2.15rem] border border-white/45">
        <div className="grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SectionHeading
              eyebrow={
                getSectionSettingString(heroSection, "eyebrow") ??
                page?.title ??
                "Academic"
              }
              title={
                heroSection?.heading ??
                page?.title ??
                "Coursework, research notes, experiments, and evidence of deeper study"
              }
              description={
                heroSection?.subheading ??
                page?.metaDescription ??
                "This section tracks academic growth, research curiosity, and the transition from student work to more serious technical exploration."
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

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <ContentCard
            key={entry.id}
            href={`/academic/${entry.slug}`}
            eyebrow={entry.entryType.replace(/_/g, " ")}
            title={entry.title}
            description={entry.summary}
            date={entry.completedAt ?? entry.startedAt}
            imageUrl={entry.coverUrl}
            imageAlt={entry.coverAlt}
          />
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="surface-panel mt-10 rounded-[1.75rem] p-8 text-sm text-muted">
          {emptyState}
        </div>
      ) : null}
    </div>
  );
}

export default async function AcademicPage() {
  const data = await getAcademicPageData();

  if (!data.page) {
    notFound();
  }

  if (data.page.slug !== DEFAULT_TOP_LEVEL_PAGE_PATHS.academic) {
    permanentRedirect(data.page.slug);
  }

  return <AcademicPageContent data={data} />;
}
