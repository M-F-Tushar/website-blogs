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
            "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-[0.8rem] text-slate-300",
            align === "center" && "justify-center",
          )}
        >
          <span className="text-sky-400">✦</span>
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-5 font-display text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white md:text-[3.45rem]">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-300 md:text-[1.04rem]",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
