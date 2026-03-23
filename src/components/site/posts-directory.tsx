"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { Grid2x2, List, Search, SlidersHorizontal } from "lucide-react";

import { ContentCard } from "@/components/site/content-card";
import type { PostSummary } from "@/types/content";
import { cn, estimateReadingTime } from "@/lib/utils";

interface PostsDirectoryProps {
  posts: PostSummary[];
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

export function PostsDirectory({ posts }: PostsDirectoryProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PostSort>("newest");
  const [view, setView] = useState<DirectoryView>("grid");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredPosts = sortPosts(
    posts.filter((post) => {
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

  return (
    <section className="mt-12">
      <div className="page-filter-shell">
        <div className="page-search-wrap" id="search">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              startTransition(() => setQuery(value));
            }}
            placeholder="Search articles..."
            className="page-search-input"
          />
        </div>
      </div>

      <div className="archive-toolbar mt-10">
        <div className="flex items-center gap-3 text-slate-400">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Showing {filteredPosts.length} posts</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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

          <label className="inline-flex items-center gap-3 rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(event) => {
                const value = event.target.value as PostSort;
                startTransition(() => setSort(value));
              }}
              className="bg-transparent text-white outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </label>
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div
          className={cn(
            "mt-8 gap-6",
            view === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-5",
          )}
        >
          {filteredPosts.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blogs/${post.slug}`}
              eyebrow={post.categories[0] ?? "Article"}
              title={post.title}
              description={post.excerpt}
              date={post.publishedAt}
              meta={estimateReadingTime(post.bodyMarkdown)}
              imageUrl={post.coverUrl}
              imageAlt={post.coverAlt}
              layout={view}
              tags={post.tags}
              actionLabel="Read Article"
            />
          ))}
        </div>
      ) : (
        <div className="detail-card mt-10">
          <p className="signal-label">Archive status</p>
          <h3 className="mt-5 font-display text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
            No articles match that search
          </h3>
          <p className="mt-4 text-[0.98rem] leading-8 text-slate-400">
            Try a title keyword, a tag, or a category term to surface the post you want.
          </p>
        </div>
      )}
    </section>
  );
}
