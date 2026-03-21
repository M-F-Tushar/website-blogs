import { existsSync } from "node:fs";
import { join } from "node:path";

import Image from "next/image";

import { Markdown } from "@/components/site/markdown";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAboutPageData } from "@/lib/content/queries";
import { buildSiteMetadata } from "@/lib/content/seo";
import { cn } from "@/lib/utils";
import type { PageSection } from "@/types/content";

export async function generateMetadata() {
  return buildSiteMetadata({
    title: "About",
    description:
      "Who I am, what I study, why AI/ML matters to me, and the values shaping my long-term professional direction.",
    path: "/about",
  });
}

interface AboutMetric {
  label: string;
  value: string;
}

interface TimelineItem {
  phase: string;
  status: string;
  title: string;
  description: string;
  tags: string[];
  align: "left" | "right";
}

const DEFAULT_ABOUT_SIGNALS = [
  "AI engineering trajectory",
  "Research-informed practice",
  "Visible systems thinking",
];

const DEFAULT_IDENTITY_METRICS: AboutMetric[] = [
  {
    label: "Base",
    value: "CSE and software systems",
  },
  {
    label: "Direction",
    value: "AI, ML, LLMs, and MLOps",
  },
  {
    label: "Mode",
    value: "Research-minded builder",
  },
];

const DEFAULT_TIMELINE_ITEMS: TimelineItem[] = [
  {
    phase: "01",
    status: "Foundation",
    title: "Computer science grounding",
    description:
      "Programming discipline, algorithms, systems thinking, and the technical habits that support durable engineering work.",
    tags: ["CSE", "problem solving", "systems"],
    align: "left",
  },
  {
    phase: "02",
    status: "Build",
    title: "Applied ML practice",
    description:
      "Statistics, experimentation, model evaluation, and the transition from theory-only study into repeatable implementation.",
    tags: ["ML", "experiments", "evaluation"],
    align: "right",
  },
  {
    phase: "03",
    status: "Current",
    title: "LLM engineering focus",
    description:
      "Prompt design, retrieval patterns, orchestration, and understanding how LLM systems succeed or fail in practical use.",
    tags: ["LLMs", "retrieval", "workflows"],
    align: "left",
  },
  {
    phase: "04",
    status: "Next",
    title: "Production and MLOps depth",
    description:
      "Deployment pipelines, reproducibility, observability, and the operational discipline required for dependable AI products.",
    tags: ["MLOps", "deployment", "observability"],
    align: "right",
  },
];

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

function parseStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

function parseMetrics(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_IDENTITY_METRICS;
  }

  const items = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.label !== "string" ||
        typeof item.value !== "string"
      ) {
        return null;
      }

      const label = item.label.trim();
      const metricValue = item.value.trim();

      if (!label || !metricValue) {
        return null;
      }

      return {
        label,
        value: metricValue,
      };
    })
    .filter((item): item is AboutMetric => item !== null);

  return items.length > 0 ? items : DEFAULT_IDENTITY_METRICS;
}

function parseTimelineItems(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_TIMELINE_ITEMS;
  }

  const items = value
    .map((item, index) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.title !== "string" ||
        typeof item.description !== "string"
      ) {
        return null;
      }

      const title = item.title.trim();
      const description = item.description.trim();

      if (!title || !description) {
        return null;
      }

      const phase =
        typeof item.phase === "string" && item.phase.trim().length > 0
          ? item.phase.trim()
          : String(index + 1).padStart(2, "0");
      const status =
        typeof item.status === "string" && item.status.trim().length > 0
          ? item.status.trim()
          : "Planned";
      const align =
        item.align === "left" || item.align === "right"
          ? item.align
          : index % 2 === 0
            ? "left"
            : "right";

      return {
        phase,
        status,
        title,
        description,
        tags: parseStringArray(item.tags, []),
        align,
      };
    })
    .filter((item): item is TimelineItem => item !== null);

  return items.length > 0 ? items : DEFAULT_TIMELINE_ITEMS;
}

function formatSectionLabel(section: PageSection | null, fallback: string) {
  if (!section?.sectionType) {
    return fallback;
  }

  return section.sectionType.replace(/-/g, " ");
}

export default async function AboutPage() {
  const { siteSettings, sections } = await getAboutPageData();
  const identitySection =
    sections.find((section) => section.sectionType === "identity") ?? null;
  const timelineSection =
    sections.find((section) => section.sectionType === "timeline") ?? sections[0] ?? null;
  const valuesSection =
    sections.find((section) => section.sectionType === "principles") ?? null;
  const supportingSections = sections.filter(
    (section) =>
      section.id !== identitySection?.id &&
      section.id !== timelineSection?.id &&
      section.id !== valuesSection?.id,
  );
  const aboutSignals = parseStringArray(
    identitySection?.settings.signals,
    DEFAULT_ABOUT_SIGNALS,
  );
  const identityMetrics = parseMetrics(identitySection?.settings.metrics);
  const timelineItems = parseTimelineItems(timelineSection?.settings.timelineItems);
  const portraitUrl =
    identitySection?.imageUrl ?? timelineSection?.imageUrl ?? resolveLocalPortraitPath();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <section className="grid-backdrop overflow-hidden rounded-[2.25rem] border border-white/45">
        <div className="grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SectionHeading
              eyebrow="About"
              title="Building a serious identity around learning, research depth, and technical consistency"
              description="This is where the path from CSE student to AI/ML/LLM/MLOps professional becomes visible, documented, and evidence-driven."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              {aboutSignals.map((signal) => (
                <span key={signal} className="signal-pill">
                  {signal}
                </span>
              ))}
            </div>

            <div className="surface-panel mt-8 rounded-[1.8rem] p-6 md:p-8">
              <p className="signal-label">{formatSectionLabel(identitySection, "Identity")}</p>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em] text-balance">
                {identitySection?.heading ?? "A personal platform for AI-native engineering work"}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                {identitySection?.subheading ??
                  "The goal is not just to have an online presence. It is to build a durable public record of how technical thinking matures through study, experimentation, and repeated systems work."}
              </p>
              <Markdown
                className="mt-6"
                content={
                  identitySection?.bodyMarkdown ??
                  "I am building toward AI engineering, ML systems, LLM workflows, and dependable production practice. This site acts as both public notebook and technical signal."
                }
              />
            </div>
          </div>

          <div className="dark-panel rounded-[2rem] p-6 text-white md:p-8">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/50">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(141,227,255,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(27,154,209,0.22),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(141,227,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(141,227,255,0.08)_1px,transparent_1px)] bg-[size:2.6rem_2.6rem] opacity-40" />
              <div className="relative aspect-[4/5]">
                {portraitUrl ? (
                  <Image
                    src={portraitUrl}
                    alt={`${siteSettings.siteName} portrait`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="relative flex h-full items-end justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(141,227,255,0.22),transparent_18%),radial-gradient(circle_at_50%_82%,rgba(27,154,209,0.18),transparent_30%)]" />
                    <div className="absolute left-1/2 top-[19%] h-28 w-28 -translate-x-1/2 rounded-full border border-white/12 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.24),rgba(107,155,188,0.18)_55%,rgba(7,19,31,0.84)_100%)] shadow-[0_0_60px_rgba(27,154,209,0.16)]" />
                    <div className="absolute left-1/2 top-[41%] h-[50%] w-[72%] -translate-x-1/2 rounded-t-[10rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,33,49,0.66),rgba(5,12,21,0.96))]" />
                    <div className="absolute inset-x-8 bottom-8 rounded-[1.25rem] border border-white/10 bg-black/24 px-4 py-3 text-center">
                      <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-cyan-200/90">
                        Portrait channel ready
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Upload a headshot to replace this fallback automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                  Visual identity
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">
                  {siteSettings.siteName}
                </h2>
              </div>
              <div className="rounded-full border border-white/12 bg-white/6 px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-cyan-100/80">
                AI native
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {identityMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                >
                  <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-cyan-200/90">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dark-panel mt-12 rounded-[2.25rem] p-8 text-white md:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.58fr_1.42fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
              Timeline diagram
            </p>
            <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.05em] text-balance md:text-5xl">
              {timelineSection?.heading ?? "A visual map of the technical path"}
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              {timelineSection?.subheading ??
                "Academic depth, practical implementation, and production discipline are being layered together as one long-term trajectory."}
            </p>
            <Markdown
              className="mt-8 [&_blockquote]:text-slate-300 [&_li]:text-slate-200 [&_p]:text-slate-200"
              content={
                timelineSection?.bodyMarkdown ??
                "The path is moving from core CS habits toward model-building, LLM systems, and eventually production-grade AI delivery."
              }
            />
          </div>

          <div className="relative">
            <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-cyan-200/0 via-cyan-200/70 to-cyan-200/0 md:left-1/2 md:-translate-x-1/2" />
            <div className="space-y-6">
              {timelineItems.map((item, index) => (
                <div
                  key={`${item.phase}-${item.title}`}
                  className="relative grid gap-4 md:grid-cols-2 md:items-center"
                >
                  <div
                    className={cn(
                      "relative pl-14 md:pl-0",
                      item.align === "left" ? "md:pr-10" : "md:col-start-2 md:pl-10",
                    )}
                  >
                    <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur-md">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-cyan-200/90">
                          Phase {item.phase}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-[0.66rem] uppercase tracking-[0.2em]",
                            item.status === "Current" &&
                              "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
                            item.status === "Next" &&
                              "border-blue-300/20 bg-blue-300/10 text-blue-100",
                            item.status !== "Current" &&
                              item.status !== "Next" &&
                              "border-white/12 bg-white/6 text-slate-200",
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                      <h3 className="mt-5 font-display text-2xl font-semibold tracking-[-0.05em] text-balance">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-slate-300">
                        {item.description}
                      </p>
                      {item.tags.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "pointer-events-none absolute left-5 top-6 h-4 w-4 -translate-x-1/2 rounded-full border border-cyan-200/50 bg-cyan-200 shadow-[0_0_30px_rgba(141,227,255,0.5)] md:left-1/2",
                      index === timelineItems.length - 1 &&
                        "shadow-[0_0_34px_rgba(96,165,250,0.5)]",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {valuesSection ? (
        <section className="surface-panel mt-12 rounded-[2rem] p-6 md:p-8">
          <p className="signal-label">{formatSectionLabel(valuesSection, "Principles")}</p>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em] text-balance">
            {valuesSection.heading}
          </h2>
          {valuesSection.subheading ? (
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
              {valuesSection.subheading}
            </p>
          ) : null}
          <Markdown className="mt-6" content={valuesSection.bodyMarkdown} />
        </section>
      ) : null}

      {supportingSections.length > 0 ? (
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {supportingSections.map((section) => (
            <section
              key={section.id}
              className="surface-panel rounded-[1.85rem] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(9,21,33,0.12)] md:p-8"
            >
              <p className="signal-label">{formatSectionLabel(section, "Supporting")}</p>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em] text-balance">
                {section.heading}
              </h2>
              {section.subheading ? (
                <p className="mt-4 text-sm leading-7 text-muted">{section.subheading}</p>
              ) : null}
              <Markdown className="mt-6" content={section.bodyMarkdown} />
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
