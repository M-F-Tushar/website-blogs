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
import {
  countWords,
  estimateReadingTime,
  formatDisplayDate,
  serializeJsonLd,
} from "@/lib/utils";

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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <div className="mx-auto max-w-[96rem] px-6 pb-20 pt-12 md:pb-28 md:pt-16 xl:px-10 2xl:px-14">
        <header className="mx-auto max-w-[78rem]">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="inline-flex items-center gap-2.5 rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-[0.85rem] font-semibold uppercase tracking-widest text-purple-200 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
                  </span>
                  {eyebrow}
                </p>
                <span className="inline-flex items-center rounded-full border border-sky-300/25 bg-sky-500/10 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.22em] text-sky-200">
                  {entryTypeLabel}
                </span>
              </div>
              <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground dark:text-white md:text-6xl xl:text-7xl drop-shadow-sm">
                <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                  {entry.title}
                </span>
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-[0.9rem] font-medium tracking-wide text-muted dark:text-slate-400">
                <span className="inline-flex items-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 text-muted dark:text-slate-300 backdrop-blur-sm">
                  {academicDate}
                </span>
                <span className="inline-flex items-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 text-muted dark:text-slate-300 backdrop-blur-sm">
                  {readingTime}
                </span>
                {entry.externalUrl ? (
                  <a
                    href={entry.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-300 backdrop-blur-sm transition-all hover:border-sky-400/40 hover:bg-sky-400/20 hover:text-foreground dark:text-white focus-visible:outline-none"
                  >
                    External reference
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
              {entry.summary ? (
                <p className="mt-8 max-w-3xl text-[1.1rem] font-light leading-[1.8] text-muted dark:text-slate-300 md:text-[1.3rem]">
                  {entry.summary}
                </p>
              ) : null}
            </div>

            <div className="hidden lg:block">
              <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-6 shadow-lg backdrop-blur-xl transition-all hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:border-purple-500/30 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(168,85,247,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    {sideNoteLabel}
                  </p>
                  <p className="mt-4 text-[0.95rem] leading-[1.7] text-muted dark:text-slate-400 group-hover:text-muted dark:text-slate-300 transition-colors">
                    {entry.summary ?? sideNoteFallback}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-3xl lg:hidden">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-border dark:border-white/8 bg-black/[0.03] dark:bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.26em] text-muted dark:text-slate-500">
                Reading time
              </p>
              <p className="mt-2 text-base text-foreground dark:text-white">{readingTime}</p>
            </div>
            <div className="rounded-[1.4rem] border border-border dark:border-white/8 bg-black/[0.03] dark:bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.26em] text-muted dark:text-slate-500">
                Word count
              </p>
              <p className="mt-2 text-base text-foreground dark:text-white">{formattedWordCount}</p>
            </div>
            <div className="rounded-[1.4rem] border border-border dark:border-white/8 bg-black/[0.03] dark:bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.26em] text-muted dark:text-slate-500">
                Sections
              </p>
              <p className="mt-2 text-base text-foreground dark:text-white">
                {mainSectionCount > 0 ? mainSectionCount : "Opening note"}
              </p>
            </div>
          </div>

          {headings.length > 0 ? (
            <details className="mt-4 rounded-[1.5rem] border border-border dark:border-white/8 bg-black/[0.03] dark:bg-white/[0.03] px-5 py-4">
              <summary className="cursor-pointer list-none font-mono text-[0.7rem] uppercase tracking-[0.28em] text-sky-200/72">
                Table of contents
              </summary>
              <nav className="mt-4 space-y-2">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`block text-sm leading-6 text-muted dark:text-slate-300 hover:text-foreground dark:text-white focus-visible:outline-none focus-visible:text-foreground dark:text-white ${
                      heading.level === 2 ? "" : "pl-4 text-muted dark:text-slate-400"
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
            <div className="mb-8 flex items-center gap-4 text-sm text-muted dark:text-slate-500 xl:hidden">
              <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              <span>Begin reading</span>
              <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            </div>

            <div
              id="article-body"
              className="article-markdown relative border-t border-border dark:border-white/10 pt-10 md:pt-14 [&_.markdown-body_p]:!text-muted dark:text-slate-300 [&_.markdown-body_li]:!text-muted dark:text-slate-300 [&_.markdown-body_h2]:!text-foreground dark:text-white [&_.markdown-body_h3]:!text-foreground dark:text-white [&_.markdown-body_strong]:!text-foreground dark:text-white"
            >
              <Markdown className="markdown-inverse" content={entry.bodyMarkdown} />
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
