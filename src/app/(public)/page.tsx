import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { ContentCard } from "@/components/site/content-card";
import { Markdown } from "@/components/site/markdown";
import { SectionHeading } from "@/components/ui/section-heading";
import { getHomePageData } from "@/lib/content/queries";
import {
  getSectionPanelItems,
  getSectionSettingString,
  getSectionSettingStringArray,
  getSectionVectorItems,
} from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("home", {
    title: "Home",
    description:
      "A technical identity platform documenting learning, projects, academic growth, and long-term direction in AI, ML, LLM, and MLOps.",
  });
}

export async function HomePageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getHomePageData>>;
} = {}) {
  const resolvedData = data ?? (await getHomePageData());
  const {
    siteSettings,
    sections,
    featuredPosts,
    featuredAcademic,
    featuredRecommendations,
    recentPosts,
  } = resolvedData;

  const heroSection = sections.find((section) => section.sectionKey === "hero");
  const focusSection = sections.find(
    (section) => section.sectionKey === "current-focus",
  );
  const writingSection = sections.find(
    (section) => section.sectionKey === "featured-writing",
  );
  const academicSection = sections.find(
    (section) => section.sectionKey === "academic-preview",
  );
  const recommendationsSection = sections.find(
    (section) => section.sectionKey === "recommendations-preview",
  );
  const recentSection = sections.find(
    (section) => section.sectionKey === "recent-updates",
  );
  const connectSection = sections.find((section) => section.sectionKey === "connect");
  const focusTags =
    getSectionSettingStringArray(heroSection, "focusTags").length > 0
      ? getSectionSettingStringArray(heroSection, "focusTags")
      : ["LLM systems", "MLOps discipline", "Model evaluation", "Research practice"];
  const capabilitySignals = getSectionPanelItems(heroSection, "capabilitySignals", [
    {
      label: "Primary track",
      value: "AI engineering and ML systems",
      description: null,
    },
    {
      label: "Working style",
      value: "Research-led and documentation-first",
      description: null,
    },
    {
      label: "Output signal",
      value: "Visible progress over polished claims",
      description: null,
    },
  ]);
  const activeVectors = getSectionVectorItems(heroSection, "activeVectors", [
    { label: "LLMs and orchestration", value: "82%" },
    { label: "MLOps workflow", value: "74%" },
    { label: "Applied ML", value: "68%" },
    { label: "Research literacy", value: "79%" },
  ]);
  const focusColumns =
    getSectionSettingStringArray(focusSection, "columns").length > 0
      ? getSectionSettingStringArray(focusSection, "columns")
      : [
          "Learning loops that end in working systems, not just notes.",
          "Documentation that makes experiments, failures, and growth legible.",
          "A platform that proves seriousness through consistency over time.",
        ];
  const collaborationTracks =
    getSectionSettingStringArray(connectSection, "tracks").length > 0
      ? getSectionSettingStringArray(connectSection, "tracks")
      : [
          "Research discussion",
          "Project collaboration",
          "MLOps systems",
          "Learning network",
        ];
  const primaryCtaLabel =
    getSectionSettingString(heroSection, "primaryCtaLabel") ?? "Read the journey";
  const primaryCtaHref =
    getSectionSettingString(heroSection, "primaryCtaHref") ?? "/blogs";
  const secondaryCtaLabel =
    getSectionSettingString(heroSection, "secondaryCtaLabel") ?? "Connect";
  const secondaryCtaHref =
    getSectionSettingString(heroSection, "secondaryCtaHref") ?? "/contact";
  const heroEyebrow =
    getSectionSettingString(heroSection, "eyebrow") ?? "AI engineering platform";
  const systemMapEyebrow =
    getSectionSettingString(heroSection, "systemMapEyebrow") ?? "Research system map";
  const systemMapTitle =
    getSectionSettingString(heroSection, "systemMapTitle") ?? "Why this platform exists";
  const systemMapBadge =
    getSectionSettingString(heroSection, "systemMapBadge") ?? "Live notebook";
  const vectorLabel =
    getSectionSettingString(heroSection, "vectorLabel") ?? "Active vectors";
  const vectorBadge =
    getSectionSettingString(heroSection, "vectorBadge") ?? "Current emphasis";
  const focusEyebrow =
    getSectionSettingString(focusSection, "eyebrow") ?? "Current vectors";
  const focusPanelTitle =
    getSectionSettingString(focusSection, "panelTitle") ??
    "What the work is optimizing for right now";
  const focusPanelDescription =
    getSectionSettingString(focusSection, "panelDescription") ??
    "A serious AI platform is part notebook, part research ledger, and part systems portfolio. These are the pillars shaping that direction.";

  return (
    <div className="pb-20">
      <section className="grid-backdrop border-b border-white/40">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="relative">
            <span className="signal-pill">{heroEyebrow}</span>
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
                href={primaryCtaHref}
                className="inline-flex items-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white shadow-[0_20px_45px_rgba(7,19,31,0.16)] transition hover:bg-surface-dark/92"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center rounded-full border border-border-strong bg-white/55 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/80"
              >
                {secondaryCtaLabel}
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
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
              ].map((metric) => (
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
                  {systemMapEyebrow}
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-balance">
                  {systemMapTitle}
                </h2>
              </div>
              <div className="rounded-full border border-white/12 bg-white/6 px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-cyan-100/80">
                {systemMapBadge}
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
                  {signal.description ? (
                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      {signal.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-cyan-200">
                  {vectorLabel}
                </p>
                <span className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
                  {vectorBadge}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {activeVectors.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-cyan-300 to-blue-400"
                        style={{ width: item.value }}
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
            <p className="signal-label">{focusEyebrow}</p>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em] text-balance md:text-[2.4rem]">
              {focusPanelTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              {focusPanelDescription}
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
          eyebrow={
            getSectionSettingString(writingSection, "eyebrow") ?? "Featured writing"
          }
          title={
            writingSection?.heading ??
            "Recent writing that reflects how the work is evolving"
          }
          description={
            writingSection?.subheading ??
            "A mix of learning notes, project thinking, and system-building reflections."
          }
        />
        {writingSection?.bodyMarkdown ? (
          <Markdown className="mt-6" content={writingSection.bodyMarkdown} />
        ) : null}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {featuredPosts.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blogs/${post.slug}`}
              eyebrow="Blog"
              title={post.title}
              description={post.excerpt}
              date={post.publishedAt}
              imageUrl={post.coverUrl}
              imageAlt={post.coverAlt}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="surface-panel rounded-[2rem] p-6 md:p-8">
            <SectionHeading
              eyebrow={
                getSectionSettingString(academicSection, "eyebrow") ??
                "Academic and research"
              }
              title={
                academicSection?.heading ??
                "Research notes, experiments, and academic continuity"
              }
              description={
                academicSection?.subheading ??
                "A space for paper-reading, coursework reflections, research interests, and later thesis work."
              }
            />
            {academicSection?.bodyMarkdown ? (
              <Markdown className="mt-6" content={academicSection.bodyMarkdown} />
            ) : null}
            <div className="mt-8 grid gap-5">
              {featuredAcademic.map((entry) => (
                <ContentCard
                  key={entry.id}
                  href={`/academic/${entry.slug}`}
                  eyebrow={entry.entryType.replace(/_/g, " ")}
                  title={entry.title}
                  description={entry.summary}
                  date={entry.completedAt ?? entry.startedAt}
                  imageUrl={entry.coverUrl}
                  imageAlt={entry.coverAlt}
                />
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-6 md:p-8">
            <SectionHeading
              eyebrow={
                getSectionSettingString(recommendationsSection, "eyebrow") ??
                "Recommendations"
              }
              title={
                recommendationsSection?.heading ??
                "Resources worth recommending because they genuinely help"
              }
              description={
                recommendationsSection?.subheading ??
                "Tools, books, and learning assets that support real progress instead of hype."
              }
            />
            {recommendationsSection?.bodyMarkdown ? (
              <Markdown className="mt-6" content={recommendationsSection.bodyMarkdown} />
            ) : null}
            <div className="mt-8 grid gap-5">
              {featuredRecommendations.map((item) => (
                <ContentCard
                  key={item.id}
                  href={`/recommendations/${item.slug}`}
                  eyebrow={item.category ?? "Recommendation"}
                  title={item.title}
                  description={item.summary}
                  meta={item.level}
                  imageUrl={item.coverUrl}
                  imageAlt={item.coverAlt}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <SectionHeading
          eyebrow={
            getSectionSettingString(recentSection, "eyebrow") ?? "Recent updates"
          }
          title={recentSection?.heading ?? "Fresh notes and visible progress"}
          description={
            recentSection?.subheading ??
            "The platform should feel alive, not static. These entries show recent movement."
          }
        />
        {recentSection?.bodyMarkdown ? (
          <Markdown className="mt-6" content={recentSection.bodyMarkdown} />
        ) : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {recentPosts.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blogs/${post.slug}`}
              eyebrow={post.categories[0] ?? "Update"}
              title={post.title}
              description={post.excerpt}
              date={post.publishedAt}
              imageUrl={post.coverUrl}
              imageAlt={post.coverAlt}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:py-24">
        <div className="dark-panel rounded-[2.25rem] p-8 text-white md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">
                {getSectionSettingString(connectSection, "eyebrow") ?? "Connect"}
              </p>
              <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.05em] text-balance md:text-5xl">
                {connectSection?.heading ??
                  "If you care about AI, ML, systems, or serious learning, let us talk."}
              </h2>
              <Markdown
                className="mt-5 max-w-2xl [&_p]:text-lg [&_p]:leading-8 [&_p]:text-slate-300"
                content={
                  connectSection?.bodyMarkdown ??
                  "I am building this platform as a public record of growth. If there is a research idea, project, or conversation worth having, reach out."
                }
              />
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={
                    getSectionSettingString(connectSection, "primaryCtaHref") ??
                    "/contact"
                  }
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-50"
                >
                  {getSectionSettingString(connectSection, "primaryCtaLabel") ??
                    "Open contact page"}
                </Link>
                <a
                  href={
                    getSectionSettingString(connectSection, "secondaryCtaHref") ??
                    `mailto:${siteSettings.contactEmail}`
                  }
                  className="inline-flex items-center rounded-full border border-white/18 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/8"
                >
                  {getSectionSettingString(connectSection, "secondaryCtaLabel") ??
                    "Email directly"}
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

export default async function HomePage() {
  const data = await getHomePageData();

  if (!data.page) {
    notFound();
  }

  if (data.page.slug !== DEFAULT_TOP_LEVEL_PAGE_PATHS.home) {
    permanentRedirect(data.page.slug);
  }

  return <HomePageContent data={data} />;
}
