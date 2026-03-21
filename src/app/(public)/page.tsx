import Link from "next/link";

import { ContentCard } from "@/components/site/content-card";
import { Markdown } from "@/components/site/markdown";
import { SectionHeading } from "@/components/ui/section-heading";
import { getHomePageData } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";

export async function generateMetadata() {
  return buildSiteMetadata({
    title: "Home",
    description:
      "A technical identity platform documenting learning, projects, academic growth, and long-term direction in AI, ML, LLM, and MLOps.",
    path: "/",
  });
}

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
  const signalMetrics = [
    {
      label: "Featured notes",
      value: String(featuredPosts.length).padStart(2, "0"),
      description: "Published writing nodes",
    },
    {
      label: "Research items",
      value: String(featuredAcademic.length).padStart(2, "0"),
      description: "Academic and experiment records",
    },
    {
      label: "Curated tools",
      value: String(featuredRecommendations.length).padStart(2, "0"),
      description: "Resources worth keeping",
    },
  ];
  const focusTags = [
    "LLM systems",
    "MLOps discipline",
    "Model evaluation",
    "Research practice",
  ];
  const capabilitySignals = [
    {
      label: "Primary track",
      value: "AI engineering and ML systems",
    },
    {
      label: "Working style",
      value: "Research-led and documentation-first",
    },
    {
      label: "Output signal",
      value: "Visible progress over polished claims",
    },
  ];
  const activeVectors = [
    { label: "LLMs and orchestration", width: "82%" },
    { label: "MLOps workflow", width: "74%" },
    { label: "Applied ML", width: "68%" },
    { label: "Research literacy", width: "79%" },
  ];
  const focusColumns = [
    "Learning loops that end in working systems, not just notes.",
    "Documentation that makes experiments, failures, and growth legible.",
    "A platform that proves seriousness through consistency over time.",
  ];
  const collaborationTracks = [
    "Research discussion",
    "Project collaboration",
    "MLOps systems",
    "Learning network",
  ];

  return (
    <div className="pb-20">
      <section className="grid-backdrop border-b border-white/40">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="relative">
            <span className="signal-pill">AI engineering platform</span>
            <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.95] font-semibold tracking-[-0.06em] text-balance md:text-7xl">
              {heroSection?.heading ?? siteSettings.siteTagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              {heroSection?.subheading ?? siteSettings.siteDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {focusTags.map((tag) => (
                <span key={tag} className="signal-pill">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/blogs"
                className="inline-flex items-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white shadow-[0_20px_45px_rgba(7,19,31,0.16)] transition hover:bg-surface-dark/92"
              >
                Read the journey
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-border-strong bg-white/55 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/80"
              >
                Connect
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {signalMetrics.map((metric) => (
                <div key={metric.label} className="surface-panel rounded-[1.5rem] p-4">
                  <p className="font-mono text-[0.66rem] uppercase tracking-[0.26em] text-muted">
                    {metric.label}
                  </p>
                  <p className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em]">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="dark-panel rounded-[2rem] p-6 text-white md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                  Research system map
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-balance">
                  Why this platform exists
                </h2>
              </div>
              <div className="rounded-full border border-white/12 bg-white/6 px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-cyan-100/80">
                Live notebook
              </div>
            </div>
            <Markdown
              className="mt-5 [&_blockquote]:text-slate-300 [&_li]:text-slate-200 [&_p]:text-slate-200"
              content={
                heroSection?.bodyMarkdown ??
                "This is a long-horizon platform for technical credibility, public thinking, and visible growth."
              }
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {capabilitySignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                >
                  <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cyan-200/90">
                    {signal.label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{signal.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-cyan-200">
                  Active vectors
                </p>
                <span className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
                  Current emphasis
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {activeVectors.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                      <span>{item.label}</span>
                      <span>{item.width}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-cyan-300 to-blue-400"
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="surface-panel rounded-[2rem] p-6 md:p-8">
            <p className="signal-label">Current vectors</p>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em] text-balance md:text-[2.4rem]">
              What the work is optimizing for right now
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              A serious AI platform is part notebook, part research ledger, and part
              systems portfolio. These are the pillars shaping that direction.
            </p>
            <div className="mt-8 grid gap-4">
              {focusColumns.map((column, index) => (
                <div
                  key={column}
                  className="rounded-[1.4rem] border border-border bg-white/60 px-5 py-4"
                >
                  <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-accent-strong">
                    Vector {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">{column}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-6 md:p-8">
            <SectionHeading
              eyebrow="Current focus"
              title={focusSection?.heading ?? "Current focus areas"}
              description={focusSection?.subheading}
            />
            <Markdown
              className="mt-8"
              content={
                focusSection?.bodyMarkdown ??
                "The current phase is about building durable foundations in AI, ML, LLM tooling, and deployment discipline."
              }
            />
          </div>
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
          <div className="surface-panel rounded-[2rem] p-6 md:p-8">
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

          <div className="surface-panel rounded-[2rem] p-6 md:p-8">
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
        <div className="dark-panel rounded-[2.25rem] p-8 text-white md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">
                Connect
              </p>
              <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.05em] text-balance md:text-5xl">
                If you care about AI, ML, systems, or serious learning, let us talk.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                I am building this platform as a public record of growth. If there is a
                research idea, project, or conversation worth having, reach out.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-50"
                >
                  Open contact page
                </Link>
                <a
                  href={`mailto:${siteSettings.contactEmail}`}
                  className="inline-flex items-center rounded-full border border-white/18 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/8"
                >
                  Email directly
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {collaborationTracks.map((track, index) => (
                <div
                  key={track}
                  className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5"
                >
                  <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cyan-200/90">
                    Track {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-4 text-lg font-medium text-white">{track}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Open to useful, thoughtful conversations where technical depth and
                    long-term intent actually matter.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
