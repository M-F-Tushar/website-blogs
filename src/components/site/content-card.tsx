import Image from "next/image";
import Link from "next/link";

import { formatDisplayDate } from "@/lib/utils";

interface ContentCardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string | null;
  date?: string | null;
  meta?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
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
}: ContentCardProps) {
  return (
    <Link
      href={href}
      className="content-card-shell group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] transition duration-300 hover:-translate-y-1.5 hover:border-border-strong hover:shadow-[0_28px_90px_rgba(9,21,33,0.14)]"
    >
      {imageUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top,_rgba(118,196,255,0.18),_rgba(255,255,255,0)_65%)]">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,18,28,0.28)] via-[rgba(6,18,28,0.04)] to-transparent" />
          <div className="absolute inset-x-5 bottom-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-[rgba(8,20,31,0.62)] px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(141,227,255,0.55)]" />
              {eyebrow}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
              indexed
            </span>
          </div>
        </div>
      ) : null}
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between gap-4">
          {!imageUrl ? <p className="signal-label">{eyebrow}</p> : <span />}
          {!imageUrl ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/60 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_16px_rgba(27,154,209,0.55)]" />
              indexed
            </span>
          ) : null}
        </div>
        <div className="mt-6 flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted">
          <span className="h-px flex-1 bg-gradient-to-r from-accent/70 to-transparent" />
          <span>{date ? formatDisplayDate(date) : meta ?? "Open entry"}</span>
        </div>
        <h3 className="mt-5 line-clamp-3 font-display text-2xl leading-tight font-semibold tracking-[-0.05em] text-balance">
          {title}
        </h3>
        <p className="mt-4 line-clamp-4 flex-1 text-sm leading-7 text-muted">
          {description ?? "Open this entry to review the full note, rationale, and linked work."}
        </p>
        <div className="mt-7 flex items-center justify-between gap-3 border-t border-border/70 pt-5 text-xs uppercase tracking-[0.22em] text-muted">
          <span>{eyebrow}</span>
          <span className="text-accent transition group-hover:translate-x-1">Explore node</span>
        </div>
      </div>
    </Link>
  );
}
