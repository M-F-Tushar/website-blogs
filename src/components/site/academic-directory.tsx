"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { Grid2x2, List, Search } from "lucide-react";

import { ContentCard } from "@/components/site/content-card";
import type { AcademicEntry } from "@/types/content";
import { cn, estimateReadingTime } from "@/lib/utils";

export interface AcademicDirectoryCopy {
  searchPlaceholder: string;
  filterAllLabel: string;
  countLabel: string;
  sortNewestLabel: string;
  sortOldestLabel: string;
  sortAlphabeticalLabel: string;
  cardActionLabel: string;
  cardEyebrowFallback: string;
  emptyEyebrow: string;
  emptyHeading: string;
  emptyDescription: string;
}

interface AcademicDirectoryProps {
  entries: AcademicEntry[];
  copy: AcademicDirectoryCopy;
}

type DirectoryView = "grid" | "list";
type AcademicSort = "recent" | "oldest" | "alphabetical";

function sortEntries(entries: AcademicEntry[], sort: AcademicSort) {
  const sortedEntries = [...entries];

  sortedEntries.sort((left, right) => {
    if (sort === "alphabetical") {
      return left.title.localeCompare(right.title);
    }

    const leftTime = new Date(left.completedAt ?? left.startedAt ?? 0).getTime();
    const rightTime = new Date(right.completedAt ?? right.startedAt ?? 0).getTime();

    return sort === "oldest" ? leftTime - rightTime : rightTime - leftTime;
  });

  return sortedEntries;
}

export function AcademicDirectory({ entries, copy }: AcademicDirectoryProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<AcademicSort>("recent");
  const [view, setView] = useState<DirectoryView>("grid");
  const [activeType, setActiveType] = useState(copy.filterAllLabel);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const types = Array.from(new Set(entries.map((entry) => entry.entryType)));

  const filteredEntries = sortEntries(
    entries.filter((entry) => {
      const matchesType =
        activeType === copy.filterAllLabel || entry.entryType === activeType;

      if (!matchesType) {
        return false;
      }

      if (!deferredQuery) {
        return true;
      }

      return [entry.title, entry.summary ?? "", entry.entryType]
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery);
    }),
    sort,
  );

  const countText = copy.countLabel.replace("{count}", String(filteredEntries.length));

  return (
    <section className="mt-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative group w-full max-w-md rounded-[1.5rem] bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-2 shadow-lg backdrop-blur-xl border border-border dark:border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-500/30 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:shadow-[0_12px_40px_rgba(168,85,247,0.15)] focus-within:bg-[rgba(15,23,42,0.7)] focus-within:border-purple-400/50 focus-within:shadow-[0_12px_40px_rgba(168,85,247,0.2)]">
          <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-purple-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative z-10 flex items-center gap-4 px-4 py-3">
            <Search className="h-5 w-5 text-muted dark:text-slate-400 transition-colors duration-300 group-focus-within:text-purple-400" aria-hidden />
            <input
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => setQuery(value));
              }}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              className="flex-1 bg-transparent text-[1.1rem] text-muted dark:text-slate-200 placeholder:text-muted dark:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="inline-flex items-center rounded-xl border border-border dark:border-white/10 bg-slate-900/50 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all",
              view === "grid" 
                ? "bg-slate-800 text-sky-400 shadow-sm ring-1 ring-white/10" 
                : "text-muted dark:text-slate-500 hover:text-muted dark:text-slate-300"
            )}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
          >
            <Grid2x2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all",
              view === "list" 
                ? "bg-slate-800 text-sky-400 shadow-sm ring-1 ring-white/10" 
                : "text-muted dark:text-slate-500 hover:text-muted dark:text-slate-300"
            )}
            aria-label="List view"
            aria-pressed={view === "list"}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setActiveType(copy.filterAllLabel)}
          className={cn(
            "inline-flex items-center rounded-full border px-4 py-1.5 text-[0.85rem] font-semibold uppercase tracking-widest transition-all duration-300 backdrop-blur-md",
            activeType === copy.filterAllLabel
              ? "border-purple-400/40 bg-purple-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              : "border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] text-muted dark:text-slate-400 hover:border-white/20 hover:text-muted dark:text-slate-200 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)]"
          )}
        >
          {copy.filterAllLabel}
        </button>
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-1.5 text-[0.85rem] font-semibold uppercase tracking-widest transition-all duration-300 backdrop-blur-md",
              activeType === type
                ? "border-purple-400/40 bg-purple-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] text-muted dark:text-slate-400 hover:border-white/20 hover:text-muted dark:text-slate-200 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)]"
            )}
          >
            {type.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-border dark:border-white/10 pb-6">
        <div className="text-sm font-medium text-muted dark:text-slate-400">{countText}</div>
        <label className="flex items-center gap-3 text-sm">
          <span className="text-muted dark:text-slate-500">Sort by</span>
          <div className="relative">
            <select
              value={sort}
              onChange={(event) => {
                const value = event.target.value as AcademicSort;
                startTransition(() => setSort(value));
              }}
              className="appearance-none rounded-lg border border-border dark:border-white/10 bg-slate-900/50 py-1.5 pl-3 pr-8 font-medium text-muted dark:text-slate-300 transition-colors hover:border-white/20 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
            >
              <option value="recent">{copy.sortNewestLabel}</option>
              <option value="oldest">{copy.sortOldestLabel}</option>
              <option value="alphabetical">{copy.sortAlphabeticalLabel}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted dark:text-slate-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </label>
      </div>

      {filteredEntries.length > 0 ? (
        <div
          className={cn(
            "mt-8 gap-6",
            view === "grid"
              ? cn(
                  "grid md:grid-cols-2",
                  filteredEntries.length < 3 ? "mx-auto max-w-5xl" : "xl:grid-cols-3",
                )
              : "flex flex-col gap-5",
          )}
        >
          {filteredEntries.map((entry) => (
            <ContentCard
              key={entry.id}
              href={`/academic/${entry.slug}`}
              eyebrow={entry.entryType.replace(/_/g, " ") || copy.cardEyebrowFallback}
              title={entry.title}
              description={entry.summary}
              date={entry.completedAt ?? entry.startedAt}
              meta={estimateReadingTime(entry.bodyMarkdown)}
              imageUrl={entry.coverUrl}
              imageAlt={entry.coverAlt}
              layout={view}
              tags={[entry.entryType.replace(/_/g, " "), entry.externalUrl ? "external" : "onsite"]}
              actionLabel={copy.cardActionLabel}
            />
          ))}
        </div>
      ) : (
        <div className="group relative mt-12 overflow-hidden rounded-[2rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-10 text-center shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-[rgba(15,23,42,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.1),transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-inner backdrop-blur-md">
              <Search className="h-7 w-7 text-muted dark:text-slate-400" />
            </div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-widest text-muted dark:text-slate-300">
              {copy.emptyEyebrow}
            </p>
            <h3 className="mt-6 font-display text-[2.2rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground dark:text-white">
              {copy.emptyHeading}
            </h3>
            <p className="mt-4 max-w-lg text-[1.05rem] leading-[1.7] text-muted dark:text-slate-400">
              {copy.emptyDescription}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
