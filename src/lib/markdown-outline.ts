import { slugify, stripMarkdown } from "@/lib/utils";

export interface MarkdownHeading {
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

export function createStableHeadingId(text: string, seen: Map<string, number>) {
  const normalized = stripMarkdown(text).replace(/\s+/g, " ").trim();
  const base = slugify(normalized).replace(/^-+|-+$/g, "") || "section";
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const seen = new Map<string, number>();
  let inCodeFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) {
      continue;
    }

    const match = /^(#{2,4})\s+(.+?)\s*#*\s*$/.exec(trimmed);
    if (!match) {
      continue;
    }

    const level = match[1].length as 2 | 3 | 4;
    const text = stripMarkdown(match[2]).replace(/\s+/g, " ").trim();

    if (!text) {
      continue;
    }

    headings.push({
      id: createStableHeadingId(text, seen),
      text,
      level,
    });
  }

  return headings;
}
