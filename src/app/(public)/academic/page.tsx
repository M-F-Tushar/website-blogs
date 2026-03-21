import { ContentCard } from "@/components/site/content-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedAcademicEntries } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/content/seo";

export const metadata = buildMetadata({
  title: "Academic",
  description:
    "Coursework, research interests, paper-reading notes, experiments, and academic growth over time.",
  path: "/academic",
});

export default async function AcademicPage() {
  const entries = await getPublishedAcademicEntries();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <SectionHeading
        eyebrow="Academic"
        title="Coursework, research notes, experiments, and evidence of deeper study"
        description="This section tracks academic growth, research curiosity, and the transition from student work to more serious technical exploration."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <ContentCard
            key={entry.id}
            href={`/academic/${entry.slug}`}
            eyebrow={entry.entryType.replace(/_/g, " ")}
            title={entry.title}
            description={entry.summary}
            date={entry.completedAt ?? entry.startedAt}
          />
        ))}
      </div>
    </div>
  );
}
