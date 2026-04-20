import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArticleReadingRail,
  ArticleTableOfContents,
} from "@/components/site/article-navigation";
import { Markdown } from "@/components/site/markdown";
import { extractArticleHeadings } from "@/lib/content/article-outline";
import { getPostBySlug } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";
import { countWords, estimateReadingTime, formatDisplayDate } from "@/lib/utils";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return buildSiteMetadata({
      title: "Post not found",
      description: "The requested post could not be found.",
      path: `/blogs/${slug}`,
    });
  }

  return buildSiteMetadata({
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? post.title,
    path: `/blogs/${post.slug}`,
    image: post.coverUrl,
    canonicalUrl: post.canonicalUrl,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const headings = extractArticleHeadings(post.bodyMarkdown);
  const readingTime = estimateReadingTime(post.bodyMarkdown);
  const wordCount = countWords(post.bodyMarkdown);
  const railQuote = post.excerpt ?? headings[0]?.text ?? null;
  const coverMeta = post.tags.length > 0 ? post.tags.slice(0, 3) : post.categories.slice(0, 3);
  const mainSectionCount = headings.filter((heading) => heading.level === 2).length;

  return (
    <article className="relative">
      <div className="mx-auto max-w-[96rem] px-6 pb-20 pt-12 md:pb-28 md:pt-16 xl:px-10 2xl:px-14">
        <header className="mx-auto max-w-[78rem]">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-end">
            <div className="max-w-4xl">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-sky-300">
                {post.categories.join(" / ") || "Blog"}
              </p>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-balance text-white md:text-7xl">
                {post.title}
              </h1>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-400">
                <span>{formatDisplayDate(post.publishedAt)}</span>
                <span>{readingTime}</span>
                {post.tags.length > 0 ? <span>{post.tags.join(" / ")}</span> : null}
              </div>
              {post.excerpt ? (
                <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300 md:text-[1.45rem]">
                  {post.excerpt}
                </p>
              ) : null}
            </div>

            <div className="hidden xl:block">
              <div className="border-l border-white/10 pl-6">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-200/72">
                  Entry note
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {post.excerpt ??
                    "A systems-focused notebook entry on deliberate practice, feedback loops, and building stronger learning habits."}
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

        {post.coverUrl ? (
          <figure className="relative mx-auto mt-14 max-w-[82rem]">
            <div className="absolute inset-x-10 -inset-y-8 overflow-hidden rounded-[3rem] opacity-35 blur-3xl">
              <Image
                src={post.coverUrl}
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
                  src={post.coverUrl}
                  alt={post.coverAlt ?? post.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 88vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04),rgba(2,6,23,0.2)_50%,rgba(2,6,23,0.72))]" />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 md:p-7">
                  <div className="max-w-xl">
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-sky-200/80">
                      Visual preface
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-100/92 md:text-base">
                      {post.excerpt ??
                        "A visual cue for the article before the notes move into structure, practice, and reflection."}
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
              <Markdown content={post.bodyMarkdown} />
            </div>
            <footer className="mt-14 border-t border-white/8 pt-8">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-200/72">
                Continue the archive
              </p>
              <div className="mt-4 flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-[1.8rem] font-semibold leading-tight tracking-[-0.04em] text-white">
                    More notes from the same learning system
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Browse the full blog archive for project filters, study notes, and technical reflections.
                  </p>
                </div>
                <Link
                  href="/blogs"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
                >
                  Back to blog
                </Link>
              </div>
            </footer>
          </div>
          <ArticleTableOfContents headings={headings} />
        </div>
      </div>
    </article>
  );
}
