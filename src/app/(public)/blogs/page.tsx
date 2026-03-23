import { notFound, permanentRedirect } from "next/navigation";

import { DetailCard } from "@/components/site/detail-card";
import { Markdown } from "@/components/site/markdown";
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
import { cn } from "@/lib/utils";

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
  const supportingSections = sections.filter((section) => section.id !== heroSection?.id);
  const title = getSectionSettingString(heroSection, "heroTitle") ?? "The Blog";
  const badge =
    getSectionSettingString(heroSection, "eyebrow") ?? "Explore my thoughts & tutorials";

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="mx-auto max-w-4xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
          <span className="text-sky-400">✦</span>
          {badge}
        </p>
        <h1 className="mt-6 font-display text-[4rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.4rem]">
          <span className="accent-gradient-text">{title}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-[1.04rem] leading-8 text-slate-300 md:text-[1.14rem]">
          {heroSection?.subheading ??
            page?.metaDescription ??
            "Discover articles on web development, software engineering, and the latest tech trends."}
        </p>
        {heroSection?.bodyMarkdown ? (
          <div className="mt-7 text-left">
            <DetailCard
              eyebrow="Editorial note"
              title="Why this archive exists"
              description="The writing here is part of the work, not separate from it."
            >
              <Markdown content={heroSection.bodyMarkdown} />
            </DetailCard>
          </div>
        ) : null}
      </section>

      {supportingSections.length > 0 ? (
        <section
          className={cn(
            "mt-10 gap-5",
            supportingSections.length === 1 ? "mx-auto max-w-3xl" : "grid lg:grid-cols-2",
          )}
        >
          {supportingSections.map((section) => (
            <DetailCard
              key={section.id}
              eyebrow={getSectionSettingString(section, "eyebrow") ?? section.sectionKey}
              title={section.heading}
              description={section.subheading}
            >
              <Markdown content={section.bodyMarkdown} />
            </DetailCard>
          ))}
        </section>
      ) : null}

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
