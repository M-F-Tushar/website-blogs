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

function getCurrentStageFocusLabels(tags: string[]) {
  const replacements = new Map([
    ["llm systems", "Learning notes"],
    ["mlops discipline", "Build logs"],
    ["model evaluation", "Study roadmap"],
    ["research practice", "Reading notes"],
    ["artificial intelligence", "AI basics"],
    ["machine learning", "Coursework notes"],
    ["tech careers", "Career notes"],
  ]);

  const labels = tags.map((tag) => replacements.get(tag.trim().toLowerCase()) ?? tag);
  const uniqueLabels = Array.from(new Set(labels.filter(Boolean)));

  return uniqueLabels.length > 0
    ? uniqueLabels
    : ["Learning notes", "Project logs", "Study roadmap", "Resource notes"];
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
    <section className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-6 shadow-2xl backdrop-blur-md transition-colors duration-500 hover:border-white/20 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100" />
      <div className="relative z-10 flex flex-1 flex-col">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          {eyebrow}
        </p>
        <h3 className="mt-5 font-display text-[2.2rem] font-bold leading-[1.1] tracking-[-0.03em] text-foreground dark:text-white">
          {title}
        </h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted dark:text-slate-400">
          {description}
        </p>
        <div className="mt-8 flex flex-1 flex-col gap-4">
          {items.length > 0 ? (
            items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group/item relative flex flex-col justify-center rounded-[1.25rem] border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:bg-white/[0.06] hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)]"
              >
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted dark:text-slate-500 transition-colors duration-300 group-hover/item:text-sky-300">
                  {item.meta}
                </p>
                <h4 className="mt-2.5 font-display text-[1.25rem] font-medium leading-[1.2] tracking-[-0.02em] text-muted dark:text-slate-200 transition-colors duration-300 group-hover/item:text-foreground dark:text-white">
                  {item.title}
                </h4>
                {item.description ? (
                  <p className="mt-2.5 line-clamp-2 text-sm leading-[1.6] text-muted dark:text-slate-400 transition-colors duration-300 group-hover/item:text-muted dark:text-slate-300">
                    {item.description}
                  </p>
                ) : null}
              </Link>
            ))
          ) : (
            <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-border dark:border-white/10 bg-white/[0.01] px-6 py-8 text-center text-sm leading-relaxed text-muted dark:text-slate-500">
              This collection is ready to surface here as soon as the next item is published.
            </div>
          )}
        </div>
        <div className="mt-8 border-t border-border dark:border-white/10 pt-5">
          <Link
            href={href}
            className="group/link inline-flex items-center gap-2 text-[0.9rem] font-semibold text-muted dark:text-slate-300 transition-colors duration-300 hover:text-sky-400"
          >
            {hrefLabel}
            <span className="transition-transform duration-300 group-hover/link:translate-x-1">
              →
            </span>
          </Link>
        </div>
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
  const configuredFocusTags =
    getSectionSettingStringArray(heroSection, "focusTags").length > 0
      ? getSectionSettingStringArray(heroSection, "focusTags")
      : ["Learning notes", "Project logs", "Study roadmap", "Resource notes"];
  const focusTags = getCurrentStageFocusLabels(configuredFocusTags);
  const trendingTopics = getTrendingTopics(recentPosts, focusTags);
  const systemsMapNodesRaw = getSectionSettingStringArray(
    heroSection,
    "systemsMapNodes",
  );
  const systemsMapNodes =
    systemsMapNodesRaw.length >= 4
      ? systemsMapNodesRaw.slice(0, 4)
      : ["Writing", "Research", "Builds", "MLOps"];
  const systemsMapCoreLabel =
    getSectionSettingString(heroSection, "systemsMapCoreLabel") ?? "Public record";
  const systemsMapCoreCaption =
    getSectionSettingString(heroSection, "systemsMapCoreCaption") ?? "visible signals";
  const systemsMapStatLabels = {
    posts:
      getSectionSettingString(heroSection, "systemsMapPostsLabel") ?? "Posts",
    study:
      getSectionSettingString(heroSection, "systemsMapStudyLabel") ?? "Study",
    curated:
      getSectionSettingString(heroSection, "systemsMapCuratedLabel") ?? "Curated",
  };
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
      <section className="relative overflow-hidden px-6 py-16 md:py-24 lg:min-h-[calc(85svh-5.6rem)] lg:py-0 lg:flex lg:items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
        <div className="mx-auto grid w-full max-w-7xl gap-16 lg:grid-cols-[1fr_480px] lg:items-center relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-[0.85rem] font-medium text-sky-200 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              {heroBadge}
            </div>
            <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-balance text-foreground dark:text-white md:text-[4.5rem] lg:text-[5.5rem] drop-shadow-sm">
              {heroLead} <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                {displayName}
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-[1.1rem] leading-[1.7] text-muted dark:text-slate-300 md:text-[1.25rem] font-light">
              {heroDescription}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href={primaryCtaHref}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-sky-500 px-9 py-4 text-[0.95rem] font-semibold text-foreground dark:text-white shadow-[0_0_40px_-10px_rgba(14,165,233,0.5)] transition-all duration-300 hover:scale-105 hover:bg-sky-400 hover:shadow-[0_0_60px_-15px_rgba(14,165,233,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {primaryCtaLabel}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[150%] skew-x-[-20deg] transition-transform duration-700 group-hover:translate-x-[150%]" />
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/60 px-9 py-4 text-[0.95rem] font-semibold text-foreground dark:text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-slate-700/80 hover:border-slate-500/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {secondaryCtaLabel}
              </Link>
            </div>
            <div className="mt-12 hidden max-w-2xl items-center gap-3 md:flex flex-wrap">
              <span className="text-sm font-medium text-muted dark:text-slate-500 uppercase tracking-widest mr-2">Focus</span>
              {focusTags.slice(0, 4).map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full border border-slate-700/50 bg-slate-800/40 px-3.5 py-1.5 text-[0.75rem] font-medium text-muted dark:text-slate-300 transition-colors hover:border-slate-600/80 hover:text-foreground dark:text-slate-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[420px] lg:block">
            <div className="relative aspect-square w-full rounded-full border border-white/5 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)] before:absolute before:inset-0 before:rounded-full before:border before:border-white/5 before:scale-75 after:absolute after:inset-0 after:rounded-full after:border after:border-white/5 after:scale-50 animate-[spin_120s_linear_infinite]">
              <div className="absolute inset-0 flex items-center justify-center animate-[spin_120s_linear_infinite_reverse]">
                <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full border border-sky-500/30 bg-slate-950/80 shadow-[0_0_60px_rgba(14,165,233,0.2)] backdrop-blur-xl">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),transparent_60%)]" />
                  <p className="relative z-10 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-sky-400">
                    {systemsMapCoreLabel}
                  </p>
                  <p className="relative z-10 mt-3 font-display text-5xl font-bold tracking-tight text-foreground dark:text-white drop-shadow-md">
                    {recentPosts.length + recentAcademic.length + recentRecommendations.length}
                  </p>
                  <p className="relative z-10 mt-2 text-xs font-medium text-muted dark:text-slate-400 uppercase tracking-widest">{systemsMapCoreCaption}</p>
                </div>
              </div>
              
              <div className="absolute left-[8%] top-[15%] flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-500/30 bg-slate-900/90 shadow-[0_0_30px_rgba(99,102,241,0.2)] backdrop-blur-md animate-[spin_120s_linear_infinite_reverse]">
                 <span className="text-sm font-semibold tracking-wide text-indigo-200">{systemsMapNodes[0]}</span>
              </div>
              <div className="absolute right-[5%] top-[25%] flex h-28 w-28 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-sky-400/30 bg-slate-900/90 shadow-[0_0_30px_rgba(56,189,248,0.2)] backdrop-blur-md animate-[spin_120s_linear_infinite_reverse]">
                 <span className="text-sm font-semibold tracking-wide text-sky-200">{systemsMapNodes[1]}</span>
              </div>
              <div className="absolute bottom-[20%] left-[5%] flex h-20 w-20 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-purple-500/30 bg-slate-900/90 shadow-[0_0_30px_rgba(168,85,247,0.2)] backdrop-blur-md animate-[spin_120s_linear_infinite_reverse]">
                 <span className="text-xs font-semibold tracking-wide text-purple-200">{systemsMapNodes[2]}</span>
              </div>
              <div className="absolute bottom-[10%] right-[15%] flex h-24 w-24 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-emerald-500/30 bg-slate-900/90 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-md animate-[spin_120s_linear_infinite_reverse]">
                 <span className="text-sm font-semibold tracking-wide text-emerald-200">{systemsMapNodes[3]}</span>
              </div>
            </div>
            
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="group relative overflow-hidden rounded-2xl border border-border dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-5 text-center transition-colors hover:border-sky-500/30 hover:bg-black/[0.04] dark:bg-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-t from-sky-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="relative z-10 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-400 group-hover:text-sky-300 transition-colors">
                  {systemsMapStatLabels.posts}
                </p>
                <p className="relative z-10 mt-2 font-display text-3xl font-bold text-foreground dark:text-slate-100 group-hover:text-foreground dark:text-white transition-colors">{recentPosts.length}</p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-border dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-5 text-center transition-colors hover:border-indigo-500/30 hover:bg-black/[0.04] dark:bg-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="relative z-10 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-400 group-hover:text-indigo-300 transition-colors">
                  {systemsMapStatLabels.study}
                </p>
                <p className="relative z-10 mt-2 font-display text-3xl font-bold text-foreground dark:text-slate-100 group-hover:text-foreground dark:text-white transition-colors">{recentAcademic.length}</p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-border dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-5 text-center transition-colors hover:border-emerald-500/30 hover:bg-black/[0.04] dark:bg-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="relative z-10 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-400 group-hover:text-emerald-300 transition-colors">
                  {systemsMapStatLabels.curated}
                </p>
                <p className="relative z-10 mt-2 font-display text-3xl font-bold text-foreground dark:text-slate-100 group-hover:text-foreground dark:text-white transition-colors">{recentRecommendations.length}</p>
              </div>
            </div>
          </div>
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
              <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground dark:text-white">
                Publish a featured post to complete the hero-to-story flow
              </h3>
              <p className="mt-4 text-[0.98rem] leading-8 text-muted dark:text-slate-400">
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
              <Link href="/blogs" className="hidden whitespace-nowrap text-sm text-sky-300 transition hover:text-foreground dark:text-white md:inline-flex">
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
            <div className="sticky top-24 rounded-[1.45rem] border border-white/7 bg-black/[0.02] dark:bg-white/[0.02] p-6 shadow-sm md:p-8">
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

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-border dark:border-white/10 bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] px-6 py-14 text-center shadow-2xl backdrop-blur-xl md:px-16 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-sky-500/20 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-5 py-2 text-[0.8rem] font-semibold uppercase tracking-widest text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              {connectEyebrow}
            </p>
            <h2 className="mt-8 font-display text-[2.8rem] font-bold leading-[1.1] tracking-[-0.03em] text-foreground dark:text-white md:text-[4rem]">
              {subscribeHeading}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted dark:text-slate-300">
              {subscribeDescription}
            </p>
            <div className="mx-auto mt-10 max-w-xl relative">
              <NewsletterSignup
                className="w-full"
                contactEmail={siteSettings.contactEmail}
              />
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
