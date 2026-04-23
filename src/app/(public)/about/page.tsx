import { existsSync } from "node:fs";
import { join } from "node:path";

import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";

import { Markdown } from "@/components/site/markdown";
import { SignalCard } from "@/components/site/signal-card";
import { getAboutPageData } from "@/lib/content/queries";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";
import { countWords, formatCompactNumber, stripMarkdown } from "@/lib/utils";
import { AboutTimeline, type TimelineItem } from "@/components/site/about-timeline";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("about", {
    title: "About",
    description:
      "Who I am, what I study, why AI/ML matters to me, and the values shaping my long-term professional direction.",
  });
}


interface AboutSummaryItem {
  label: string;
  value: string;
}


function resolveLocalPortraitPath() {
  const candidates = [
    "portrait.webp",
    "portrait.png",
    "portrait.jpg",
    "portrait.jpeg",
    "headshot.webp",
    "headshot.png",
    "headshot.jpg",
    "headshot.jpeg",
  ];

  for (const candidate of candidates) {
    if (existsSync(join(process.cwd(), "public", candidate))) {
      return `/${candidate}`;
    }
  }

  return null;
}

function parseTimelineItems(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<TimelineItem[]>((items, item, index) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.title !== "string" ||
        typeof item.description !== "string"
      ) {
        return items;
      }

      const record = item as {
        phase?: unknown;
        status?: unknown;
        title: string;
        description: string;
        tags?: unknown;
        align?: unknown;
      };
      const tags = Array.isArray(record.tags)
        ? record.tags.filter(
            (tag): tag is string => typeof tag === "string" && tag.trim().length > 0,
          )
        : [];

      items.push({
        phase:
          typeof record.phase === "string" && record.phase.trim().length > 0
            ? record.phase.trim()
            : String(index + 1).padStart(2, "0"),
        status:
          typeof record.status === "string" && record.status.trim().length > 0
            ? record.status.trim()
            : undefined,
        title: record.title.trim(),
        description: record.description.trim(),
        tags: tags.length > 0 ? tags : undefined,
        align: record.align === "right" ? "right" : "left",
      });

      return items;
    }, []);
}

function buildFallbackTimelineItems({
  timelineSection,
  posts,
  academicEntries,
  recommendations,
  focusAreas,
}: {
  timelineSection: Awaited<ReturnType<typeof getAboutPageData>>["sections"][number] | null;
  posts: Awaited<ReturnType<typeof getAboutPageData>>["posts"];
  academicEntries: Awaited<ReturnType<typeof getAboutPageData>>["academicEntries"];
  recommendations: Awaited<ReturnType<typeof getAboutPageData>>["recommendations"];
  focusAreas: string[];
}) {
  const roadmapDescription =
    timelineSection?.bodyMarkdown
      ? stripMarkdown(timelineSection.bodyMarkdown)
      : "Moving from fundamentals into practical AI systems, research literacy, and dependable engineering habits.";

  return [
    {
      phase: "01",
      status: "Foundation",
      title: "Computer science grounding",
      description:
        "Building the base through systems thinking, implementation discipline, and the habits that make technical work compound.",
      tags: ["systems", "discipline"],
      align: "left",
    },
    {
      phase: "02",
      status: "Exploration",
      title: "AI and ML curiosity turns serious",
      description:
        focusAreas.length > 0
          ? `The work starts clustering around ${focusAreas.slice(0, 3).join(", ")}.`
          : "The direction shifts toward AI, ML, and the questions worth studying deeply.",
      tags: focusAreas.slice(0, 2),
      align: "right",
    },
    {
      phase: "03",
      status: "Public record",
      title: "Learning becomes visible",
      description: `${posts.length} published notes and ${academicEntries.length} academic records turn private effort into something inspectable and real.`,
      tags: ["writing", "research"],
      align: "left",
    },
    {
      phase: "04",
      status: "Current phase",
      title: timelineSection?.heading ?? "Current learning roadmap",
      description: roadmapDescription,
      tags: recommendations.length > 0 ? ["curation", "next steps"] : ["next steps"],
      align: "right",
    },
  ] satisfies TimelineItem[];
}

function getDisplayName(siteName: string, explicitName: string | undefined) {
  if (explicitName?.trim()) {
    return explicitName.trim();
  }

  return siteName.replace(/'?s\s+blog/i, "").trim() || siteName;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function calculateYearsActive(dates: Array<string | null>) {
  const timestamps = dates
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value) && value > 0);

  if (timestamps.length === 0) {
    return "1+";
  }

  const earliest = Math.min(...timestamps);
  const years = Math.max(1, Math.ceil((Date.now() - earliest) / (1000 * 60 * 60 * 24 * 365)));
  return `${years}+`;
}

function toDisplayLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getFocusAreas({
  posts,
  academicEntries,
  recommendations,
}: {
  posts: Awaited<ReturnType<typeof getAboutPageData>>["posts"];
  academicEntries: Awaited<ReturnType<typeof getAboutPageData>>["academicEntries"];
  recommendations: Awaited<ReturnType<typeof getAboutPageData>>["recommendations"];
}) {
  return Array.from(
    new Set([
      ...posts.flatMap((post) => [...post.categories, ...post.tags]),
      ...academicEntries.map((entry) => toDisplayLabel(entry.entryType)),
      ...recommendations.map((item) => item.category).filter(Boolean),
    ]),
  )
    .filter((value): value is string => Boolean(value))
    .slice(0, 6);
}

export async function AboutPageContent({
  data,
}: {
  data?: Awaited<ReturnType<typeof getAboutPageData>>;
} = {}) {
  const resolvedData = data ?? (await getAboutPageData());
  const { siteSettings, sections, posts, academicEntries, recommendations } =
    resolvedData;
  const identitySection =
    sections.find((section) => section.sectionType === "identity") ?? sections[0] ?? null;
  const timelineSection =
    sections.find((section) => section.sectionType === "timeline") ?? null;

  const displayName = getDisplayName(
    siteSettings.siteName,
    typeof identitySection?.settings.displayName === "string"
      ? identitySection.settings.displayName
      : undefined,
  );
  const portraitUrl = identitySection?.imageUrl ?? resolveLocalPortraitPath();
  const totalWords = posts.reduce((sum, post) => sum + countWords(post.bodyMarkdown), 0);
  const topicCount = new Set([
    ...posts.flatMap((post) => [...post.categories, ...post.tags]),
    ...academicEntries.map((entry) => entry.entryType.replace(/_/g, " ")),
    ...recommendations.map((item) => item.category).filter(Boolean),
  ]).size;
  const yearsActive = calculateYearsActive([
    ...posts.map((post) => post.publishedAt),
    ...academicEntries.map((entry) => entry.completedAt ?? entry.startedAt),
  ]);
  const configuredTimelineItems = parseTimelineItems(timelineSection?.settings.timelineItems);
  const focusAreas = getFocusAreas({ posts, academicEntries, recommendations });
  const timelineItems =
    configuredTimelineItems.length > 0
      ? configuredTimelineItems
      : buildFallbackTimelineItems({
          timelineSection,
          posts,
          academicEntries,
          recommendations,
          focusAreas,
        });
  const aboutSummary: AboutSummaryItem[] = [
    { label: "Writing", value: `${posts.length} published notes` },
    { label: "Academic", value: `${academicEntries.length} tracked records` },
    { label: "Curation", value: `${recommendations.length} recommendations` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
            <span className="text-sky-400">✦</span>
            About Me
          </p>
          <h1 className="mt-6 font-display text-[4rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.6rem]">
            Hi, I&apos;m <span className="accent-gradient-text">{displayName}</span>
          </h1>
          <p className="mt-5 max-w-3xl text-[1.08rem] leading-8 text-slate-300 md:text-[1.18rem]">
            {identitySection?.subheading ??
              siteSettings.siteTagline ??
              "AI & ML Enthusiast • Aspiring AI Agent Developer • LLM Explorer • Lifelong Learner"}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="detail-card h-full">
              <p className="signal-label">Current Focus</p>
              <h2 className="mt-4 font-display text-[1.8rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-[1.95rem]">
                What I am actively deepening
              </h2>
              <p className="mt-3 text-[0.96rem] leading-7 text-slate-400">
                The public work clusters around a few themes that I want to study seriously and connect across projects.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {focusAreas.map((area) => (
                  <span key={area} className="signal-pill">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="detail-card h-full">
              <p className="signal-label">Platform Logic</p>
              <h2 className="mt-4 font-display text-[1.8rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-[1.95rem]">
                One record, several layers
              </h2>
              <p className="mt-3 text-[0.96rem] leading-7 text-slate-400">
                Writing, academic notes, and recommendations all feed the same long-horizon technical identity.
              </p>
              <div className="mt-5 space-y-3">
                {aboutSummary.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3"
                  >
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm font-medium text-slate-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="editorial-panel rounded-[2rem] p-4">
          <div className="relative overflow-hidden rounded-[1.7rem] border border-white/8 bg-slate-950/70">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_82%_0%,rgba(99,102,241,0.2),transparent_24%)]" />
            <div className="relative aspect-[4/4.8]">
              {portraitUrl ? (
                <Image
                  src={portraitUrl}
                  alt={`${siteSettings.siteName} portrait`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 34vw"
                  className="object-cover"
                />
              ) : (
                <div className="relative flex h-full items-center justify-center overflow-hidden text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(56,189,248,0.28),transparent_24%),radial-gradient(circle_at_80%_70%,rgba(129,140,248,0.22),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.72),rgba(2,6,23,0.98))]" />
                  <div className="absolute inset-10 rounded-full border border-sky-300/16" />
                  <div className="absolute inset-20 rounded-full border border-sky-300/10" />
                  <div className="relative">
                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.32em] text-sky-200/72">
                      Identity signal
                    </p>
                    <p className="mt-6 font-display text-[6rem] font-semibold leading-none tracking-[-0.08em] text-white md:text-[8rem]">
                      {getInitials(displayName)}
                    </p>
                    <p className="mx-auto mt-5 max-w-xs text-sm leading-7 text-slate-400">
                      Student builder, research-minded, and documenting the path in public.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SignalCard eyebrow="Articles Written" title={String(posts.length)} emphasis="display" />
        <SignalCard
          eyebrow="Total Words"
          title={formatCompactNumber(totalWords)}
          emphasis="display"
        />
        <SignalCard eyebrow="Years Active" title={yearsActive} emphasis="display" />
        <SignalCard eyebrow="Topics Covered" title={String(topicCount)} emphasis="display" />
      </section>

      <section className="mt-14 border-t border-white/8 pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <h2 className="font-display text-[2.8rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white md:text-[3.6rem]">
              My Story
            </h2>
            <div className="mt-5 space-y-5 text-[1rem] leading-8 text-slate-300">
              <Markdown
                content={
                  identitySection?.bodyMarkdown ??
                  "I am building this platform as a public record of learning, experimentation, and long-term technical growth."
                }
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <AboutTimeline
              items={timelineItems}
              heading={timelineSection?.heading}
              description={timelineSection?.subheading}
            />
          </div>
        </div>
      </section>

    </div>
  );
}

export default async function AboutPage() {
  const data = await getAboutPageData();

  if (!data.page) {
    notFound();
  }

  if (data.page.slug !== DEFAULT_TOP_LEVEL_PAGE_PATHS.about) {
    permanentRedirect(data.page.slug);
  }

  return <AboutPageContent data={data} />;
}
