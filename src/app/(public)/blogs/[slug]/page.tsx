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
import { countWords, estimateReadingTime, formatDisplayDate } from "@/lib/utils";

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="mx-auto max-w-[96rem] px-6 pb-20 pt-12 md:pb-28 md:pt-16 xl:px-10 2xl:px-14">
        <header className="mx-auto max-w-[78rem]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
            <div className="max-w-4xl">
              <p className="detail-eyebrow">{eyebrow}</p>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-balance text-white md:text-6xl xl:text-7xl">
                {post.title}
              </h1>
              <div className="detail-meta mt-8">
                <span>{formatDisplayDate(post.publishedAt)}</span>
                <span className="detail-meta-sep" aria-hidden>·</span>
                <span className="detail-meta-stat">{readingTime}</span>
                {post.tags.length > 0 ? (
                  <>
                    <span className="detail-meta-sep" aria-hidden>·</span>
                    <span className="detail-meta-stat">{post.tags.join(" / ")}</span>
                  </>
                ) : null}
              </div>
              {post.excerpt ? (
                <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300 md:text-[1.45rem]">
                  {post.excerpt}
                </p>
              ) : null}
            </div>

            <div className="hidden lg:block">
              <div className="border-l border-white/10 pl-6">
                <p className="detail-eyebrow text-sky-200/72">{sideNoteLabel}</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {post.excerpt ?? sideNoteFallback}
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
