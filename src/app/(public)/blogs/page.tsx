import { notFound, permanentRedirect } from "next/navigation";

import { PostsDirectory } from "@/components/site/posts-directory";
import { getBlogsPageData } from "@/lib/content/queries";
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
  const resolvedData = data ?? (await getBlogsPageData());
  const { page, sections, posts } = resolvedData;
  const heroSection = getPrimarySection(sections, ["hero", "intro"], ["hero"]);
  const title = getSectionSettingString(heroSection, "heroTitle") ?? "The Blog";
  const badge =
    getSectionSettingString(heroSection, "eyebrow") ?? "Explore my thoughts & tutorials";

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <section className="redesign-hero rounded-[2rem] border border-white/8 px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
              <span className="text-sky-400">✦</span>
              {badge}
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-[4rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.4rem]">
              <span className="accent-gradient-text">{title}</span>
            </h1>
            <p className="mt-5 max-w-3xl text-[1.04rem] leading-8 text-slate-300 md:text-[1.14rem]">
              {heroSection?.subheading ??
                page?.metaDescription ??
                "Discover articles on web development, software engineering, and the latest tech trends."}
            </p>
          </div>
          <div className="page-rail">
            <div>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-slate-500">
                Archive shape
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-white">
                {posts.length} posts
              </p>
            </div>
            <div className="editorial-divider" />
            <p className="text-sm leading-7 text-slate-400">
              Built for progress notes, project filters, and technical reflection that compounds.
            </p>
          </div>
        </div>
      </section>

      <PostsDirectory posts={posts} />
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
