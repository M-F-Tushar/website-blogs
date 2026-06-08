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
import { RelatedContent } from "@/components/site/related-content";
import {
  getDetailTemplateSection,
  getPublishedRecommendations,
  getRecommendationBySlug,
} from "@/lib/content/queries";
import { getSectionSettingString } from "@/lib/content/section-settings";
import { buildSiteMetadata } from "@/lib/content/seo";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getPublishedRecommendations();
  return items.map((item) => ({ slug: item.slug }));
}

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
    ogType: "article",
  });
}

export default async function RecommendationDetailPage({
  params,
}: RecommendationDetailPageProps) {
  const { slug } = await params;
  const [item, template] = await Promise.all([
    getRecommendationBySlug(slug),
    getDetailTemplateSection("recommendations", "recommendation-detail"),
  ]);

  if (!item) {
    notFound();
  }

  const eyebrowFallback =
    getSectionSettingString(template, "eyebrowFallback") ?? "Recommendation";
  const offerFallback =
    getSectionSettingString(template, "offerFallback") ??
    "A focused recommendation selected for how clearly it helps someone make progress.";
  const whyFallback =
    getSectionSettingString(template, "whyFallback") ??
    "This stands out because it turns good intentions into a more useful learning or working loop.";
  const useCaseFallback =
    getSectionSettingString(template, "useCaseFallback") ??
    "Use it when you want something dependable enough to actually change how you learn or work.";
  const audienceFallback =
    getSectionSettingString(template, "audienceFallback") ??
    "Anyone looking for a practical next step rather than more random content.";
  const posterCaptionLabel =
    getSectionSettingString(template, "posterCaptionLabel") ??
    "Why this is worth your time";
  const openLinkLabel =
    getSectionSettingString(template, "openLinkLabel") ?? "Open resource";
  const detailsAnchorLabel =
    getSectionSettingString(template, "detailsAnchorLabel") ?? "See the details";
  const detailsSectionEyebrow =
    getSectionSettingString(template, "detailsSectionEyebrow") ?? "Closer look";
  const detailsSectionHeading =
    getSectionSettingString(template, "detailsSectionHeading") ??
    "What this recommendation gives you when you actually use it";
  const footerEyebrow =
    getSectionSettingString(template, "footerEyebrow") ?? "Keep curating";
  const footerHeading =
    getSectionSettingString(template, "footerHeading") ??
    "Compare this with the full resource shelf";
  const footerCtaLabel =
    getSectionSettingString(template, "footerCtaLabel") ?? "Back to resources";
  const footerCtaHref =
    getSectionSettingString(template, "footerCtaHref") ?? "/recommendations";
  const quickFitLabel =
    getSectionSettingString(template, "quickFitLabel") ?? "Quick fit";
  const quickFitLevelLabel =
    getSectionSettingString(template, "quickFitLevelLabel") ?? "Level";
  const quickFitAudienceLabel =
    getSectionSettingString(template, "quickFitAudienceLabel") ?? "Best for";
  const quickFitValueLabel =
    getSectionSettingString(template, "quickFitValueLabel") ?? "Value signal";
  const secondaryCtaLabel =
    getSectionSettingString(template, "secondaryCtaLabel") ?? "Go to the resource";

  const offerSummary = item.summary ?? offerFallback;
  const whyItMatters = item.whyRecommend ?? whyFallback;
  const useCase = item.useCase ?? useCaseFallback;
  const audience = item.audience ?? audienceFallback;
  const categoryLabel = item.category ?? eyebrowFallback;
  const levelLabel = item.level.replace(/^\w/, (char) => char.toUpperCase());
  const benefitPoints = [
    { icon: Sparkles, label: "What it offers", value: offerSummary },
    { icon: Users, label: "Who gets the most from it", value: audience },
    { icon: Layers3, label: "How it helps in practice", value: useCase },
  ];

  const recommendationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recommendation",
    name: item.title,
    description: item.summary ?? item.metaDescription ?? undefined,
    url: item.externalUrl ?? undefined,
    image: item.coverUrl ?? undefined,
    category: item.category ?? undefined,
  };

  return (
    <article className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recommendationJsonLd) }}
      />
      <div className="mx-auto max-w-[96rem] px-6 pb-20 pt-12 md:pb-28 md:pt-16 xl:px-10 2xl:px-14">
        <header className="mx-auto max-w-[86rem]">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:items-center">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[0.85rem] font-semibold uppercase tracking-widest text-emerald-200 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                {categoryLabel}
              </p>
              <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground dark:text-white md:text-6xl xl:text-7xl drop-shadow-sm">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                  {item.title}
                </span>
              </h1>
              <p className="mt-8 max-w-3xl text-[1.1rem] font-light leading-[1.8] text-muted dark:text-slate-300 md:text-[1.3rem]">
                {offerSummary}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 text-muted dark:text-slate-300 backdrop-blur-sm">
                  {levelLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 text-muted dark:text-slate-300 backdrop-blur-sm">
                  {categoryLabel}
                </span>
                {item.audience ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300 backdrop-blur-sm">
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
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-md transition-all hover:border-emerald-300/60 hover:bg-emerald-400/30 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(16,185,129,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {openLinkLabel}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </a>
                ) : null}
                <a
                  href="#recommendation-details"
                  className="inline-flex items-center gap-2 rounded-full border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] px-5 py-3 text-sm font-medium text-muted dark:text-slate-200 backdrop-blur-md transition-all hover:border-white/20 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:text-foreground dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  {detailsAnchorLabel}
                </a>
              </div>
            </div>

            <div className="relative">
              {item.coverUrl ? (
                <div className="group relative overflow-hidden rounded-[2.5rem] border border-border dark:border-white/10 shadow-[0_20px_60px_rgba(16,185,129,0.15)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(16,185,129,0.25)]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={item.coverUrl}
                      alt={item.coverAlt ?? item.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 38vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0.4)_40%,rgba(15,23,42,0.95))]" />
                    <div className="absolute inset-x-0 bottom-0 p-8 md:p-10 backdrop-blur-sm">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {posterCaptionLabel}
                      </p>
                      <p className="mt-4 max-w-md text-[1.05rem] leading-7 text-muted dark:text-slate-200">
                        {whyItMatters}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="group overflow-hidden rounded-[2.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-10 md:p-12 shadow-2xl backdrop-blur-xl transition-all hover:border-emerald-500/30 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative z-10">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {posterCaptionLabel}
                    </p>
                    <p className="mt-6 font-display text-[2.2rem] font-bold leading-tight tracking-[-0.04em] text-foreground dark:text-white md:text-[2.8rem]">
                      {item.title}
                    </p>
                    <p className="mt-6 text-[1.05rem] leading-8 text-muted dark:text-slate-300">{whyItMatters}</p>
                    <div className="mt-10 border-t border-border dark:border-white/10 pt-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-500">Best use</p>
                      <p className="mt-4 text-[1.05rem] leading-7 text-muted dark:text-slate-200">{useCase}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <section
          id="recommendation-details"
          className="mx-auto mt-16 max-w-[86rem] border-t border-border dark:border-white/10 pt-10 md:pt-14"
        >
          <div className="grid gap-8 lg:grid-cols-3">
            {benefitPoints.map(({ icon: Icon, label, value }) => (
              <div key={label} className="group relative overflow-hidden rounded-[1.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-8 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(16,185,129,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10 flex items-center gap-3 text-emerald-400">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <p className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-emerald-300">{label}</p>
                </div>
                <p className="relative z-10 mt-6 text-[1.05rem] leading-[1.8] text-muted dark:text-slate-300 group-hover:text-muted dark:text-slate-200 transition-colors">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-[86rem] grid gap-12 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {detailsSectionEyebrow}
              </p>
              <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.04em] text-foreground dark:text-white md:text-5xl">
                {detailsSectionHeading}
              </h2>
            </div>

            <div className="recommendation-markdown mt-10 max-w-4xl border-t border-border dark:border-white/10 pt-10 md:pt-14 [&_.markdown-body_p]:!text-muted dark:text-slate-300 [&_.markdown-body_li]:!text-muted dark:text-slate-300 [&_.markdown-body_h2]:!text-foreground dark:text-white [&_.markdown-body_h3]:!text-foreground dark:text-white [&_.markdown-body_strong]:!text-foreground dark:text-white">
              <Markdown className="markdown-inverse" content={item.bodyMarkdown} />
            </div>

            <RelatedContent
              eyebrow={footerEyebrow}
              heading={footerHeading}
              ctaLabel={footerCtaLabel}
              ctaHref={footerCtaHref}
            />
          </div>

          <aside className="xl:block">
            <div className="sticky top-28 space-y-8">
              <div className="rounded-[1.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-8 shadow-xl backdrop-blur-xl transition-colors hover:border-emerald-500/20 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.1)]">
                <div className="flex items-center gap-3 text-emerald-400">
                  <Compass className="h-5 w-5" aria-hidden />
                  <p className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.28em]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    {quickFitLabel}
                  </p>
                </div>
                <dl className="mt-8 space-y-8 text-sm text-muted dark:text-slate-300">
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-muted dark:text-slate-500">
                      {quickFitLevelLabel}
                    </dt>
                    <dd className="mt-2 text-base font-medium text-foreground dark:text-slate-100">{levelLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-muted dark:text-slate-500">
                      {quickFitAudienceLabel}
                    </dt>
                    <dd className="mt-2 leading-7 text-[0.95rem]">{audience}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-muted dark:text-slate-500">
                      {quickFitValueLabel}
                    </dt>
                    <dd className="mt-2 leading-7 text-[0.95rem]">{whyItMatters}</dd>
                  </div>
                </dl>
              </div>

              {item.externalUrl ? (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full justify-center items-center gap-2 rounded-[1rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] px-6 py-4 text-sm font-medium text-foreground dark:text-white backdrop-blur-md transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus-visible:outline-none"
                >
                  {secondaryCtaLabel}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </article>
  );
}
