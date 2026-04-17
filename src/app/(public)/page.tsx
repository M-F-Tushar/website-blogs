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
import {
  estimateReadingTime,
  formatDisplayDate,
  stripMarkdown,
} from "@/lib/utils";

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

interface HomeCollectionItem {
  href: string;
  title: string;
  meta: string;
  description?: string | null;
}

function HomeCollectionRail({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  hrefLabel: string;
  items: HomeCollectionItem[];
}) {
  return (
    <section className="detail-card h-full">
      <p className="signal-label">{eyebrow}</p>
      <h3 className="mt-4 font-display text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white">
        {title}
      </h3>
      <p className="mt-3 text-[0.96rem] leading-7 text-slate-400">{description}</p>
      <div className="mt-6 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-[1.2rem] border border-white/7 bg-white/[0.03] px-4 py-4 transition hover:border-sky-400/20 hover:bg-white/[0.05]"
            >
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
                {item.meta}
              </p>
              <h4 className="mt-2 font-display text-[1.3rem] leading-[1.12] tracking-[-0.03em] text-white">
                {item.title}
              </h4>
              {item.description ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              ) : null}
            </Link>
          ))
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm leading-6 text-slate-400">
            This collection is ready to surface here as soon as the next item is published.
          </div>
        )}
      </div>
      <div className="mt-6 border-t border-white/8 pt-4">
        <Link href={href} className="text-sm font-medium text-sky-300 transition hover:text-white">
          {hrefLabel} →
        </Link>
      </div>
    </section>
  );
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
    recentAcademic,
    recentRecommendations,
    recentPosts,
  } = resolvedData;

  const heroSection = sections.find((section) => section.sectionKey === "hero");
  const writingSection = sections.find(
    (section) => section.sectionKey === "featured-writing",
  );
  const recentSection = sections.find(
    (section) => section.sectionKey === "recent-updates",
  );
  const academicSection = sections.find(
    (section) => section.sectionKey === "academic-preview",
  );
  const recommendationsSection = sections.find(
    (section) => section.sectionKey === "recommendations-preview",
  );
  const connectSection = sections.find((section) => section.sectionKey === "connect");

  const displayName = getDisplayName(
    siteSettings.siteName,
    getSectionSettingString(heroSection, "displayName"),
  );
  const heroLead = getSectionSettingString(heroSection, "titleLead") ?? "Hi, I'm";
  const heroBadge =
    getSectionSettingString(heroSection, "welcomeLabel") ?? "Welcome to my blog";
  const writingEyebrow =
    getSectionSettingString(writingSection, "eyebrow") ?? "Featured writing";
  const recentEyebrow =
    getSectionSettingString(recentSection, "eyebrow") ?? "Recent updates";
  const connectEyebrow =
    getSectionSettingString(connectSection, "eyebrow") ?? "Stay connected";
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
      connectSection?.bodyMarkdown ??
        "Use the real contact and reading paths below while the newsletter remains offline.",
    );
  const recentBlogItems = recentPosts.slice(0, 2).map((post) => ({
    href: `/blogs/${post.slug}`,
    title: post.title,
    meta: `${post.categories[0] ?? "Blog"} • ${formatDisplayDate(post.publishedAt)}`,
    description: post.excerpt,
  }));
  const recentAcademicItems = recentAcademic.slice(0, 2).map((entry) => ({
    href: `/academic/${entry.slug}`,
    title: entry.title,
    meta: `${entry.entryType.replace(/_/g, " ")} • ${formatDisplayDate(entry.completedAt ?? entry.startedAt)}`,
    description: entry.summary,
  }));
  const recentRecommendationItems = recentRecommendations.slice(0, 2).map((item) => ({
    href: `/recommendations/${item.slug}`,
    title: item.title,
    meta: `${item.category ?? "Recommendation"} • ${item.level}`,
    description: item.summary,
  }));

  return (
    <div className="pb-16">
      <section className="mx-auto flex min-h-[44svh] max-w-5xl flex-col items-center justify-start px-6 pb-10 pt-14 text-center md:min-h-[48svh] md:pb-12 md:pt-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
          <span className="text-sky-400">✦</span>
          {heroBadge}
        </p>
        <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white md:text-7xl xl:text-[5.5rem]">
          {heroLead} <span className="accent-gradient-text">{displayName}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[1.08rem] leading-8 text-slate-300 md:text-xl">
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
        <div className="mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
          {focusTags.slice(0, 4).map((tag) => (
            <span key={tag} className="signal-pill px-3 py-1.5 text-[0.66rem]">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <SectionHeading
            eyebrow={writingEyebrow}
            title={writingSection?.heading ?? "Start with the clearest piece"}
            description={
              writingSection?.subheading ??
              (stripMarkdown(
                writingSection?.bodyMarkdown ??
                  "Publish a featured post to anchor the homepage with a lead story.",
              ) ||
                featuredStory?.excerpt ||
                undefined)
            }
          />
          {featuredStory ? (
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
          ) : (
            <div className="detail-card">
              <p className="signal-label">Featured Story</p>
              <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
                Publish a featured post to complete the hero-to-story flow
              </h3>
              <p className="mt-4 text-[0.98rem] leading-8 text-slate-400">
                The homepage is ready. It just needs one standout published article to take the spotlight.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <div className="max-w-3xl">
          <SectionHeading
            eyebrow="Across the site"
            title="Recent signals from writing, study, and curation"
            description="The homepage now reflects the full shape of the platform, not just the blog archive."
          />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <HomeCollectionRail
            eyebrow={writingEyebrow}
            title={writingSection?.heading ?? "Recent blogs"}
            description={
              writingSection?.subheading ??
              "Technical writing, project notes, and the strongest recent posts."
            }
            href="/blogs"
            hrefLabel="View all blog posts"
            items={recentBlogItems}
          />
          <HomeCollectionRail
            eyebrow={
              getSectionSettingString(academicSection, "eyebrow") ?? "Academic and research"
            }
            title={academicSection?.heading ?? "Recent academic notes"}
            description={
              academicSection?.subheading ??
              "Research notes, experiments, and coursework that show deeper study."
            }
            href="/academic"
            hrefLabel="Open academic archive"
            items={recentAcademicItems}
          />
          <HomeCollectionRail
            eyebrow={
              getSectionSettingString(recommendationsSection, "eyebrow") ??
              "Recommendations"
            }
            title={recommendationsSection?.heading ?? "Recent recommendations"}
            description={
              recommendationsSection?.subheading ??
              "Useful books, tools, and resources worth keeping visible."
            }
            href="/recommendations"
            hrefLabel="Browse recommendations"
            items={recentRecommendationItems}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            <div className="flex items-end justify-between gap-6">
              <SectionHeading
                eyebrow={recentEyebrow}
                title={recentSection?.heading ?? "Fresh writing from the archive"}
                description={
                  stripMarkdown(
                    recentSection?.bodyMarkdown ??
                      recentSection?.subheading ??
                      "Recent posts stay visible here so the homepage always feels active.",
                  ) || undefined
                }
              />
              <Link href="/blogs" className="hidden whitespace-nowrap text-sm text-sky-300 transition hover:text-white md:inline-flex">
                View all →
              </Link>
            </div>

            <div className="mt-8 flex flex-col gap-5">
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
                  layout="list"
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-[1.45rem] border border-white/7 bg-white/[0.02] p-6 shadow-sm md:p-8">
              <SectionHeading
                eyebrow="Trending Topics"
                title="Ideas on the move"
                description="Derived organically from what I'm writing about."
              />
              <div className="mt-6 flex flex-wrap gap-2">
                {trendingTopics.map((topic) => (
                  <span key={topic} className="signal-pill text-xs px-3 py-1.5">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <div className="dark-panel rounded-[2rem] px-6 py-10 text-center md:px-12 md:py-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <span className="text-sky-400">✦</span>
            {connectEyebrow}
          </p>
          <h2 className="mt-7 font-display text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white md:text-[4rem]">
            {subscribeHeading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-300">
            {subscribeDescription}
          </p>
          <NewsletterSignup
            className="mx-auto mt-7 max-w-2xl"
            contactEmail={siteSettings.contactEmail}
          />
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
