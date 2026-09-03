import { notFound } from "next/navigation";

import { ArticleCover } from "@/components/site/article-cover";
import {
  ArticleReadingRail,
  ArticleTableOfContents,
} from "@/components/site/article-navigation";
import { Markdown } from "@/components/site/markdown";
import { RelatedContent } from "@/components/site/related-content";
import { extractArticleHeadings } from "@/lib/content/article-outline";
import {
  getDetailTemplateSection,
  getPostBySlug,
  getPublishedPosts,
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
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

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
    ogType: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, template] = await Promise.all([
    getPostBySlug(slug),
    getDetailTemplateSection("blogs", "blog-detail"),
  ]);

  if (!post) {
    notFound();
  }

  const eyebrowFallback =
    getSectionSettingString(template, "eyebrowFallback") ?? "Blog";
  const sideNoteLabel =
    getSectionSettingString(template, "sideNoteLabel") ?? "Entry note";
  const sideNoteFallback =
    getSectionSettingString(template, "sideNoteFallback") ??
    "A systems-focused notebook entry on deliberate practice, feedback loops, and building stronger learning habits.";
  const coverCaptionLabel =
    getSectionSettingString(template, "coverCaptionLabel") ?? "Visual preface";
  const coverCaptionFallback =
    getSectionSettingString(template, "coverCaptionFallback") ??
    "A visual cue for the article before the notes move into structure, practice, and reflection.";
  const footerEyebrow =
    getSectionSettingString(template, "footerEyebrow") ?? "Continue the archive";
  const footerHeading =
    getSectionSettingString(template, "footerHeading") ??
    "More notes from the same learning system";
  const footerDescription =
    getSectionSettingString(template, "footerDescription") ??
    "Browse the full blog archive for project filters, study notes, and technical reflections.";
  const footerCtaLabel =
    getSectionSettingString(template, "footerCtaLabel") ?? "Back to blog";
  const footerCtaHref =
    getSectionSettingString(template, "footerCtaHref") ?? "/blogs";

  const headings = extractArticleHeadings(post.bodyMarkdown);
  const readingTime = estimateReadingTime(post.bodyMarkdown);
  const wordCount = countWords(post.bodyMarkdown);
  const railQuote = post.excerpt ?? headings[0]?.text ?? null;
  const coverMeta = post.tags.length > 0 ? post.tags.slice(0, 3) : post.categories.slice(0, 3);
  const mainSectionCount = headings.filter((heading) => heading.level === 2).length;
  const eyebrow = post.categories.join(" / ") || eyebrowFallback;
  const formattedWordCount = new Intl.NumberFormat("en-US").format(wordCount);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? post.metaDescription ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    image: post.coverUrl ?? undefined,
    keywords: [...post.categories, ...post.tags].join(", ") || undefined,
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
              <p className="inline-flex items-center gap-2.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-[0.85rem] font-semibold uppercase tracking-widest text-sky-200 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
                </span>
                {eyebrow}
              </p>
              <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground dark:text-white md:text-6xl xl:text-7xl drop-shadow-sm">
                <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                  {post.title}
                </span>
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-[0.9rem] font-medium tracking-wide text-muted dark:text-slate-400">
                <span className="inline-flex items-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 text-muted dark:text-slate-300 backdrop-blur-sm">
                  {formatDisplayDate(post.publishedAt)}
                </span>
                <span className="inline-flex items-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 text-muted dark:text-slate-300 backdrop-blur-sm">
                  {readingTime}
                </span>
                {post.tags.length > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-300 backdrop-blur-sm">
                    {post.tags.join(" / ")}
                  </span>
                ) : null}
              </div>
              {post.excerpt ? (
                <p className="mt-8 max-w-3xl text-[1.1rem] font-light leading-[1.8] text-muted dark:text-slate-300 md:text-[1.3rem]">
                  {post.excerpt}
                </p>
              ) : null}
            </div>

            <div className="hidden lg:block">
              <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-6 shadow-lg backdrop-blur-xl transition-all hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:border-sky-500/30 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    {sideNoteLabel}
                  </p>
                  <p className="mt-4 text-[0.95rem] leading-[1.7] text-muted dark:text-slate-400 group-hover:text-muted dark:text-slate-300 transition-colors">
                    {post.excerpt ?? sideNoteFallback}
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

        {post.coverUrl ? (
          <ArticleCover
            src={post.coverUrl}
            alt={post.coverAlt ?? post.title}
            captionLabel={coverCaptionLabel}
            captionText={post.excerpt ?? coverCaptionFallback}
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
              <Markdown className="markdown-inverse" content={post.bodyMarkdown} />
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
