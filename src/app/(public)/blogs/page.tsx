import { notFound, permanentRedirect } from "next/navigation";

import { PostsDirectory, type PostsDirectoryCopy } from "@/components/site/posts-directory";
import { getBlogsPageData, getDetailTemplateSection } from "@/lib/content/queries";
import {
  getPrimarySection,
  getSectionSettingString,
} from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("blogs", {
    title: "Blogs",
    description:
      "Writing across AI/ML, LLMs, MLOps, project logs, paper notes, and the career journey behind them.",
  });
}

export async function BlogsPageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getBlogsPageData>>;
} = {}) {
  const [resolvedData, template] = await Promise.all([
    data ? Promise.resolve(data) : getBlogsPageData(),
    getDetailTemplateSection("blogs", "blog-list"),
  ]);
  const { page, sections, posts } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);

  const heroEyebrow =
    getSectionSettingString(heroSection, "eyebrow") ??
    getSectionSettingString(template, "heroEyebrow") ??
    "Explore my thoughts & tutorials";
  const heroTitle =
    getSectionSettingString(heroSection, "heroTitle") ??
    getSectionSettingString(template, "heroTitleFallback") ??
    "The Blog";
  const heroDescription =
    heroSection?.subheading ??
    page?.metaDescription ??
    getSectionSettingString(template, "heroDescriptionFallback") ??
    "Discover articles on web development, software engineering, and the latest tech trends.";
  const railLabel = getSectionSettingString(template, "railLabel") ?? "Archive shape";
  const railUnitLabel = getSectionSettingString(template, "railUnitLabel") ?? "posts";
  const railDescription =
    getSectionSettingString(template, "railDescription") ??
    "Built for progress notes, project filters, and technical reflection that compounds.";

  const copy: PostsDirectoryCopy = {
    searchPlaceholder:
      getSectionSettingString(template, "searchPlaceholder") ?? "Search articles...",
    filterAllLabel: getSectionSettingString(template, "filterAllLabel") ?? "All",
    countLabel:
      getSectionSettingString(template, "countLabel") ?? "Showing {count} posts",
    sortNewestLabel:
      getSectionSettingString(template, "sortNewestLabel") ?? "Newest First",
    sortOldestLabel:
      getSectionSettingString(template, "sortOldestLabel") ?? "Oldest First",
    sortAlphabeticalLabel:
      getSectionSettingString(template, "sortAlphabeticalLabel") ?? "Alphabetical",
    cardActionLabel:
      getSectionSettingString(template, "cardActionLabel") ?? "Read Article",
    cardEyebrowFallback:
      getSectionSettingString(template, "cardEyebrowFallback") ?? "Article",
    emptyEyebrow:
      getSectionSettingString(template, "emptyEyebrow") ?? "Archive status",
    emptyHeading:
      getSectionSettingString(template, "emptyHeading") ??
      "No articles match that search",
    emptyDescription:
      getSectionSettingString(template, "emptyDescription") ??
      "Try a title keyword, a tag, or a category term to surface the post you want.",
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] px-8 py-12 shadow-2xl backdrop-blur-xl md:px-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-[0.85rem] font-semibold uppercase tracking-widest text-sky-200 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              {heroEyebrow}
            </p>
            <h1 className="mt-8 max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground dark:text-white md:text-[5.5rem] drop-shadow-sm">
              <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                {heroTitle}
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-[1.1rem] font-light leading-[1.7] text-muted dark:text-slate-300 md:text-[1.25rem]">
              {heroDescription}
            </p>
          </div>
          <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-8 shadow-lg backdrop-blur-md transition-colors hover:bg-black/[0.04] dark:bg-white/[0.04] hover:border-sky-500/20 hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-t from-sky-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                {railLabel}
              </p>
              <p className="mt-4 font-display text-[2.5rem] font-bold tracking-[-0.05em] text-foreground dark:text-white">
                {posts.length} <span className="text-[1.5rem] font-medium text-muted dark:text-slate-400">{railUnitLabel}</span>
              </p>
            </div>
            <div className="relative z-10 mt-6 pt-6 border-t border-border dark:border-white/10">
              <p className="text-[0.95rem] leading-relaxed text-muted dark:text-slate-400 group-hover:text-muted dark:text-slate-300 transition-colors">
                {railDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      <PostsDirectory posts={posts} copy={copy} />
    </div>
  );
}

export default async function BlogsPage() {
  const data = await getBlogsPageData();

  if (!data.page) {
    notFound();
  }

  if (data.page.slug !== DEFAULT_TOP_LEVEL_PAGE_PATHS.blogs) {
    permanentRedirect(data.page.slug);
  }

  return <BlogsPageContent data={data} />;
}
