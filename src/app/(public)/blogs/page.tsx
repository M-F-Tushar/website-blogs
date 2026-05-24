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
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <section className="redesign-hero rounded-[2rem] border border-white/8 px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
              <span className="text-sky-400" aria-hidden>✦</span>
              {heroEyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-[4rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.4rem]">
              <span className="accent-gradient-text">{heroTitle}</span>
            </h1>
            <p className="mt-5 max-w-3xl text-[1.04rem] leading-8 text-slate-300 md:text-[1.14rem]">
              {heroDescription}
            </p>
          </div>
          <div className="page-rail">
            <div>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-slate-500">
                {railLabel}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-white">
                {posts.length} {railUnitLabel}
              </p>
            </div>
            <div className="editorial-divider" />
            <p className="text-sm leading-7 text-slate-400">{railDescription}</p>
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
