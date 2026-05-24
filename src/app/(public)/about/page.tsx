import { existsSync } from "node:fs";
import { join } from "node:path";

import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";

import { Markdown } from "@/components/site/markdown";
import { SignalCard } from "@/components/site/signal-card";
import {
  getAboutPageData,
  getDetailTemplateSection,
} from "@/lib/content/queries";
import { getSectionSettingString } from "@/lib/content/section-settings";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";
import type { PageSection } from "@/types/content";
import { countWords, formatCompactNumber, stripMarkdown } from "@/lib/utils";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("about", {
    title: "About",
    description:
      "Who I am, what I study, why AI/ML matters to me, and the values shaping my long-term professional direction.",
  });
}

interface TimelineItem {
  phase: string;
  status?: string;
  title: string;
  description: string;
  tags?: string[];
  align?: "left" | "right";
}

interface AboutSummaryItem {
  label: string;
  value: string;
}

function AboutTimeline({
  items,
  eyebrow,
  heading,
  description,
}: {
  items: TimelineItem[];
  eyebrow: string;
  heading: string;
  description: string;
}) {
  return (
    <div className="detail-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_88%_12%,rgba(129,140,248,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_36%)]" />
      <div className="relative">
        <p className="signal-label">{eyebrow}</p>
        <h3 className="mt-4 font-display text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white md:text-[2.25rem]">
          {heading}
        </h3>
        <p className="mt-3 max-w-xl text-[0.96rem] leading-7 text-slate-400">
          {description}
        </p>

        <div className="relative mt-8">
          <div className="absolute bottom-4 left-[1.05rem] top-4 w-px bg-gradient-to-b from-sky-300/70 via-sky-400/30 to-transparent" />
          <div className="space-y-5">
            {items.map((item, index) => (
              <div
                key={`${item.phase}-${item.title}`}
                className="relative grid gap-3 pl-10 md:grid-cols-[auto_minmax(0,1fr)]"
              >
                <div className="absolute left-0 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/25 bg-slate-950/85 shadow-[0_0_0_6px_rgba(2,6,23,0.8)]">
                  <span className="font-mono text-[0.68rem] tracking-[0.2em] text-sky-200">
                    {item.phase}
                  </span>
                </div>
                <div
                  className={`rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.16)] ${
                    item.align === "right" && index % 2 === 1 ? "md:ml-6" : "md:mr-6"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {item.status ? (
                      <span className="inline-flex items-center rounded-full border border-sky-300/15 bg-sky-400/8 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-sky-200">
                        {item.status}
                      </span>
                    ) : null}
                    {item.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h4 className="mt-3 font-display text-[1.45rem] leading-[1.08] tracking-[-0.03em] text-white">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-[0.95rem] leading-7 text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
  template,
  posts,
  academicEntries,
  recommendations,
  focusAreas,
}: {
  timelineSection: PageSection | null;
  template: PageSection | null;
  posts: Awaited<ReturnType<typeof getAboutPageData>>["posts"];
  academicEntries: Awaited<ReturnType<typeof getAboutPageData>>["academicEntries"];
  recommendations: Awaited<ReturnType<typeof getAboutPageData>>["recommendations"];
  focusAreas: string[];
}) {
  const roadmapDescription =
    timelineSection?.bodyMarkdown
      ? stripMarkdown(timelineSection.bodyMarkdown)
      : getSectionSettingString(template, "timelineRoadmapFallback") ??
        "Moving from fundamentals into practical AI systems, research literacy, and dependable engineering habits.";

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
  const [resolvedData, template] = await Promise.all([
    data ? Promise.resolve(data) : getAboutPageData(),
    getDetailTemplateSection("about", "about-template"),
  ]);
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
          template,
          posts,
          academicEntries,
          recommendations,
          focusAreas,
        });

  const heroEyebrow =
    getSectionSettingString(identitySection, "eyebrow") ??
    getSectionSettingString(template, "heroEyebrow") ??
    "About Me";
  const heroGreeting =
    getSectionSettingString(template, "heroGreeting") ?? "Hi, I’m";
  const taglineFallback =
    getSectionSettingString(template, "taglineFallback") ??
    "AI & ML Enthusiast • Aspiring AI Agent Developer • LLM Explorer • Lifelong Learner";
  const focusCardEyebrow =
    getSectionSettingString(template, "focusCardEyebrow") ?? "Current Focus";
  const focusCardTitle =
    getSectionSettingString(template, "focusCardTitle") ??
    "What I am actively deepening";
  const focusCardDescription =
    getSectionSettingString(template, "focusCardDescription") ??
    "The public work clusters around a few themes that I want to study seriously and connect across projects.";
  const platformCardEyebrow =
    getSectionSettingString(template, "platformCardEyebrow") ?? "Platform Logic";
  const platformCardTitle =
    getSectionSettingString(template, "platformCardTitle") ??
    "One record, several layers";
  const platformCardDescription =
    getSectionSettingString(template, "platformCardDescription") ??
    "Writing, academic notes, and recommendations all feed the same long-horizon technical identity.";
  const summaryWritingLabel =
    getSectionSettingString(template, "summaryWritingLabel") ?? "Writing";
  const summaryAcademicLabel =
    getSectionSettingString(template, "summaryAcademicLabel") ?? "Academic";
  const summaryCurationLabel =
    getSectionSettingString(template, "summaryCurationLabel") ?? "Curation";
  const summaryWritingUnit =
    getSectionSettingString(template, "summaryWritingUnit") ?? "published notes";
  const summaryAcademicUnit =
    getSectionSettingString(template, "summaryAcademicUnit") ?? "tracked records";
  const summaryCurationUnit =
    getSectionSettingString(template, "summaryCurationUnit") ?? "recommendations";
  const signalArticlesLabel =
    getSectionSettingString(template, "signalArticlesLabel") ?? "Articles Written";
  const signalWordsLabel =
    getSectionSettingString(template, "signalWordsLabel") ?? "Total Words";
  const signalYearsLabel =
    getSectionSettingString(template, "signalYearsLabel") ?? "Years Active";
  const signalTopicsLabel =
    getSectionSettingString(template, "signalTopicsLabel") ?? "Topics Covered";
  const storyHeading =
    getSectionSettingString(template, "storyHeading") ?? "My Story";
  const storyFallback =
    getSectionSettingString(template, "storyFallback") ??
    "I am building this platform as a public record of learning, experimentation, and long-term technical growth.";
  const timelineEyebrow =
    getSectionSettingString(template, "timelineEyebrow") ?? "Journey Timeline";
  const timelineHeading =
    timelineSection?.heading ??
    getSectionSettingString(template, "timelineHeadingFallback") ??
    "The phases shaping the work";
  const timelineDescription =
    timelineSection?.subheading ??
    getSectionSettingString(template, "timelineDescriptionFallback") ??
    "A visual map of how the direction is forming, deepening, and turning into a more legible body of work.";
  const portraitInitialsEyebrow =
    getSectionSettingString(template, "portraitInitialsEyebrow") ?? "Identity signal";
  const portraitInitialsCaption =
    getSectionSettingString(template, "portraitInitialsCaption") ??
    "Student builder, research-minded, and documenting the path in public.";

  const aboutSummary: AboutSummaryItem[] = [
    { label: summaryWritingLabel, value: `${posts.length} ${summaryWritingUnit}` },
    {
      label: summaryAcademicLabel,
      value: `${academicEntries.length} ${summaryAcademicUnit}`,
    },
    {
      label: summaryCurationLabel,
      value: `${recommendations.length} ${summaryCurationUnit}`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300">
            <span className="text-sky-400" aria-hidden>✦</span>
            {heroEyebrow}
          </p>
          <h1 className="mt-6 font-display text-[4rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[5.6rem]">
            {heroGreeting} <span className="accent-gradient-text">{displayName}</span>
          </h1>
          <p className="mt-5 max-w-3xl text-[1.08rem] leading-8 text-slate-300 md:text-[1.18rem]">
            {identitySection?.subheading ??
              siteSettings.siteTagline ??
              taglineFallback}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="detail-card h-full">
              <p className="signal-label">{focusCardEyebrow}</p>
              <h2 className="mt-4 font-display text-[1.8rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-[1.95rem]">
                {focusCardTitle}
              </h2>
              <p className="mt-3 text-[0.96rem] leading-7 text-slate-400">
                {focusCardDescription}
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
              <p className="signal-label">{platformCardEyebrow}</p>
              <h2 className="mt-4 font-display text-[1.8rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-[1.95rem]">
                {platformCardTitle}
              </h2>
              <p className="mt-3 text-[0.96rem] leading-7 text-slate-400">
                {platformCardDescription}
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
                      {portraitInitialsEyebrow}
                    </p>
                    <p className="mt-6 font-display text-[6rem] font-semibold leading-none tracking-[-0.08em] text-white md:text-[8rem]">
                      {getInitials(displayName)}
                    </p>
                    <p className="mx-auto mt-5 max-w-xs text-sm leading-7 text-slate-400">
                      {portraitInitialsCaption}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SignalCard eyebrow={signalArticlesLabel} title={String(posts.length)} emphasis="display" />
        <SignalCard
          eyebrow={signalWordsLabel}
          title={formatCompactNumber(totalWords)}
          emphasis="display"
        />
        <SignalCard eyebrow={signalYearsLabel} title={yearsActive} emphasis="display" />
        <SignalCard eyebrow={signalTopicsLabel} title={String(topicCount)} emphasis="display" />
      </section>

      <section className="mt-14 border-t border-white/8 pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <h2 className="font-display text-[2.8rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white md:text-[3.6rem]">
              {storyHeading}
            </h2>
            <div className="mt-5 space-y-5 text-[1rem] leading-8 text-slate-300">
              <Markdown
                content={identitySection?.bodyMarkdown ?? storyFallback}
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <AboutTimeline
              items={timelineItems}
              eyebrow={timelineEyebrow}
              heading={timelineHeading}
              description={timelineDescription}
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
