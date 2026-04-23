"use client";

import { motion } from "framer-motion";

export interface TimelineItem {
  phase: string;
  status?: string;
  title: string;
  description: string;
  tags?: string[];
  align?: "left" | "right";
}

export function AboutTimeline({
  items,
  heading,
  description,
}: {
  items: TimelineItem[];
  heading?: string | null;
  description?: string | null;
}) {
  return (
    <div className="detail-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_88%_12%,rgba(129,140,248,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_36%)]" />
      <div className="relative">
        <p className="signal-label">Journey Timeline</p>
        <h3 className="mt-4 font-display text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white md:text-[2.25rem]">
          {heading ?? "The phases shaping the work"}
        </h3>
        <p className="mt-3 max-w-xl text-[0.96rem] leading-7 text-slate-400">
          {description ??
            "A visual map of how the direction is forming, deepening, and turning into a more legible body of work."}
        </p>

        <div className="relative mt-8">
          <div className="absolute bottom-4 left-[1.05rem] top-4 w-px bg-gradient-to-b from-sky-300/70 via-sky-400/30 to-transparent" />
          <div className="space-y-5">
            {items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={`${item.phase}-${item.title}`}
                className={`relative grid gap-3 pl-10 md:grid-cols-[auto_minmax(0,1fr)]`}
              >
                <div className="absolute left-0 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/25 bg-slate-950/85 shadow-[0_0_0_6px_rgba(2,6,23,0.8)]">
                  <span className="font-mono text-[0.68rem] tracking-[0.2em] text-sky-200">
                    {item.phase}
                  </span>
                </div>
                <div
                  className={`rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.16)] transition-all hover:bg-white/[0.06] hover:border-white/20 ${
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
