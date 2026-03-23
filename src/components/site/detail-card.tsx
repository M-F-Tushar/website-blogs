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
          className="mt-4 inline-block font-display text-[1.8rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white transition hover:text-sky-300 md:text-[1.95rem]"
          href={href}
        >
          {title}
        </a>
      ) : (
        <h2 className="mt-4 font-display text-[1.8rem] font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-[1.95rem]">
          {title}
        </h2>
      )}
      {description ? (
        <p className="mt-3 max-w-3xl text-[0.96rem] leading-7 text-slate-400">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
