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
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-[0.8rem] font-semibold uppercase tracking-widest text-sky-300 backdrop-blur-md",
            align === "center" && "justify-center",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-6 font-display text-[2.8rem] font-bold leading-[1.05] tracking-[-0.04em] text-white md:text-[3.6rem]">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-[1.05rem] leading-8 text-slate-300 md:text-[1.15rem]",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
