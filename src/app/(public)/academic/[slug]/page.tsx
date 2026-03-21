import { notFound } from "next/navigation";

import { Markdown } from "@/components/site/markdown";
import { getAcademicEntryBySlug } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/content/seo";
import { formatDisplayDate } from "@/lib/utils";

interface AcademicDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AcademicDetailPageProps) {
  const { slug } = await params;
  const entry = await getAcademicEntryBySlug(slug);

  if (!entry) {
    return buildMetadata({
      title: "Academic entry not found",
      description: "The requested academic entry could not be found.",
      path: `/academic/${slug}`,
    });
  }

  return buildMetadata({
    title: entry.metaTitle ?? entry.title,
    description: entry.metaDescription ?? entry.summary ?? entry.title,
    path: `/academic/${entry.slug}`,
    image: entry.coverUrl,
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

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
        {entry.entryType.replace(/_/g, " ")}
      </p>
      <h1 className="mt-6 font-display text-4xl leading-tight font-semibold tracking-[-0.05em] text-balance md:text-6xl">
        {entry.title}
      </h1>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
        <span>{formatDisplayDate(entry.completedAt ?? entry.startedAt)}</span>
        {entry.externalUrl ? (
          <a href={entry.externalUrl} target="_blank" rel="noreferrer">
            External reference
          </a>
        ) : null}
      </div>
      <p className="mt-8 text-lg leading-8 text-muted">{entry.summary}</p>
      <div className="surface-panel mt-12 rounded-[2rem] px-6 py-8 md:px-10 md:py-12">
        <Markdown content={entry.bodyMarkdown} />
      </div>
    </article>
  );
}
