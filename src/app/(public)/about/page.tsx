import { existsSync } from "node:fs";
import { join } from "node:path";

import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";

import { SectionHeading } from "@/components/ui/section-heading";
import { Markdown } from "@/components/site/markdown";
import { SignalCard } from "@/components/site/signal-card";
import { getAboutPageData } from "@/lib/content/queries";
import {
  buildTopLevelPageMetadata,
  DEFAULT_TOP_LEVEL_PAGE_PATHS,
} from "@/lib/content/page-routing";
import { countWords, formatCompactNumber } from "@/lib/utils";

export async function generateMetadata() {
  return buildTopLevelPageMetadata("about", {
    title: "About",
    description:
      "Who I am, what I study, why AI/ML matters to me, and the values shaping my long-term professional direction.",
  });
}

interface TimelineItem {
  phase: string;
  title: string;
  description: string;
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

function parseTimelineItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [] satisfies TimelineItem[];
  }

  return value
    .map((item, index) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.title !== "string" ||
        typeof item.description !== "string"
      ) {
        return null;
      }

      return {
        phase:
          typeof item.phase === "string" && item.phase.trim().length > 0
            ? item.phase.trim()
            : String(index + 1).padStart(2, "0"),
        title: item.title.trim(),
        description: item.description.trim(),
      } satisfies TimelineItem;
    })
    .filter((item): item is TimelineItem => Boolean(item?.title && item.description));
}

function getDisplayName(siteName: string, explicitName: string | undefined) {
  if (explicitName?.trim()) {
    return explicitName.trim();
  }

  return siteName.replace(/'?s\s+blog/i, "").trim() || siteName;
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
    .filter(Boolean)
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
  const supportingSections = sections.filter(
    (section) => section.id !== identitySection?.id && section.id !== timelineSection?.id,
  );

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
  const timelineItems = parseTimelineItems(timelineSection?.settings.timelineItems);
  const focusAreas = getFocusAreas({ posts, academicEntries, recommendations });
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
                <div className="flex h-full items-center justify-center text-center text-slate-400">
                  Add a portrait in admin or place `public/portrait.jpg`.
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

          <div className="space-y-5">
            {supportingSections.length > 0 ? (
              supportingSections.map((section) => (
                <div key={section.id} className="detail-card">
                  <p className="signal-label">{section.sectionKey}</p>
                  <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
                    {section.heading}
                  </h3>
                  {section.subheading ? (
                    <p className="mt-4 text-[0.98rem] leading-8 text-slate-400">
                      {section.subheading}
                    </p>
                  ) : null}
                  <div className="mt-5">
                    <Markdown content={section.bodyMarkdown} />
                  </div>
                </div>
              ))
            ) : (
              <div className="detail-card">
                <p className="signal-label">What This Site Tracks</p>
                <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
                  Work that compounds over time
                </h3>
                <p className="mt-4 text-[0.98rem] leading-8 text-slate-400">
                  I want the public surface to show continuity: reading, implementation, experiments, and the judgment that grows from repeating that loop seriously.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {focusAreas.map((area) => (
                    <span key={area} className="signal-pill">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {timelineItems.length > 0 ? (
        <section className="mt-14">
          <SectionHeading
            eyebrow="Journey Map"
            title={timelineSection?.heading ?? "The current roadmap"}
            description={timelineSection?.subheading}
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {timelineItems.map((item) => (
              <SignalCard
                key={`${item.phase}-${item.title}`}
                eyebrow={`Phase ${item.phase}`}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </section>
      ) : null}

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
