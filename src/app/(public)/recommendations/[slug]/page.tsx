import { notFound } from "next/navigation";

import { Markdown } from "@/components/site/markdown";
import { getRecommendationBySlug } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/content/seo";

interface RecommendationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RecommendationDetailPageProps) {
  const { slug } = await params;
  const item = await getRecommendationBySlug(slug);

  if (!item) {
    return buildMetadata({
      title: "Recommendation not found",
      description: "The requested recommendation could not be found.",
      path: `/recommendations/${slug}`,
    });
  }

  return buildMetadata({
    title: item.metaTitle ?? item.title,
    description: item.metaDescription ?? item.summary ?? item.title,
    path: `/recommendations/${item.slug}`,
    image: item.coverUrl,
  });
}

export default async function RecommendationDetailPage({
  params,
}: RecommendationDetailPageProps) {
  const { slug } = await params;
  const item = await getRecommendationBySlug(slug);

  if (!item) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
        {item.category ?? "Recommendation"}
      </p>
      <h1 className="mt-6 font-display text-4xl leading-tight font-semibold tracking-[-0.05em] text-balance md:text-6xl">
        {item.title}
      </h1>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
        <span>{item.level}</span>
        {item.audience ? <span>{item.audience}</span> : null}
      </div>
      <p className="mt-8 text-lg leading-8 text-muted">{item.summary}</p>
      <div className="surface-panel mt-12 rounded-[2rem] px-6 py-8 md:px-10 md:py-12">
        <Markdown content={item.bodyMarkdown} />
      </div>

      <div className="surface-panel mt-8 rounded-[1.5rem] p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-accent">
              Why I recommend it
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">{item.whyRecommend}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-accent">
              Best for
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">{item.audience}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-accent">
              My use case
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">{item.useCase}</p>
          </div>
        </div>
        {item.externalUrl ? (
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/92"
          >
            Open resource
          </a>
        ) : null}
      </div>
    </article>
  );
}
