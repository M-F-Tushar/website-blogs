import Image from "next/image";
import { notFound } from "next/navigation";

import {
  ArticleReadingRail,
  ArticleTableOfContents,
} from "@/components/site/article-navigation";
import { Markdown } from "@/components/site/markdown";
import { extractArticleHeadings } from "@/lib/content/article-outline";
import { getAcademicEntryBySlug } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";
import { countWords, estimateReadingTime, formatDisplayDate } from "@/lib/utils";

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

  const headings = extractArticleHeadings(entry.bodyMarkdown);
  const readingTime = estimateReadingTime(entry.bodyMarkdown);
  const wordCount = countWords(entry.bodyMarkdown);
  const railQuote = entry.summary ?? headings[0]?.text ?? null;
  const coverMeta = [
    entry.entryType.replace(/_/g, " "),
    entry.completedAt ? "completed" : entry.startedAt ? "in progress" : null,
    entry.externalUrl ? "reference-linked" : null,
  ].filter(Boolean) as string[];
  const academicDate = formatDisplayDate(entry.completedAt ?? entry.startedAt);

  return (
    <article className="relative">
      <div className="mx-auto max-w-[96rem] px-6 pb-20 pt-12 md:pb-28 md:pt-16 xl:px-10 2xl:px-14">
        <header className="mx-auto max-w-[78rem]">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-end">
            <div className="max-w-4xl">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-sky-300">
                {entry.entryType.replace(/_/g, " ")}
              </p>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-balance text-white md:text-7xl">
                {entry.title}
              </h1>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-400">
                <span>{academicDate}</span>
                <span>{readingTime}</span>
                {entry.externalUrl ? (
                  <a
                    href={entry.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-300 transition hover:text-white"
                  >
                    External reference
                  </a>
                ) : null}
              </div>
              {entry.summary ? (
                <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300 md:text-[1.45rem]">
                  {entry.summary}
                </p>
              ) : null}
            </div>

            <div className="hidden xl:block">
              <div className="border-l border-white/10 pl-6">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-200/72">
                  Entry note
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {entry.summary ??
                    "An academic working note arranged for slower reading, clearer sectioning, and easier revisiting."}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-3xl xl:hidden">
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
              <p className="mt-2 text-base text-white">
                {new Intl.NumberFormat("en-US").format(wordCount)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.26em] text-slate-500">
                Sections
              </p>
              <p className="mt-2 text-base text-white">
                {Math.max(headings.filter((heading) => heading.level === 2).length, 1)}
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
                    className={`block text-sm leading-6 text-slate-300 ${
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
          <figure className="relative mx-auto mt-14 max-w-[82rem]">
            <div className="absolute inset-x-10 -inset-y-8 overflow-hidden rounded-[3rem] opacity-35 blur-3xl">
              <Image
                src={entry.coverUrl}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                aria-hidden
              />
            </div>
            <div className="relative overflow-hidden rounded-[2.6rem] border border-white/8">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={entry.coverUrl}
                  alt={entry.coverAlt ?? entry.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 88vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04),rgba(2,6,23,0.2)_50%,rgba(2,6,23,0.72))]" />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 md:p-7">
                  <div className="max-w-xl">
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-sky-200/80">
                      Academic frame
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-100/92 md:text-base">
                      {entry.summary ??
                        "A visual anchor for the paper, project, or coursework note before the deeper reading begins."}
                    </p>
                  </div>
                  {coverMeta.length > 0 ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      {coverMeta.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/12 bg-slate-950/40 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </figure>
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
          </div>

          <ArticleTableOfContents headings={headings} />
        </div>
      </div>
    </article>
  );
}
