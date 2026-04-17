"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    if (!headings.length) {
      return;
    }

    const updateReadingState = () => {
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

    updateReadingState();
    window.addEventListener("scroll", updateReadingState, { passive: true });
    window.addEventListener("resize", updateReadingState);

    return () => {
      window.removeEventListener("scroll", updateReadingState);
      window.removeEventListener("resize", updateReadingState);
    };
  }, [headings]);

  return {
    activeId,
    progress,
  };
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
      <div className="sticky top-28 space-y-8 pr-3">
        <div className="border-l border-white/10 pl-5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-200/72">
            Reading pulse
          </p>
          <div className="mt-4 h-px w-full bg-white/10">
            <div
              className="h-px bg-gradient-to-r from-sky-300 via-cyan-300 to-transparent transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.26em] text-slate-500">Now in view</p>
          <p className="mt-2 font-display text-[1.7rem] leading-tight tracking-[-0.04em] text-white">
            {activeHeading?.text ?? "Opening"}
          </p>
        </div>

        <div className="border-l border-white/10 pl-5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-200/72">
            Article signal
          </p>
          <dl className="mt-4 space-y-4 text-sm text-slate-300">
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                Reading time
              </dt>
              <dd className="mt-1 text-base text-slate-100">{readingTime}</dd>
            </div>
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                Word count
              </dt>
              <dd className="mt-1 text-base text-slate-100">
                {new Intl.NumberFormat("en-US").format(wordCount)} words
              </dd>
            </div>
            <div>
              <dt className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
                Main sections
              </dt>
              <dd className="mt-1 text-base text-slate-100">
                {Math.max(topLevelSectionCount, headings.length > 0 ? 1 : 0)}
              </dd>
            </div>
          </dl>
        </div>

        {quote ? (
          <blockquote className="max-w-[14rem] border-l border-sky-300/28 pl-5 font-display text-[1.15rem] leading-8 text-slate-200/92">
            {quote}
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

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className={cn("hidden xl:block", className)}>
      <div className="sticky top-28 pl-3">
        <div className="border-l border-white/10 pl-5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-200/72">
            Table of contents
          </p>
          <p className="mt-3 text-sm text-slate-400">{progress}% through the article</p>
        </div>
        <nav className="mt-6 border-l border-white/10 pl-1">
          <ul className="space-y-1.5">
            {headings.map((heading) => {
              const isActive = heading.id === activeId;

              return (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    className={cn(
                      "group relative block py-1.5 pr-2 text-sm leading-6 text-slate-400 transition hover:text-white",
                      heading.level === 3 && "pl-4 text-[0.92rem]",
                      heading.level === 4 && "pl-8 text-[0.86rem]",
                      isActive && "text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 w-px bg-transparent transition",
                        isActive && "bg-gradient-to-b from-sky-300 via-cyan-300 to-transparent",
                      )}
                    />
                    <span className="pl-4">{heading.text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
