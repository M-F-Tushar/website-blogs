import { notFound, permanentRedirect } from "next/navigation";

import { ContentCard } from "@/components/site/content-card";
import { DetailCard } from "@/components/site/detail-card";
import { Markdown } from "@/components/site/markdown";
import { SignalCard } from "@/components/site/signal-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getBlogsPageData } from "@/lib/content/queries";
import {
  getPrimarySection,
  getSectionPanelItems,
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

function getCollectionGridClasses(count: number) {
  if (count <= 1) {
    return "mt-12 max-w-4xl";
  }

  return "mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3";
}

function isFeaturedCollectionCard(count: number, index: number) {
  return count === 1 || (count >= 3 && index === 0);
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
  const panelLabel =
    getSectionSettingString(heroSection, "panelLabel") ?? "Writing system";
  const panelItems = getSectionPanelItems(heroSection, "panelItems", [
    {
      label: "Published nodes",
      value: String(posts.length).padStart(2, "0"),
      description: "Published posts",
    },
    {
      label: "Scope",
      value: "AI, ML, LLM, MLOps",
      description: "The themes running through the archive.",
    },
  ]);
  const emptyState =
    getSectionSettingString(heroSection, "emptyState") ??
    "No published blog posts yet. Add your first post from the admin panel.";

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="grid-backdrop overflow-hidden rounded-[2.15rem] border border-white/45">
        <div className="grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SectionHeading
              eyebrow={
                getSectionSettingString(heroSection, "eyebrow") ??
                page?.title ??
                "Blogs"
              }
              title={
                heroSection?.heading ??
                page?.title ??
                "Technical notes, project logs, paper reflections, and visible learning"
              }
              description={
                heroSection?.subheading ??
                page?.metaDescription ??
                "Writing is part of the work. These posts track progress, sharpen understanding, and make the journey legible."
              }
            />
            {heroSection?.bodyMarkdown ? (
              <Markdown className="mt-8" content={heroSection.bodyMarkdown} />
            ) : null}
          </div>
          <div className="editorial-panel rounded-[1.75rem] p-6 md:p-8">
            <p className="signal-label">{panelLabel}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {panelItems.map((item) => (
                <SignalCard
                  key={`${item.label}-${item.value}`}
                  eyebrow={item.label}
                  title={item.value}
                  description={item.description}
                  emphasis="display"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {supportingSections.length > 0 ? (
        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          {supportingSections.map((section) => (
            <DetailCard
              key={section.id}
              eyebrow={getSectionSettingString(section, "eyebrow") ?? section.sectionKey}
              title={section.heading}
              description={section.subheading}
              className="md:p-8"
            >
              <Markdown content={section.bodyMarkdown} />
            </DetailCard>
          ))}
        </section>
      ) : null}

      {posts.length > 0 ? (
        <div className={getCollectionGridClasses(posts.length)}>
          {posts.map((post, index) => (
            <ContentCard
              key={post.id}
              href={`/blogs/${post.slug}`}
              eyebrow={post.categories[0] ?? "Blog"}
              title={post.title}
              description={post.excerpt}
              date={post.publishedAt}
              imageUrl={post.coverUrl}
              imageAlt={post.coverAlt}
              size={isFeaturedCollectionCard(posts.length, index) ? "feature" : "default"}
              className={cn(
                posts.length >= 3 && index === 0 && "md:col-span-2 xl:col-span-2",
              )}
            />
          ))}
        </div>
      ) : null}

      {posts.length === 0 ? (
        <DetailCard
          className="mt-10 md:p-8"
          eyebrow="Archive status"
          title="No published posts yet"
          description={emptyState}
        />
      ) : null}
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
