import { notFound } from "next/navigation";

import { LongformArticleLayout } from "@/components/site/longform-layout";
import { getPostBySlug } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";
import { extractMarkdownHeadings } from "@/lib/markdown-outline";
import { estimateReadingTime, formatDisplayDate } from "@/lib/utils";

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

  const headings = extractMarkdownHeadings(post.bodyMarkdown);
  const readingTime = estimateReadingTime(post.bodyMarkdown);
  const categories = post.categories.filter(Boolean);
  const tags = post.tags.filter(Boolean);

  return (
    <LongformArticleLayout
      taxonomy={categories.length > 0 ? categories : ["Blog"]}
      title={post.title}
      summary={post.excerpt}
      heroMeta={
        <>
          <span className="signal-pill">{formatDisplayDate(post.publishedAt)}</span>
          <span className="signal-pill">{readingTime}</span>
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="signal-pill">
              {tag}
            </span>
          ))}
        </>
      }
      coverUrl={post.coverUrl}
      coverAlt={post.coverAlt}
      bodyMarkdown={post.bodyMarkdown}
      headings={headings}
      railSummary="Use the outline to jump between sections while the reading column stays focused and distraction-light."
      railContent={
        <div className="surface-panel rounded-[1.8rem] p-5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-300">
            Reading snapshot
          </p>
          <div className="mt-4 grid gap-3">
            <div className="reading-info-card">
              <span className="reading-info-label">Published</span>
              <span className="reading-info-value">{formatDisplayDate(post.publishedAt)}</span>
            </div>
            <div className="reading-info-card">
              <span className="reading-info-label">Cadence</span>
              <span className="reading-info-value">{readingTime}</span>
            </div>
            {categories.length > 0 ? (
              <div className="reading-info-card">
                <span className="reading-info-label">Filed under</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span key={category} className="signal-pill !px-3 !py-2">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {tags.length > 0 ? (
              <div className="reading-info-card">
                <span className="reading-info-label">Tags</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="signal-pill !px-3 !py-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      }
    />
  );
}
