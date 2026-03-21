import Link from "next/link";

import { ContentCard } from "@/components/site/content-card";
import { Markdown } from "@/components/site/markdown";
import { SectionHeading } from "@/components/ui/section-heading";
import { getHomePageData } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/content/seo";

export const metadata = buildMetadata({
  title: "Home",
  description:
    "A technical identity platform documenting learning, projects, academic growth, and long-term direction in AI, ML, LLM, and MLOps.",
  path: "/",
});

export default async function HomePage() {
  const {
    siteSettings,
    sections,
    featuredPosts,
    featuredAcademic,
    featuredRecommendations,
    recentPosts,
  } = await getHomePageData();

  const heroSection = sections.find((section) => section.sectionKey === "hero");
  const focusSection = sections.find(
    (section) => section.sectionKey === "current-focus",
  );

  return (
    <div className="pb-16">
      <section className="grid-backdrop border-b border-white/30">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-accent">
              Student builder to research-growth companion
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.95] font-semibold tracking-[-0.06em] text-balance md:text-7xl">
              {heroSection?.heading ?? siteSettings.siteTagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              {heroSection?.subheading ?? siteSettings.siteDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/blogs"
                className="inline-flex items-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/92"
              >
                Read the journey
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/50"
              >
                Connect
              </Link>
            </div>
          </div>

          <div className="dark-panel rounded-[2rem] p-6 text-white md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
              Current platform thesis
            </p>
            <Markdown
              className="mt-5 [&_blockquote]:text-slate-300 [&_li]:text-slate-200 [&_p]:text-slate-200"
              content={
                heroSection?.bodyMarkdown ??
                "This is a long-horizon platform for technical credibility, public thinking, and visible growth."
              }
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-200">
                  What I am learning
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  AI/ML foundations, LLM workflows, evaluation habits, and deployment discipline.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-200">
                  What this proves
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Serious learning, technical depth, research ambition, and builder mindset over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <SectionHeading
          eyebrow="Current focus"
          title={focusSection?.heading ?? "Current focus areas"}
          description={focusSection?.subheading}
        />
        <div className="surface-panel mt-10 rounded-[2rem] p-6 md:p-8">
          <Markdown content={focusSection?.bodyMarkdown ?? ""} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <SectionHeading
          eyebrow="Featured writing"
          title="Recent writing that reflects how the work is evolving"
          description="A mix of learning notes, project thinking, and system-building reflections."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {featuredPosts.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blogs/${post.slug}`}
              eyebrow="Blog"
              title={post.title}
              description={post.excerpt}
              date={post.publishedAt}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Academic and research"
              title="Research notes, experiments, and academic continuity"
              description="A space for paper-reading, coursework reflections, research interests, and later thesis work."
            />
            <div className="mt-8 grid gap-5">
              {featuredAcademic.map((entry) => (
                <ContentCard
                  key={entry.id}
                  href={`/academic/${entry.slug}`}
                  eyebrow={entry.entryType.replace(/_/g, " ")}
                  title={entry.title}
                  description={entry.summary}
                  date={entry.completedAt ?? entry.startedAt}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Recommendations"
              title="Resources worth recommending because they genuinely help"
              description="Tools, books, and learning assets that support real progress instead of hype."
            />
            <div className="mt-8 grid gap-5">
              {featuredRecommendations.map((item) => (
                <ContentCard
                  key={item.id}
                  href={`/recommendations/${item.slug}`}
                  eyebrow={item.category ?? "Recommendation"}
                  title={item.title}
                  description={item.summary}
                  meta={item.level}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <SectionHeading
          eyebrow="Recent updates"
          title="Fresh notes and visible progress"
          description="The platform should feel alive, not static. These entries show recent movement."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {recentPosts.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blogs/${post.slug}`}
              eyebrow={post.categories[0] ?? "Update"}
              title={post.title}
              description={post.excerpt}
              date={post.publishedAt}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <div className="surface-panel rounded-[2rem] p-8 md:p-12">
          <SectionHeading
            eyebrow="Connect"
            title="If you care about AI, ML, systems, or serious learning, let’s talk."
            description="I’m building this platform as a public record of growth. If there’s a research idea, project, or conversation worth having, reach out."
          />
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/92"
            >
              Open contact page
            </Link>
            <a
              href={`mailto:${siteSettings.contactEmail}`}
              className="inline-flex items-center rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/50"
            >
              Email directly
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
