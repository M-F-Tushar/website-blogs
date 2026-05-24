import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { ArticleCover } from "@/components/site/article-cover";
import {
  ArticleReadingRail,
  ArticleTableOfContents,
} from "@/components/site/article-navigation";
import { Markdown } from "@/components/site/markdown";
import { RelatedContent } from "@/components/site/related-content";
import { extractArticleHeadings } from "@/lib/content/article-outline";
import {
  getAcademicEntryBySlug,
  getDetailTemplateSection,
  getPublishedAcademicEntries,
} from "@/lib/content/queries";
import { getSectionSettingString } from "@/lib/content/section-settings";
import { buildSiteMetadata } from "@/lib/content/seo";
import { countWords, estimateReadingTime, formatDisplayDate } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const entries = await getPublishedAcademicEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

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
    ogType: "article",
    publishedTime: entry.completedAt ?? entry.startedAt,
  });
}

export default async function AcademicDetailPage({
  params,
}: AcademicDetailPageProps) {
  const { slug } = await params;
  const [entry, template] = await Promise.all([
    getAcademicEntryBySlug(slug),
    getDetailTemplateSection("academic", "academic-detail"),
  ]);

  if (!entry) {
    notFound();
  }

  const eyebrowFallback =
    getSectionSettingString(template, "eyebrowFallback") ?? "Academic";
  const sideNoteLabel =
    getSectionSettingString(template, "sideNoteLabel") ?? "Entry note";
  const sideNoteFallback =
    getSectionSettingString(template, "sideNoteFallback") ??
    "An academic working note arranged for slower reading, clearer sectioning, and easier revisiting.";
  const coverCaptionLabel =
    getSectionSettingString(template, "coverCaptionLabel") ?? "Academic frame";
  const coverCaptionFallback =
    getSectionSettingString(template, "coverCaptionFallback") ??
    "A visual anchor for the paper, project, or coursework note before the deeper reading begins.";
  const footerEyebrow =
    getSectionSettingString(template, "footerEyebrow") ?? "Continue the evidence trail";
  const footerHeading =
    getSectionSettingString(template, "footerHeading") ??
    "More academic records and research notes";
  const footerDescription =
    getSectionSettingString(template, "footerDescription") ??
    "Return to the academic archive for coursework, experiments, and deeper study.";
  const footerCtaLabel =
    getSectionSettingString(template, "footerCtaLabel") ?? "Back to academic";
  const footerCtaHref =
    getSectionSettingString(template, "footerCtaHref") ?? "/academic";

  const headings = extractArticleHeadings(entry.bodyMarkdown);
  const readingTime = estimateReadingTime(entry.bodyMarkdown);
  const wordCount = countWords(entry.bodyMarkdown);
  const railQuote = entry.summary ?? headings[0]?.text ?? null;
  const entryTypeLabel = entry.entryType.replace(/_/g, " ");
  const coverMeta = [
    entryTypeLabel,
    entry.completedAt ? "completed" : entry.startedAt ? "in progress" : null,
    entry.externalUrl ? "reference-linked" : null,
  ].filter(Boolean) as string[];
  const academicDate = formatDisplayDate(entry.completedAt ?? entry.startedAt);
  const mainSectionCount = headings.filter((heading) => heading.level === 2).length;
  const eyebrow = entryTypeLabel || eyebrowFallback;
  const formattedWordCount = new Intl.NumberFormat("en-US").format(wordCount);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: entry.title,
    description: entry.summary ?? entry.metaDescription ?? undefined,
    datePublished: entry.completedAt ?? entry.startedAt ?? undefined,
    image: entry.coverUrl ?? undefined,
    wordCount,
  };

  return (
    <article className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="mx-auto max-w-[96rem] px-6 pb-20 pt-12 md:pb-28 md:pt-16 xl:px-10 2xl:px-14">
        <header className="mx-auto max-w-[78rem]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="detail-eyebrow">{eyebrow}</p>
                <span className="inline-flex items-center rounded-full border border-sky-300/25 bg-sky-500/10 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.22em] text-sky-200">
                  {entryTypeLabel}
                </span>
              </div>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-balance text-white md:text-6xl xl:text-7xl">
                {entry.title}
              </h1>
              <div className="detail-meta mt-8">
                <span>{academicDate}</span>
                <span className="detail-meta-sep" aria-hidden>·</span>
                <span className="detail-meta-stat">{readingTime}</span>
                {entry.externalUrl ? (
                  <>
                    <span className="detail-meta-sep" aria-hidden>·</span>
                    <a
                      href={entry.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sky-300 transition hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
                    >
                      External reference
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </>
                ) : null}
              </div>
              {entry.summary ? (
                <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300 md:text-[1.45rem]">
                  {entry.summary}
                </p>
              ) : null}
            </div>

            <div className="hidden lg:block">
              <div className="border-l border-white/10 pl-6">
                <p className="detail-eyebrow text-sky-200/72">{sideNoteLabel}</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {entry.summary ?? sideNoteFallback}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-3xl lg:hidden">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.26em] text-slate-500">
                Reading time
              </p>
              <p className="mt-2 text-base text-white">{readingTime}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.26em] text-slate-500">
                Word count
              </p>
              <p className="mt-2 text-base text-white">{formattedWordCount}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.26em] text-slate-500">
                Sections
              </p>
              <p className="mt-2 text-base text-white">
                {mainSectionCount > 0 ? mainSectionCount : "Opening note"}
              </p>
            </div>
          </div>

          {headings.length > 0 ? (
            <details className="mt-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <summary className="cursor-pointer list-none font-mono text-[0.7rem] uppercase tracking-[0.28em] text-sky-200/72">
                Table of contents
              </summary>
              <nav className="mt-4 space-y-2">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`block text-sm leading-6 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:text-white ${
                      heading.level === 2 ? "" : "pl-4 text-slate-400"
                    }`}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </details>
          ) : null}
        </div>

        {entry.coverUrl ? (
          <ArticleCover
            src={entry.coverUrl}
            alt={entry.coverAlt ?? entry.title}
            captionLabel={coverCaptionLabel}
            captionText={entry.summary ?? coverCaptionFallback}
            metaPills={coverMeta}
            priority
          />
        ) : null}

        <div className="mx-auto mt-16 grid max-w-[86rem] gap-12 xl:grid-cols-[15rem_minmax(0,48rem)_17rem] 2xl:grid-cols-[17rem_minmax(0,50rem)_18rem]">
          <ArticleReadingRail
            headings={headings}
            readingTime={readingTime}
            wordCount={wordCount}
            quote={railQuote}
          />

          <div className="min-w-0">
            <div className="mb-8 flex items-center gap-4 text-sm text-slate-500 xl:hidden">
              <span className="h-px flex-1 bg-white/10" />
              <span>Begin reading</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div
              id="article-body"
              className="article-markdown relative border-t border-white/8 pt-8 md:pt-10"
            >
              <Markdown content={entry.bodyMarkdown} />
            </div>

            <RelatedContent
              eyebrow={footerEyebrow}
              heading={footerHeading}
              description={footerDescription}
              ctaLabel={footerCtaLabel}
              ctaHref={footerCtaHref}
            />
          </div>

          <ArticleTableOfContents headings={headings} />
        </div>
      </div>
    </article>
  );
}
