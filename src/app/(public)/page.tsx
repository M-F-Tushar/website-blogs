import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { ContentCard } from "@/components/site/content-card";
import { NewsletterSignup } from "@/components/site/newsletter-signup";
import { SectionHeading } from "@/components/ui/section-heading";
import { getHomePageData } from "@/lib/content/queries";
import {
  getSectionSettingString,
  getSectionSettingStringArray,
} from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";
import { cn, estimateReadingTime, stripMarkdown } from "@/lib/utils";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("home", {
    title: "Home",
    description:
      "A technical identity platform documenting learning, projects, academic growth, and long-term direction in AI, ML, LLM, and MLOps.",
  });
}

function getDisplayName(siteName: string, explicitName: string | null) {
  if (explicitName) {
    return explicitName;
  }

  return siteName.replace(/'?s\s+blog/i, "").trim() || siteName;
}

function getTrendingTopics(
  recentPosts: Awaited<ReturnType<typeof getHomePageData>>["recentPosts"],
  fallbackTopics: string[],
) {
  const derivedTopics = Array.from(
    new Set(
      recentPosts.flatMap((post) => [...post.tags, ...post.categories]).filter(Boolean),
    ),
  ).slice(0, 6);

  return derivedTopics.length > 0 ? derivedTopics : fallbackTopics.slice(0, 6);
}

export async function HomePageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getHomePageData>>;
} = {}) {
  const resolvedData = data ?? (await getHomePageData());
  const { siteSettings, sections, featuredPosts, recentPosts } = resolvedData;

  const heroSection = sections.find((section) => section.sectionKey === "hero");
  const writingSection = sections.find(
    (section) => section.sectionKey === "featured-writing",
  );
  const recentSection = sections.find(
    (section) => section.sectionKey === "recent-updates",
  );
  const connectSection = sections.find((section) => section.sectionKey === "connect");

  const displayName = getDisplayName(
    siteSettings.siteName,
    getSectionSettingString(heroSection, "displayName"),
  );
  const heroLead = getSectionSettingString(heroSection, "titleLead") ?? "Hi, I'm";
  const heroBadge =
    getSectionSettingString(heroSection, "welcomeLabel") ?? "Welcome to my blog";
  const primaryCtaLabel =
    getSectionSettingString(heroSection, "primaryCtaLabel") ?? "Start Reading";
  const primaryCtaHref =
    getSectionSettingString(heroSection, "primaryCtaHref") ?? "/blogs";
  const secondaryCtaLabel =
    getSectionSettingString(heroSection, "secondaryCtaLabel") ?? "More About Me";
  const secondaryCtaHref =
    getSectionSettingString(heroSection, "secondaryCtaHref") ?? "/about";
  const heroDescription =
    heroSection?.subheading ??
    siteSettings.siteTagline ??
    "AI & ML Enthusiast • Aspiring AI Agent Developer • LLM Explorer • Lifelong Learner";
  const featuredStory = featuredPosts[0] ?? recentPosts[0] ?? null;
  const latestPosts = recentPosts
    .filter((post) => post.id !== featuredStory?.id)
    .slice(0, 3);
  const focusTags =
    getSectionSettingStringArray(heroSection, "focusTags").length > 0
      ? getSectionSettingStringArray(heroSection, "focusTags")
      : ["AI", "Artificial Intelligence", "Machine Learning", "Tech Careers"];
  const trendingTopics = getTrendingTopics(recentPosts, focusTags);
  const subscribeHeading =
    connectSection?.heading ?? "Stay Updated";
  const subscribeDescription =
    connectSection?.subheading ??
    stripMarkdown(
      connectSection?.bodyMarkdown ?? "Subscribe to get notified about new posts.",
    );

  return (
    <div className="pb-20">
      <section className="mx-auto flex min-h-[70svh] max-w-6xl flex-col items-center justify-center px-6 py-14 text-center md:min-h-[76svh] md:py-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
          <span className="text-sky-400">✦</span>
          {heroBadge}
        </p>
        <h1 className="mt-8 max-w-5xl font-display text-[4rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.8rem] xl:text-[6.6rem]">
          {heroLead} <span className="accent-gradient-text">{displayName}</span>
        </h1>
        <p className="mt-6 max-w-3xl text-[1.08rem] leading-8 text-slate-300 md:text-[1.2rem]">
          {heroDescription}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={primaryCtaHref}
            className="rounded-full bg-sky-500 px-8 py-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(14,165,233,0.3)] transition hover:bg-sky-400"
          >
            {primaryCtaLabel}
          </Link>
          <Link
            href={secondaryCtaHref}
            className="rounded-full border border-white/10 bg-white/4 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/8"
          >
            {secondaryCtaLabel}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <SectionHeading
          eyebrow={writingSection?.heading ?? "Featured Story"}
          title={featuredStory?.title ?? "Featured story will appear here"}
          description={
            featuredStory?.excerpt ??
            writingSection?.subheading ??
            "Publish a featured post to anchor the homepage with a lead story."
          }
        />
        {featuredStory ? (
          <div className="mt-7">
            <ContentCard
              href={`/blogs/${featuredStory.slug}`}
              eyebrow={featuredStory.categories[0] ?? "Featured"}
              title={featuredStory.title}
              description={featuredStory.excerpt}
              date={featuredStory.publishedAt}
              meta={estimateReadingTime(featuredStory.bodyMarkdown)}
              imageUrl={featuredStory.coverUrl}
              imageAlt={featuredStory.coverAlt}
              size="feature"
              actionLabel="Read Article"
              tags={featuredStory.tags}
            />
          </div>
        ) : (
          <div className="detail-card mt-8">
            <p className="signal-label">Featured Story</p>
            <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
              Publish a featured post to complete the hero-to-story flow
            </h3>
            <p className="mt-4 text-[0.98rem] leading-8 text-slate-400">
              The homepage is ready. It just needs one standout published article to take the spotlight.
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <SectionHeading
          eyebrow="Trending Topics"
          title="The ideas running through the site right now"
          description="Topics are derived from your published writing, so the homepage stays honest as the archive changes."
        />
        <div className="mt-6 flex flex-wrap gap-3">
          {trendingTopics.map((topic) => (
            <span key={topic} className="signal-pill">
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow={recentSection?.heading ?? "Latest Articles"}
            title={recentSection?.subheading ?? "Fresh writing from the archive"}
            description={
              stripMarkdown(
                recentSection?.bodyMarkdown ??
                  "Recent posts stay visible here so the homepage always feels active.",
              ) || undefined
            }
          />
          <Link href="/blogs" className="hidden text-sm text-sky-300 transition hover:text-white md:inline-flex">
            View all →
          </Link>
        </div>

        <div
          className={cn(
            "mt-8 grid gap-6",
            latestPosts.length < 3 ? "mx-auto max-w-5xl md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {latestPosts.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blogs/${post.slug}`}
              eyebrow={post.categories[0] ?? "Article"}
              title={post.title}
              description={post.excerpt}
              date={post.publishedAt}
              meta={estimateReadingTime(post.bodyMarkdown)}
              imageUrl={post.coverUrl}
              imageAlt={post.coverAlt}
              tags={post.tags}
              actionLabel="Read Article"
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="dark-panel rounded-[2rem] px-6 py-9 text-center md:px-10 md:py-12">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <span className="text-sky-400">✦</span>
            Newsletter
          </p>
          <h2 className="mt-7 font-display text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white md:text-[4rem]">
            {subscribeHeading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-300">
            {subscribeDescription}
          </p>
          <NewsletterSignup className="mx-auto mt-7 max-w-xl" />
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
