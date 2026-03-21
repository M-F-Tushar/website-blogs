import { ContentCard } from "@/components/site/content-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedAcademicEntries } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";

export async function generateMetadata() {
  return buildSiteMetadata({
    title: "Academic",
    description:
      "Coursework, research interests, paper-reading notes, experiments, and academic growth over time.",
    path: "/academic",
  });
}

export default async function AcademicPage() {
  const entries = await getPublishedAcademicEntries();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="grid-backdrop overflow-hidden rounded-[2.15rem] border border-white/45">
        <div className="grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionHeading
            eyebrow="Academic"
            title="Coursework, research notes, experiments, and evidence of deeper study"
            description="This section tracks academic growth, research curiosity, and the transition from student work to more serious technical exploration."
          />
          <div className="surface-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="signal-label">Research continuity</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-border bg-white/60 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-muted">
                  Indexed entries
                </p>
                <p className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em]">
                  {String(entries.length).padStart(2, "0")}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-border bg-white/60 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-muted">
                  Emphasis
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Coursework, experiments, paper notes, and the evidence trail behind
                  deeper study.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
