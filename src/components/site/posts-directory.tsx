"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { Grid2x2, List, Search, SlidersHorizontal } from "lucide-react";

import { ContentCard } from "@/components/site/content-card";
import type { PostSummary } from "@/types/content";
import { cn, estimateReadingTime } from "@/lib/utils";

export interface PostsDirectoryCopy {
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

interface PostsDirectoryProps {
  posts: PostSummary[];
  copy: PostsDirectoryCopy;
}

type PostSort = "newest" | "oldest" | "alphabetical";
type DirectoryView = "grid" | "list";

function sortPosts(posts: PostSummary[], sort: PostSort) {
  const sortedPosts = [...posts];

  sortedPosts.sort((left, right) => {
    if (sort === "alphabetical") {
      return left.title.localeCompare(right.title);
    }

    const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;

    return sort === "oldest" ? leftTime - rightTime : rightTime - leftTime;
  });

  return sortedPosts;
}

export function PostsDirectory({ posts, copy }: PostsDirectoryProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PostSort>("newest");
  const [view, setView] = useState<DirectoryView>("grid");
  const [activeCategory, setActiveCategory] = useState(copy.filterAllLabel);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const post of posts) {
      for (const cat of post.categories) {
        if (cat) set.add(cat);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = sortPosts(
    posts.filter((post) => {
      const matchesCategory =
        activeCategory === copy.filterAllLabel || post.categories.includes(activeCategory);

      if (!matchesCategory) {
        return false;
      }

      if (!deferredQuery) {
        return true;
      }

      return [
        post.title,
        post.excerpt ?? "",
        post.categories.join(" "),
        post.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery);
    }),
    sort,
  );

  const countText = copy.countLabel.replace("{count}", String(filteredPosts.length));

  return (
    <section className="mt-12">
      <div className="page-filter-shell">
        <div className="page-search-wrap" id="search">
          <Search className="h-5 w-5 text-slate-500" aria-hidden />
          <input
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              startTransition(() => setQuery(value));
            }}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
            className="page-search-input"
          />
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveCategory(copy.filterAllLabel)}
            className={cn(
              "filter-pill",
              activeCategory === copy.filterAllLabel && "filter-pill-active",
            )}
          >
            {copy.filterAllLabel}
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
      ) : null}

      <div className="archive-toolbar mt-8">
        <div className="flex items-center gap-3 text-slate-400">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          <span>{countText}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-[1rem] border border-white/8 bg-white/4 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn("archive-view-button", view === "grid" && "archive-view-button-active")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
            >
              <Grid2x2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn("archive-view-button", view === "list" && "archive-view-button-active")}
              aria-label="List view"
              aria-pressed={view === "list"}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <label className="archive-sort-select">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(event) => {
                const value = event.target.value as PostSort;
                startTransition(() => setSort(value));
              }}
            >
              <option value="newest">{copy.sortNewestLabel}</option>
              <option value="oldest">{copy.sortOldestLabel}</option>
              <option value="alphabetical">{copy.sortAlphabeticalLabel}</option>
            </select>
          </label>
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div
          className={cn(
            "mt-8 gap-6",
            view === "grid"
              ? cn(
                  "grid md:grid-cols-2",
                  filteredPosts.length < 3 ? "mx-auto max-w-5xl" : "xl:grid-cols-3",
                )
              : "flex flex-col gap-5",
          )}
        >
          {filteredPosts.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blogs/${post.slug}`}
              eyebrow={post.categories[0] ?? copy.cardEyebrowFallback}
              title={post.title}
              description={post.excerpt}
              date={post.publishedAt}
              meta={estimateReadingTime(post.bodyMarkdown)}
              imageUrl={post.coverUrl}
              imageAlt={post.coverAlt}
              layout={view}
              tags={post.tags}
              actionLabel={copy.cardActionLabel}
            />
          ))}
        </div>
      ) : (
        <div className="detail-card mt-10">
          <p className="signal-label">{copy.emptyEyebrow}</p>
          <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
            {copy.emptyHeading}
          </h3>
          <p className="mt-4 text-[0.98rem] leading-8 text-slate-400">
            {copy.emptyDescription}
          </p>
        </div>
      )}
    </section>
  );
}
