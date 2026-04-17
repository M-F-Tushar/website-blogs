import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Compass,
  Layers3,
  Sparkles,
  Users,
} from "lucide-react";

import { Markdown } from "@/components/site/markdown";
import { getRecommendationBySlug } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";

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

  const offerSummary =
    item.summary ??
    "A focused recommendation selected for how clearly it helps someone make progress.";
  const whyItMatters =
    item.whyRecommend ??
    "This stands out because it turns good intentions into a more useful learning or working loop.";
  const useCase =
    item.useCase ??
    "Use it when you want something dependable enough to actually change how you learn or work.";
  const audience =
    item.audience ?? "Anyone looking for a practical next step rather than more random content.";
  const categoryLabel = item.category ?? "Recommendation";
  const levelLabel = item.level.replace(/^\w/, (char) => char.toUpperCase());
  const benefitPoints = [
    {
      icon: Sparkles,
      label: "What it offers",
      value: offerSummary,
    },
    {
      icon: Users,
      label: "Who gets the most from it",
      value: audience,
    },
    {
      icon: Layers3,
      label: "How it helps in practice",
      value: useCase,
    },
  ];

  return (
    <article className="relative">
      <div className="mx-auto max-w-[96rem] px-6 pb-20 pt-12 md:pb-28 md:pt-16 xl:px-10 2xl:px-14">
        <section className="mx-auto max-w-[86rem]">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:items-center">
            <div className="max-w-4xl">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-sky-300">
                {categoryLabel}
              </p>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-balance text-white md:text-7xl">
                {item.title}
              </h1>
              <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300 md:text-[1.42rem]">
                {offerSummary}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200">
                  {levelLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200">
                  {categoryLabel}
                </span>
                {item.audience ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200">
                    For {item.audience}
                  </span>
                ) : null}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                {item.externalUrl ? (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-sky-100"
                  >
                    Open resource
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : null}
                <a
                  href="#recommendation-details"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white"
                >
                  See the details
                </a>
              </div>
            </div>

            <div className="relative">
              {item.coverUrl ? (
                <div className="relative overflow-hidden rounded-[2.4rem] border border-white/8">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={item.coverUrl}
                      alt={item.coverAlt ?? item.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 38vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04),rgba(2,6,23,0.15)_38%,rgba(2,6,23,0.82))]" />
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-200/80">
                        Why this is worth your time
                      </p>
                      <p className="mt-3 max-w-md text-base leading-7 text-slate-100/92">
                        {whyItMatters}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[2.4rem] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))] p-7 md:p-8">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-200/80">
                    Recommended because
                  </p>
                  <p className="mt-5 font-display text-[2rem] leading-tight tracking-[-0.04em] text-white md:text-[2.5rem]">
                    {item.title}
                  </p>
                  <p className="mt-6 text-base leading-8 text-slate-300">{whyItMatters}</p>
                  <div className="mt-10 border-t border-white/10 pt-6">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-slate-500">
                      Best use
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-200">{useCase}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          id="recommendation-details"
          className="mx-auto mt-16 max-w-[86rem] border-t border-white/8 pt-10 md:pt-12"
        >
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            {benefitPoints.map(({ icon: Icon, label, value }) => (
              <div key={label} className="border-l border-white/10 pl-5">
                <div className="flex items-center gap-3 text-sky-300">
                  <Icon className="h-4 w-4" />
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em]">
                    {label}
                  </p>
                </div>
                <p className="mt-4 text-base leading-8 text-slate-300">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-[86rem] grid gap-12 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <div className="max-w-3xl">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.3em] text-sky-200/72">
                Closer look
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] text-white md:text-5xl">
                What this recommendation gives you when you actually use it
              </h2>
            </div>

            <div className="recommendation-markdown mt-10 max-w-4xl border-t border-white/8 pt-8 md:pt-10">
              <Markdown content={item.bodyMarkdown} />
            </div>
          </div>

          <aside className="xl:block">
            <div className="sticky top-28 space-y-8">
              <div className="border-l border-white/10 pl-5">
                <div className="flex items-center gap-3 text-sky-300">
                  <Compass className="h-4 w-4" />
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em]">
                    Quick fit
                  </p>
                </div>
                <dl className="mt-5 space-y-5 text-sm text-slate-300">
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                      Level
                    </dt>
                    <dd className="mt-1 text-base text-slate-100">{levelLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                      Best for
                    </dt>
                    <dd className="mt-1 leading-7">{audience}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                      Value signal
                    </dt>
                    <dd className="mt-1 leading-7">{whyItMatters}</dd>
                  </div>
                </dl>
              </div>

              {item.externalUrl ? (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.03]"
                >
                  Go to the resource
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </article>
  );
}
