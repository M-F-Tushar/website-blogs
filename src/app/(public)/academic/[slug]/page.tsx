import { notFound } from "next/navigation";

import { LongformArticleLayout } from "@/components/site/longform-layout";
import { getAcademicEntryBySlug } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";
import { extractMarkdownHeadings } from "@/lib/markdown-outline";
import { estimateReadingTime, formatDisplayDate } from "@/lib/utils";

interface AcademicDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AcademicDetailPageProps) {
  const { slug } = await params;
  const entry = await getAcademicEntryBySlug(slug);

  if (!entry) {
    return buildSiteMetadata({
      title: "Academic entry not found",
      description: "The requested academic entry could not be found.",
      path: `/academic/${slug}`,
    });
  }

  return buildSiteMetadata({
    title: entry.metaTitle ?? entry.title,
    description: entry.metaDescription ?? entry.summary ?? entry.title,
    path: `/academic/${entry.slug}`,
    image: entry.coverUrl,
    canonicalUrl: entry.canonicalUrl,
  });
}

export default async function AcademicDetailPage({
  params,
}: AcademicDetailPageProps) {
  const { slug } = await params;
  const entry = await getAcademicEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const headings = extractMarkdownHeadings(entry.bodyMarkdown);
  const readingTime = estimateReadingTime(entry.bodyMarkdown);
  const completedOrStarted = entry.completedAt ?? entry.startedAt;

  return (
    <LongformArticleLayout
      taxonomy={[entry.entryType.replace(/_/g, " ")]}
      title={entry.title}
      summary={entry.summary}
      heroMeta={
        <>
          <span className="signal-pill">
            {completedOrStarted ? formatDisplayDate(completedOrStarted) : "In progress"}
          </span>
          <span className="signal-pill">{readingTime}</span>
          {entry.externalUrl ? (
            <a
              href={entry.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="signal-pill transition hover:border-sky-300 hover:text-white"
            >
              External reference
            </a>
          ) : null}
        </>
      }
      coverUrl={entry.coverUrl}
      coverAlt={entry.coverAlt}
      bodyMarkdown={entry.bodyMarkdown}
      headings={headings}
      railSummary="A structured reading rail for research notes, coursework, and experiments so the material feels indexed, not buried."
      railContent={
        <div className="surface-panel rounded-[1.8rem] p-5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-300">
            Academic context
          </p>
          <div className="mt-4 grid gap-3">
            <div className="reading-info-card">
              <span className="reading-info-label">Entry type</span>
              <span className="reading-info-value">
                {entry.entryType.replace(/_/g, " ")}
              </span>
            </div>
            <div className="reading-info-card">
              <span className="reading-info-label">Timeline</span>
              <span className="reading-info-value">
                {completedOrStarted ? formatDisplayDate(completedOrStarted) : "In progress"}
              </span>
            </div>
            <div className="reading-info-card">
              <span className="reading-info-label">Depth</span>
              <span className="reading-info-value">{readingTime}</span>
            </div>
            {entry.externalUrl ? (
              <div className="reading-info-card">
                <span className="reading-info-label">Reference</span>
                <a
                  href={entry.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-300 hover:text-white"
                >
                  Open source material
                </a>
              </div>
            ) : null}
          </div>
        </div>
      }
    />
  );
}
