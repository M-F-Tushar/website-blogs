import { ContentCard } from "@/components/site/content-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedPosts } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";

export async function generateMetadata() {
  return buildSiteMetadata({
    title: "Blogs",
    description:
      "Writing across AI/ML, LLMs, MLOps, project logs, paper notes, and the career journey behind them.",
    path: "/blogs",
  });
}

export default async function BlogsPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="grid-backdrop overflow-hidden rounded-[2.15rem] border border-white/45">
        <div className="grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionHeading
            eyebrow="Blogs"
            title="Technical notes, project logs, paper reflections, and visible learning"
            description="Writing is part of the work. These posts track progress, sharpen understanding, and make the journey legible."
          />
          <div className="surface-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="signal-label">Writing system</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-border bg-white/60 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-muted">
                  Published nodes
                </p>
                <p className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em]">
                  {String(posts.length).padStart(2, "0")}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-border bg-white/60 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-muted">
                  Scope
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  AI, ML, LLM workflows, and the systems thinking behind them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
        <div className="surface-panel mt-10 rounded-[1.75rem] p-8 text-sm text-muted">
          No published blog posts yet. Add your first post from the admin panel.
        </div>
      ) : null}
    </div>
  );
}
