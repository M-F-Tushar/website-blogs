import { notFound } from "next/navigation";

import { Markdown } from "@/components/site/markdown";
import { getPostBySlug } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";
import { formatDisplayDate } from "@/lib/utils";

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
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
        {post.categories.join(" / ") || "Blog"}
      </p>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.05em] text-balance md:text-6xl">
        {post.title}
      </h1>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
        <span>{formatDisplayDate(post.publishedAt)}</span>
        {post.tags.length > 0 ? <span>{post.tags.join(" - ")}</span> : null}
      </div>
      <p className="mt-8 text-lg leading-8 text-muted">{post.excerpt}</p>
      <div className="surface-panel mt-12 rounded-[2rem] px-6 py-8 md:px-10 md:py-12">
        <Markdown content={post.bodyMarkdown} />
      </div>
    </article>
  );
}
