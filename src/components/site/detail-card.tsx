import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DetailCardProps {
  eyebrow: string;
  title: string;
  description?: string | null;
  href?: string | null;
  children?: ReactNode;
  className?: string;
}

export function DetailCard({
  eyebrow,
  title,
  description,
  href,
  children,
  className,
}: DetailCardProps) {
  return (
    <section className={cn("detail-card", className)}>
      <p className="signal-label">{eyebrow}</p>
      {href ? (
        <a
          className="mt-5 inline-block font-display text-2xl font-semibold tracking-[-0.05em] text-balance text-foreground transition hover:text-accent-strong"
          href={href}
        >
          {title}
        </a>
      ) : (
        <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.05em] text-balance">
          {title}
        </h2>
      )}
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
