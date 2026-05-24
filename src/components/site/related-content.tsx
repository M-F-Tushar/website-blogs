import Link from "next/link";

interface RelatedContentProps {
  eyebrow: string;
  heading: string;
  description?: string | null;
  ctaLabel: string;
  ctaHref: string;
}

export function RelatedContent({
  eyebrow,
  heading,
  description,
  ctaLabel,
  ctaHref,
}: RelatedContentProps) {
  return (
    <footer className="mt-14 border-t border-white/8 pt-8">
      <p className="detail-eyebrow">{eyebrow}</p>
      <div className="detail-footer-card mt-4">
        <div>
          <h2 className="font-display text-[1.8rem] font-semibold leading-tight tracking-[-0.04em] text-white">
            {heading}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
          ) : null}
        </div>
        <Link
          href={ctaHref}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {ctaLabel}
        </Link>
      </div>
    </footer>
  );
}
