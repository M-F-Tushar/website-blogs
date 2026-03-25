import { notFound } from "next/navigation";

import { LongformArticleLayout } from "@/components/site/longform-layout";
import { getRecommendationBySlug } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";
import { extractMarkdownHeadings } from "@/lib/markdown-outline";
import { estimateReadingTime } from "@/lib/utils";

interface RecommendationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RecommendationDetailPageProps) {
  const { slug } = await params;
  const item = await getRecommendationBySlug(slug);

  if (!item) {
    return buildSiteMetadata({
      title: "Recommendation not found",
      description: "The requested recommendation could not be found.",
      path: `/recommendations/${slug}`,
    });
  }

  return buildSiteMetadata({
    title: item.metaTitle ?? item.title,
    description: item.metaDescription ?? item.summary ?? item.title,
    path: `/recommendations/${item.slug}`,
    image: item.coverUrl,
    canonicalUrl: item.canonicalUrl,
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

  const headings = extractMarkdownHeadings(item.bodyMarkdown);
  const readingTime = estimateReadingTime(item.bodyMarkdown);

  return (
    <LongformArticleLayout
      taxonomy={[item.category ?? "Recommendation"]}
      title={item.title}
      summary={item.summary}
      heroMeta={
        <>
          <span className="signal-pill">{item.level}</span>
          {item.audience ? <span className="signal-pill">{item.audience}</span> : null}
          <span className="signal-pill">{readingTime}</span>
        </>
      }
      coverUrl={item.coverUrl}
      coverAlt={item.coverAlt}
      bodyMarkdown={item.bodyMarkdown}
      headings={headings}
      railSummary="A stronger reading setup for recommendations: scan the argument, inspect the fit, then jump straight to the source if it earns your time."
      railContent={
        <div className="space-y-4">
          <div className="surface-panel rounded-[1.8rem] p-5">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-300">
              Recommendation fit
            </p>
            <div className="mt-4 grid gap-3">
              <div className="reading-info-card">
                <span className="reading-info-label">Level</span>
                <span className="reading-info-value">{item.level}</span>
              </div>
              {item.audience ? (
                <div className="reading-info-card">
                  <span className="reading-info-label">Best for</span>
                  <span className="reading-info-value">{item.audience}</span>
                </div>
              ) : null}
              {item.useCase ? (
                <div className="reading-info-card">
                  <span className="reading-info-label">Use case</span>
                  <span className="reading-info-value">{item.useCase}</span>
                </div>
              ) : null}
              {item.whyRecommend ? (
                <div className="reading-info-card">
                  <span className="reading-info-label">Why it earns a place</span>
                  <span className="reading-info-value">{item.whyRecommend}</span>
                </div>
              ) : null}
            </div>
          </div>
          {item.externalUrl ? (
            <div className="surface-panel rounded-[1.8rem] p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-300">
                Source link
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Open the original resource once the summary and fit match what you need.
              </p>
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-sky-100"
              >
                Open resource
              </a>
            </div>
          ) : null}
        </div>
      }
    />
  );
}
