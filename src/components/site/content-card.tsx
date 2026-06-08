import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn, formatDisplayDate } from "@/lib/utils";

interface ContentCardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string | null;
  date?: string | null;
  meta?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  size?: "default" | "feature";
  layout?: "grid" | "list";
  tags?: string[];
  actionLabel?: string;
  className?: string;
}

export function ContentCard({
  href,
  eyebrow,
  title,
  description,
  date,
  meta,
  imageUrl,
  imageAlt,
  size = "default",
  layout = "grid",
  tags = [],
  actionLabel = "Read Article",
  className,
}: ContentCardProps) {
  const isFeatured = size === "feature";
  const isList = layout === "list";
  const hasImage = Boolean(imageUrl);
  const visibleTags = tags.filter(Boolean).slice(0, isList ? 4 : 3);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-slate-900/40 border border-border dark:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:bg-slate-900/60 hover:shadow-[0_8px_32px_rgba(14,165,233,0.1)]",
        isList &&
          hasImage &&
          "min-h-0 gap-0 md:grid md:grid-cols-[minmax(200px,280px)_minmax(0,1fr)]",
        className,
      )}
    >
      {(!isList || hasImage) ? (
        <div
          className={cn(
            "relative overflow-hidden bg-slate-950/50",
            isList
              ? "aspect-[16/10] min-h-[12rem] border-b border-border dark:border-white/10 md:h-full md:min-h-full md:border-b-0 md:border-r"
              : hasImage
                ? "h-48 border-b border-border dark:border-white/10 md:h-52"
                : "h-20 border-b border-border dark:border-white/10",
            isFeatured && !isList && hasImage && "h-56 md:h-64",
            isFeatured && !isList && !hasImage && "h-24",
          )}
        >
          {hasImage ? (
            <Image
              src={imageUrl ?? ""}
              alt={imageAlt ?? title}
              fill
              sizes={
                isList
                  ? "(max-width: 768px) 100vw, 320px"
                  : isFeatured
                    ? "(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 44vw"
                    : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 30vw"
              }
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.15),transparent_50%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
          <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[0.7rem] font-medium tracking-wide text-muted dark:text-slate-200 backdrop-blur-md">
              {eyebrow}
            </span>
            {meta ? (
              <span className="inline-flex items-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-1 text-[0.65rem] font-medium tracking-wider uppercase text-muted dark:text-slate-300 backdrop-blur-md">
                {meta}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={cn("flex flex-1 flex-col", isList ? "p-6 md:p-8 md:justify-center" : "p-6")}>
        <div className="flex flex-wrap items-center gap-3 text-[0.75rem] font-medium tracking-wide text-muted dark:text-slate-400">
          {isList && !hasImage ? (
            <span className="inline-flex items-center rounded-full border border-border dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 text-muted dark:text-slate-300">
              {eyebrow}
            </span>
          ) : null}
          {date ? (
            <time dateTime={date} className="text-muted dark:text-slate-400/80">
              {formatDisplayDate(date)}
            </time>
          ) : null}
          {meta && !imageUrl ? (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-muted dark:text-slate-400/80">{meta}</span>
            </>
          ) : null}
        </div>

        <h3
          className={cn(
            "mt-4 font-display font-semibold text-foreground dark:text-slate-100 transition-colors duration-300 group-hover:text-sky-300",
            isFeatured && !isList ? "text-3xl leading-tight" : "text-xl leading-snug md:text-2xl",
            isList && "text-2xl leading-snug md:text-3xl",
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "mt-4 flex-1 text-[0.95rem] leading-relaxed text-muted dark:text-slate-400",
            isList ? "line-clamp-3" : "line-clamp-3",
          )}
        >
          {description ?? "Open this entry to explore the full piece."}
        </p>

        <div className={cn("mt-6 flex items-end justify-between gap-4", !isList && "mt-auto pt-6")}>
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-slate-800/50 px-2 py-1 text-[0.7rem] font-medium text-muted dark:text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          <div className="inline-flex items-center gap-1 text-[0.8rem] font-semibold text-muted dark:text-slate-300 transition-colors duration-300 group-hover:text-sky-400">
            {actionLabel}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
