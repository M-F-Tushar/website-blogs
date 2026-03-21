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
      className="surface-panel group relative flex h-full flex-col rounded-[1.5rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_24px_90px_rgba(13,21,32,0.09)]"
    >
      <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
        {eyebrow}
      </p>
      <h3 className="mt-5 font-display text-2xl leading-tight font-semibold tracking-[-0.04em] text-balance">
        {title}
      </h3>
      <p className="mt-4 flex-1 text-sm leading-7 text-muted">{description}</p>
      <div className="mt-6 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-muted">
        <span>{date ? formatDisplayDate(date) : meta ?? "Open entry"}</span>
        <span className="text-accent transition group-hover:translate-x-1">Explore</span>
      </div>
    </Link>
  );
}
