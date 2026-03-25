"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { MarkdownHeading } from "@/lib/markdown-outline";

interface ArticleTocProps {
  headings: MarkdownHeading[];
}

export function ArticleToc({ headings }: ArticleTocProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  // Reset active heading when the article changes without a full remount.
  // Updating state during render (state-derivation pattern) avoids calling
  // setState synchronously inside an effect body.
  const prevFirstIdRef = useRef(headings[0]?.id ?? "");
  const firstHeadingId = headings[0]?.id ?? "";
  if (prevFirstIdRef.current !== firstHeadingId) {
    prevFirstIdRef.current = firstHeadingId;
    setActiveId(firstHeadingId);
  }

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

        if (visibleEntries[0]?.target.id) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -64% 0px",
        threshold: [0, 0.2, 0.6, 1],
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents">
      <div className="space-y-2">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "reading-toc-link",
              heading.level === 3 && "reading-toc-link-nested",
              heading.level === 4 && "reading-toc-link-deep",
              activeId === heading.id && "reading-toc-link-active",
            )}
            onClick={() => setActiveId(heading.id)}
          >
            <span className="truncate">{heading.text}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
