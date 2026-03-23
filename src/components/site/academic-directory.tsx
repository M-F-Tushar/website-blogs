"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { Grid2x2, List, Search } from "lucide-react";

import { ContentCard } from "@/components/site/content-card";
import type { AcademicEntry } from "@/types/content";
import { cn, estimateReadingTime } from "@/lib/utils";

interface AcademicDirectoryProps {
  entries: AcademicEntry[];
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

export function AcademicDirectory({ entries }: AcademicDirectoryProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<AcademicSort>("recent");
  const [view, setView] = useState<DirectoryView>("grid");
  const [activeType, setActiveType] = useState("All");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const types = Array.from(new Set(entries.map((entry) => entry.entryType)));

  const filteredEntries = sortEntries(
    entries.filter((entry) => {
      const matchesType = activeType === "All" || entry.entryType === activeType;

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

  return (
    <section className="mt-12">
      <div className="page-filter-shell">
        <div className="page-search-wrap">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              startTransition(() => setQuery(value));
            }}
            placeholder="Search research notes, experiments, or coursework..."
            className="page-search-input"
          />
        </div>

        <div className="inline-flex items-center rounded-[1rem] border border-white/8 bg-white/4 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn("archive-view-button", view === "grid" && "archive-view-button-active")}
            aria-label="Grid view"
          >
            <Grid2x2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn("archive-view-button", view === "list" && "archive-view-button-active")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveType("All")}
          className={cn("filter-pill", activeType === "All" && "filter-pill-active")}
        >
          All
        </button>
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={cn("filter-pill", activeType === type && "filter-pill-active")}
          >
            {type.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="archive-toolbar mt-8">
        <div className="text-slate-400">
          Showing {filteredEntries.length} academic records
        </div>
        <label className="inline-flex items-center gap-3 rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => {
              const value = event.target.value as AcademicSort;
              startTransition(() => setSort(value));
            }}
            className="bg-transparent text-white outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
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
              eyebrow={entry.entryType.replace(/_/g, " ")}
              title={entry.title}
              description={entry.summary}
              date={entry.completedAt ?? entry.startedAt}
              meta={estimateReadingTime(entry.bodyMarkdown)}
              imageUrl={entry.coverUrl}
              imageAlt={entry.coverAlt}
              layout={view}
              tags={[entry.entryType.replace(/_/g, " "), entry.externalUrl ? "external" : "onsite"]}
              actionLabel="Open Entry"
            />
          ))}
        </div>
      ) : (
        <div className="detail-card mt-10">
          <p className="signal-label">Academic archive</p>
          <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
            No academic entries match that search
          </h3>
          <p className="mt-4 text-[0.98rem] leading-8 text-slate-400">
            Change the search term or type filter to surface more records.
          </p>
        </div>
      )}
    </section>
  );
}
