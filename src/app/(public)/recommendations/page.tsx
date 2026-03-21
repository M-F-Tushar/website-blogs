import { ContentCard } from "@/components/site/content-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedRecommendations } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";

export async function generateMetadata() {
  return buildSiteMetadata({
    title: "Recommendations",
    description:
      "Books, tools, courses, websites, and communities that support serious technical growth.",
    path: "/recommendations",
  });
}

export default async function RecommendationsPage() {
  const recommendations = await getPublishedRecommendations();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="grid-backdrop overflow-hidden rounded-[2.15rem] border border-white/45">
        <div className="grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionHeading
            eyebrow="Recommendations"
            title="Resources I'd recommend because they support real progress"
            description="Books, tools, and learning assets filtered through actual use, not generic listicle energy."
          />
          <div className="surface-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="signal-label">Curated stack</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-border bg-white/60 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-muted">
                  Saved resources
                </p>
                <p className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em]">
                  {String(recommendations.length).padStart(2, "0")}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-border bg-white/60 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-muted">
                  Filter
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Useful books, tools, and references that actually hold up in practice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((recommendation) => (
          <ContentCard
            key={recommendation.id}
            href={`/recommendations/${recommendation.slug}`}
            eyebrow={recommendation.category ?? "Recommendation"}
            title={recommendation.title}
            description={recommendation.summary}
            meta={recommendation.level}
          />
        ))}
      </div>
    </div>
  );
}
