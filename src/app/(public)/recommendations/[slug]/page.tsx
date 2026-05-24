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
        <section className="mx-auto max-w-[86rem]">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:items-center">
            <div className="max-w-4xl">
              <p className="detail-eyebrow">{categoryLabel}</p>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-balance text-white md:text-6xl xl:text-7xl">
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
                    className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(14,165,233,0.22)] transition hover:border-sky-200/40 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {openLinkLabel}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </a>
                ) : null}
                <a
                  href="#recommendation-details"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {detailsAnchorLabel}
                </a>
              </div>
            </div>

            <div className="relative">
              {item.coverUrl ? (
                <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
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
                      <p className="detail-eyebrow text-sky-200/80">
                        {posterCaptionLabel}
                      </p>
                      <p className="mt-3 max-w-md text-base leading-7 text-slate-100/92">
                        {whyItMatters}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[2.4rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))] p-7 md:p-8">
                  <p className="detail-eyebrow text-sky-200/80">
                    {posterCaptionLabel}
                  </p>
                  <p className="mt-5 font-display text-[2rem] leading-tight tracking-[-0.04em] text-white md:text-[2.5rem]">
                    {item.title}
                  </p>
                  <p className="mt-6 text-base leading-8 text-slate-300">{whyItMatters}</p>
                  <div className="mt-10 border-t border-white/10 pt-6">
                    <p className="detail-eyebrow text-slate-500">Best use</p>
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
                  <Icon className="h-4 w-4" aria-hidden />
                  <p className="detail-eyebrow">{label}</p>
                </div>
                <p className="mt-4 text-base leading-8 text-slate-300">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-[86rem] grid gap-12 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <div className="max-w-3xl">
              <p className="detail-eyebrow text-sky-200/72">{detailsSectionEyebrow}</p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] text-white md:text-5xl">
                {detailsSectionHeading}
              </h2>
            </div>

            <div className="recommendation-markdown mt-10 max-w-4xl border-t border-white/8 pt-8 md:pt-10">
              <Markdown content={item.bodyMarkdown} />
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
              <div className="border-l border-white/10 pl-5">
                <div className="flex items-center gap-3 text-sky-300">
                  <Compass className="h-4 w-4" aria-hidden />
                  <p className="detail-eyebrow">{quickFitLabel}</p>
                </div>
                <dl className="mt-5 space-y-5 text-sm text-slate-300">
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                      {quickFitLevelLabel}
                    </dt>
                    <dd className="mt-1 text-base text-slate-100">{levelLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                      {quickFitAudienceLabel}
                    </dt>
                    <dd className="mt-1 leading-7">{audience}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                      {quickFitValueLabel}
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
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
