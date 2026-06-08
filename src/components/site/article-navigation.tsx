"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ArticleHeading } from "@/lib/content/article-outline";
import { cn } from "@/lib/utils";

interface ArticleTableOfContentsProps {
  headings: ArticleHeading[];
  className?: string;
}

interface ArticleReadingRailProps {
  headings: ArticleHeading[];
  readingTime: string;
  wordCount: number;
  quote: string | null;
  className?: string;
}

function useArticleProgress(headings: ArticleHeading[]) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!headings.length) {
      return;
    }

    const compute = () => {
      frameRef.current = null;
      const articleElement = document.getElementById("article-body");
      if (!articleElement) {
        return;
      }

      const articleRect = articleElement.getBoundingClientRect();
      const totalScrollableDistance = Math.max(
        articleElement.offsetHeight - window.innerHeight * 0.6,
        1,
      );
      const scrolledDistance = Math.min(
        Math.max(-articleRect.top + window.innerHeight * 0.18, 0),
        totalScrollableDistance,
      );

      setProgress(Math.round((scrolledDistance / totalScrollableDistance) * 100));

      let currentHeadingId = headings[0]?.id ?? "";
      for (const heading of headings) {
        const headingElement = document.getElementById(heading.id);
        if (!headingElement) {
          continue;
        }

        if (headingElement.getBoundingClientRect().top <= 180) {
          currentHeadingId = heading.id;
        } else {
          break;
        }
      }

      setActiveId(currentHeadingId);
    };

    const schedule = () => {
      if (frameRef.current !== null) {
        return;
      }
      frameRef.current = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [headings]);

  return {
    activeId,
    progress,
  };
}

function useSmoothHashScroll() {
  return useCallback((event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    event.preventDefault();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    if (typeof history.replaceState === "function") {
      history.replaceState(null, "", `#${id}`);
    }
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }, []);
}

export function ArticleReadingRail({
  headings,
  readingTime,
  wordCount,
  quote,
  className,
}: ArticleReadingRailProps) {
  const { activeId, progress } = useArticleProgress(headings);
  const activeHeading = useMemo(
    () => headings.find((heading) => heading.id === activeId) ?? headings[0],
    [activeId, headings],
  );
  const topLevelSectionCount = headings.filter((heading) => heading.level === 2).length;

  return (
    <aside className={cn("hidden xl:block", className)}>
      <div className="sticky top-28 space-y-10 pr-3">
        <div className="rounded-[1.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-6 shadow-xl backdrop-blur-xl transition-colors hover:border-sky-500/20 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:shadow-[0_12px_40px_rgba(14,165,233,0.1)]">
          <p className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            Reading progress
          </p>
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-8 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-500">Current Section</p>
          <p className="mt-2 font-display text-2xl font-medium leading-tight tracking-[-0.02em] text-foreground dark:text-slate-100">
            {activeHeading?.text ?? "Opening"}
          </p>
        </div>

        <div className="border-l-2 border-border dark:border-white/10 pl-6 transition-colors hover:border-white/20">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-400">
            Metadata
          </p>
          <dl className="mt-5 space-y-5 text-sm text-muted dark:text-slate-300">
            <div>
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-500">
                Reading time
              </dt>
              <dd className="mt-1 text-base font-medium text-muted dark:text-slate-200">{readingTime}</dd>
            </div>
            <div>
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-500">
                Word count
              </dt>
              <dd className="mt-1 text-base font-medium text-muted dark:text-slate-200">
                {new Intl.NumberFormat("en-US").format(wordCount)} words
              </dd>
            </div>
            <div>
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-500">
                Main sections
              </dt>
              <dd className="mt-1 text-base font-medium text-muted dark:text-slate-200">
                {topLevelSectionCount > 0 ? topLevelSectionCount : "Opening note"}
              </dd>
            </div>
          </dl>
        </div>

        {quote ? (
          <blockquote className="max-w-[14rem] border-l-2 border-indigo-400/50 pl-6 font-serif text-[1.15rem] italic leading-8 text-muted dark:text-slate-300">
            &quot;{quote}&quot;
          </blockquote>
        ) : null}
      </div>
    </aside>
  );
}

export function ArticleTableOfContents({
  headings,
  className,
}: ArticleTableOfContentsProps) {
  const { activeId, progress } = useArticleProgress(headings);
  const handleClick = useSmoothHashScroll();

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className={cn("hidden xl:block", className)}>
      <div className="sticky top-28 pl-3">
        <div className="rounded-[1.5rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-6 shadow-xl backdrop-blur-xl transition-colors hover:border-sky-500/20 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:shadow-[0_12px_40px_rgba(14,165,233,0.1)]">
          <p className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            Table of contents
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted dark:text-slate-500">{progress}% completed</p>
          
          <nav className="mt-8 border-l-2 border-border dark:border-white/10 pl-2">
            <ul className="space-y-2">
              {headings.map((heading) => {
                const isActive = heading.id === activeId;

                return (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      onClick={(event) => handleClick(event, heading.id)}
                      className={cn(
                        "group relative block rounded-r-lg py-2 pr-3 text-[0.9rem] leading-6 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50",
                        heading.level === 3 && "pl-5 text-[0.85rem]",
                        heading.level === 4 && "pl-9 text-[0.8rem]",
                        isActive
                          ? "font-medium text-sky-300"
                          : "text-muted dark:text-slate-400 hover:text-muted dark:text-slate-200 hover:bg-slate-800/30",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute inset-y-0 -left-[9px] w-[2px] rounded-r-md bg-transparent transition-all duration-300",
                          isActive && "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]",
                        )}
                      />
                      <span className="pl-5 block">{heading.text}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
}
