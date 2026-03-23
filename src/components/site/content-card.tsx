import Image from "next/image";
import Link from "next/link";

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
  const visibleTags = tags.filter(Boolean).slice(0, isList ? 4 : 3);

  return (
    <Link
      href={href}
      className={cn(
        "content-card-shell group relative flex h-full min-h-[19rem] flex-col overflow-hidden rounded-[1.45rem] border border-white/7 transition duration-300 hover:-translate-y-1 hover:border-sky-400/20 hover:shadow-[0_24px_68px_rgba(2,8,23,0.32)]",
        isFeatured && !isList && "min-h-[22rem]",
        isList &&
          "min-h-0 gap-0 md:grid md:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.28),transparent_58%),linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95))]",
          isList
            ? "aspect-[16/11] min-h-[13rem] border-b border-white/6 md:h-full md:min-h-full md:border-b-0 md:border-r"
            : "h-44 border-b border-white/6 md:h-48",
          isFeatured && !isList && "h-56 md:h-64",
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            sizes={
              isList
                ? "(max-width: 768px) 100vw, 280px"
                : isFeatured
                  ? "(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 44vw"
                  : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 30vw"
            }
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(56,189,248,0.28),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(168,85,247,0.2),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.65),rgba(15,23,42,0.92))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,6,23,0.88)] via-[rgba(2,6,23,0.18)] to-transparent" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 md:inset-x-5 md:top-5">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-950/55 px-3 py-1.5 text-[0.72rem] text-slate-200 backdrop-blur">
            {eyebrow}
          </span>
          {meta ? (
            <span className="inline-flex items-center rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-[0.7rem] text-slate-300">
              {meta}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5 md:px-6 md:py-5">
        <div className="flex flex-wrap items-center gap-2 text-[0.76rem] text-slate-400">
          {date ? (
            <span className="inline-flex items-center rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
              {formatDisplayDate(date)}
            </span>
          ) : null}
          {meta && !imageUrl ? (
            <span className="inline-flex items-center rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
              {meta}
            </span>
          ) : null}
        </div>

        <h3
          className={cn(
            "mt-3.5 font-display font-semibold leading-[1.04] tracking-[-0.04em] text-white text-balance",
            isFeatured && !isList && "text-[2.2rem] md:text-[2.5rem]",
            !isFeatured && !isList && "line-clamp-3 text-[1.7rem] md:text-[1.9rem]",
            isList && "text-[2rem] md:text-[2.15rem]",
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "mt-3.5 flex-1 text-[0.95rem] leading-7 text-slate-300",
            isList ? "line-clamp-5" : "line-clamp-3 min-h-[4.25rem] md:min-h-[6.1rem]",
          )}
        >
          {description ?? "Open this entry to explore the full piece."}
        </p>

        <div className={cn("mt-4", !isList && "min-h-[2.5rem]")}>
          {visibleTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-[0.72rem] text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-sm text-slate-200">
          <span>{actionLabel}</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
