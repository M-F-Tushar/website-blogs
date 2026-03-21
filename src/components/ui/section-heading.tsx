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
        <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
          <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_18px_rgba(27,154,209,0.45)]" />
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-accent-strong">
            {eyebrow}
          </p>
          <span className="h-px w-16 bg-gradient-to-r from-accent/70 to-transparent" />
        </div>
      ) : null}
      <h2 className="mt-5 font-display text-3xl leading-tight font-semibold tracking-[-0.05em] text-balance md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
