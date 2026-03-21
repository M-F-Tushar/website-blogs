import Link from "next/link";

import { formatDisplayDate } from "@/lib/utils";

interface ContentCardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string | null;
  date?: string | null;
  meta?: string | null;
}

export function ContentCard({
  href,
  eyebrow,
  title,
  description,
  date,
  meta,
}: ContentCardProps) {
  return (
    <Link
      href={href}
      className="surface-panel group relative flex h-full flex-col rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1.5 hover:border-border-strong hover:shadow-[0_28px_90px_rgba(9,21,33,0.14)]"
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
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
    </Link>
  );
}
