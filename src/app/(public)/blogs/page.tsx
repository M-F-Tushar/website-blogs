import { ContentCard } from "@/components/site/content-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedPosts } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/content/seo";

export const metadata = buildMetadata({
  title: "Blogs",
  description:
    "Writing across AI/ML, LLMs, MLOps, project logs, paper notes, and the career journey behind them.",
  path: "/blogs",
});

export default async function BlogsPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <SectionHeading
        eyebrow="Blogs"
        title="Technical notes, project logs, paper reflections, and visible learning"
        description="Writing is part of the work. These posts track progress, sharpen understanding, and make the journey legible."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <ContentCard
            key={post.id}
            href={`/blogs/${post.slug}`}
            eyebrow={post.categories[0] ?? "Blog"}
            title={post.title}
            description={post.excerpt}
            date={post.publishedAt}
          />
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="surface-panel mt-10 rounded-[1.5rem] p-8 text-sm text-muted">
          No published blog posts yet. Add your first post from the admin panel.
        </div>
      ) : null}
    </div>
  );
}
