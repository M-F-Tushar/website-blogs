import { ContentCard } from "@/components/site/content-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedRecommendations } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/content/seo";

export const metadata = buildMetadata({
  title: "Recommendations",
  description:
    "Books, tools, courses, websites, and communities that support serious technical growth.",
  path: "/recommendations",
});

export default async function RecommendationsPage() {
  const recommendations = await getPublishedRecommendations();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <SectionHeading
        eyebrow="Recommendations"
        title="Resources I’d recommend because they support real progress"
        description="Books, tools, and learning assets filtered through actual use, not generic listicle energy."
      />

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
