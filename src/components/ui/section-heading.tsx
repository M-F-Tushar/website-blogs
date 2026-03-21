import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string | null;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-4 font-display text-3xl leading-tight font-semibold tracking-[-0.04em] text-balance md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-8 text-muted md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
