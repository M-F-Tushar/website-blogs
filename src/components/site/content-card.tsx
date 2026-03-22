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
      className="surface-panel group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] transition duration-300 hover:-translate-y-1.5 hover:border-border-strong hover:shadow-[0_28px_90px_rgba(9,21,33,0.14)]"
    >
      <div className="absolute inset-x-6 top-0 z-10 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      {imageUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top,_rgba(118,196,255,0.18),_rgba(255,255,255,0)_65%)]">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,18,28,0.16)] via-transparent to-transparent" />
        </div>
      ) : null}
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="signal-label">{eyebrow}</p>
          <span className="inline-flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_16px_rgba(27,154,209,0.55)]" />
            indexed
          </span>
        </div>
        <h3 className="mt-7 font-display text-2xl leading-tight font-semibold tracking-[-0.05em] text-balance">
          {title}
        </h3>
        <p className="mt-4 flex-1 text-sm leading-7 text-muted">
          {description ?? "Open this entry to review the full note, rationale, and linked work."}
        </p>
        <div className="mt-7 flex items-center justify-between gap-3 border-t border-border/70 pt-5 text-xs uppercase tracking-[0.22em] text-muted">
          <span>{date ? formatDisplayDate(date) : meta ?? "Open entry"}</span>
          <span className="text-accent transition group-hover:translate-x-1">Explore node</span>
        </div>
      </div>
    </Link>
  );
}
