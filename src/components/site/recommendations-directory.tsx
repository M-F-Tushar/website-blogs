"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { Grid2x2, List, Search } from "lucide-react";

import { ContentCard } from "@/components/site/content-card";
import type { Recommendation } from "@/types/content";
import { cn } from "@/lib/utils";

interface RecommendationsDirectoryProps {
  recommendations: Recommendation[];
}

type DirectoryView = "grid" | "list";
type RecommendationSort = "newest" | "alphabetical" | "level";

function levelWeight(level: Recommendation["level"]) {
  switch (level) {
    case "advanced":
      return 3;
    case "intermediate":
      return 2;
    default:
      return 1;
  }
}

function sortRecommendations(
  recommendations: Recommendation[],
  sort: RecommendationSort,
) {
  if (sort === "newest") {
    return recommendations;
  }

  const sortedRecommendations = [...recommendations];

  sortedRecommendations.sort((left, right) => {
    if (sort === "alphabetical") {
      return left.title.localeCompare(right.title);
    }

    if (sort === "level") {
      return levelWeight(right.level) - levelWeight(left.level);
    }

    return 0;
  });

  return sortedRecommendations;
}

export function RecommendationsDirectory({
  recommendations,
}: RecommendationsDirectoryProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<RecommendationSort>("newest");
  const [view, setView] = useState<DirectoryView>("grid");
  const [activeCategory, setActiveCategory] = useState("All");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const categories = Array.from(
    new Set(recommendations.map((item) => item.category).filter(Boolean)),
  ) as string[];

  const filteredRecommendations = sortRecommendations(
    recommendations.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!deferredQuery) {
        return true;
      }

      return [
        item.title,
        item.summary ?? "",
        item.category ?? "",
        item.audience ?? "",
        item.useCase ?? "",
      ]
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
            placeholder="Search by title, description, or tag..."
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
          onClick={() => setActiveCategory("All")}
          className={cn("filter-pill", activeCategory === "All" && "filter-pill-active")}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={cn(
              "filter-pill",
              activeCategory === category && "filter-pill-active",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="archive-toolbar mt-8">
        <div className="text-slate-400">
          Showing {filteredRecommendations.length} curated resources
        </div>
        <label className="inline-flex items-center gap-3 rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => {
              const value = event.target.value as RecommendationSort;
              startTransition(() => setSort(value));
            }}
            className="bg-transparent text-white outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="level">By Level</option>
          </select>
        </label>
      </div>

      {filteredRecommendations.length > 0 ? (
        <div
          className={cn(
            "mt-8 gap-6",
            view === "grid"
              ? cn(
                  "grid md:grid-cols-2",
                  filteredRecommendations.length < 3 ? "mx-auto max-w-5xl" : "xl:grid-cols-3",
                )
              : "flex flex-col gap-5",
          )}
        >
          {filteredRecommendations.map((item) => (
            <ContentCard
              key={item.id}
              href={`/recommendations/${item.slug}`}
              eyebrow={item.category ?? "Recommendation"}
              title={item.title}
              description={item.summary}
              meta={item.level}
              imageUrl={item.coverUrl}
              imageAlt={item.coverAlt}
              layout={view}
              tags={[item.level, item.audience ?? "", item.useCase ?? ""]}
              actionLabel="View Resource"
            />
          ))}
        </div>
      ) : (
        <div className="detail-card mt-10">
          <p className="signal-label">Collection state</p>
          <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
            No recommendations match that filter
          </h3>
          <p className="mt-4 text-[0.98rem] leading-8 text-slate-400">
            Change the category or search term to widen the curated set again.
          </p>
        </div>
      )}
    </section>
  );
}
