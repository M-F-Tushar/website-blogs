import { slugify, stripMarkdown } from "@/lib/utils";

export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

export function createArticleHeadingIdGenerator() {
  const counts = new Map<string, number>();

  return (value: string) => {
    const base = slugify(stripMarkdown(value).trim()) || "section";
    const currentCount = counts.get(base) ?? 0;
    counts.set(base, currentCount + 1);

    return currentCount === 0 ? base : `${base}-${currentCount + 1}`;
  };
}

export function extractArticleHeadings(markdown: string): ArticleHeading[] {
  const headings: ArticleHeading[] = [];
  const nextHeadingId = createArticleHeadingIdGenerator();
  let inCodeFence = false;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (/^(```|~~~)/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence || !line) {
      continue;
    }

    const match = /^(#{2,4})\s+(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    const level = match[1].length as 2 | 3 | 4;
    const text = stripMarkdown(match[2].replace(/\s+#+\s*$/, "")).trim();

    if (!text) {
      continue;
    }

    headings.push({
      id: nextHeadingId(text),
      text,
      level,
    });
  }

  return headings;
}
