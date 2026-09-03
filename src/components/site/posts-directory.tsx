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

const PAGE_SIZE = 12;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  // Reset pagination during render when any filter changes.
  const filterKey = `${deferredQuery}|${activeCategory}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

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
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <section className="mt-16">
      <div className="relative group rounded-[1.5rem] bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-2 shadow-lg backdrop-blur-xl border border-border dark:border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-500/30 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)] focus-within:bg-[rgba(15,23,42,0.7)] focus-within:border-sky-400/50 focus-within:shadow-[0_12px_40px_rgba(14,165,233,0.2)]">
        <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-sky-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative z-10 flex items-center gap-4 px-4 py-3">
          <Search className="h-5 w-5 text-muted dark:text-slate-400 transition-colors duration-300 group-focus-within:text-sky-400" aria-hidden />
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

      {categories.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setActiveCategory(copy.filterAllLabel)}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-1.5 text-[0.85rem] font-semibold uppercase tracking-widest transition-all duration-300 backdrop-blur-md",
              activeCategory === copy.filterAllLabel
                ? "border-sky-400/40 bg-sky-500/20 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                : "border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] text-muted dark:text-slate-400 hover:border-white/20 hover:text-muted dark:text-slate-200 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)]"
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
                "inline-flex items-center rounded-full border px-4 py-1.5 text-[0.85rem] font-semibold uppercase tracking-widest transition-all duration-300 backdrop-blur-md",
                activeCategory === category
                  ? "border-sky-400/40 bg-sky-500/20 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                  : "border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] text-muted dark:text-slate-400 hover:border-white/20 hover:text-muted dark:text-slate-200 hover:bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)]"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-border dark:border-white/10 pb-6">
        <div className="flex items-center gap-2.5 text-sm font-medium text-muted dark:text-slate-400">
          <SlidersHorizontal className="h-4 w-4 text-muted dark:text-slate-500" aria-hidden />
          <span>{countText}</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="inline-flex items-center rounded-xl border border-border dark:border-white/10 bg-slate-900/50 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all",
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
                "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all",
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

          <label className="flex items-center gap-3 text-sm">
            <span className="text-muted dark:text-slate-500">Sort by</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(event) => {
                  const value = event.target.value as PostSort;
                  startTransition(() => setSort(value));
                }}
                className="appearance-none rounded-lg border border-border dark:border-white/10 bg-slate-900/50 py-1.5 pl-3 pr-8 font-medium text-muted dark:text-slate-300 transition-colors hover:border-white/20 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
              >
                <option value="newest">{copy.sortNewestLabel}</option>
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
      </div>

      {filteredPosts.length > 0 ? (
        <>
          <div
            className={cn(
              "mt-8 gap-6",
              view === "grid"
                ? cn(
                    "grid md:grid-cols-2",
                    visiblePosts.length < 3 ? "mx-auto max-w-5xl" : "xl:grid-cols-3",
                  )
                : "flex flex-col gap-5",
            )}
          >
            {visiblePosts.map((post) => (
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
          {filteredPosts.length > visiblePosts.length ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="inline-flex items-center gap-2 rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-6 py-3 text-sm font-semibold text-muted dark:text-slate-200 backdrop-blur-md transition-all hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-foreground dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                Load more articles
                <span className="text-xs text-muted dark:text-slate-400">
                  ({filteredPosts.length - visiblePosts.length} remaining)
                </span>
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="group relative mt-12 overflow-hidden rounded-[2rem] border border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] p-10 text-center shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-[rgba(15,23,42,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.1),transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
