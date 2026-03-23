import { cn } from "@/lib/utils";

interface SignalCardProps {
  eyebrow: string;
  title: string;
  description?: string | null;
  inverse?: boolean;
  emphasis?: "display" | "title";
  className?: string;
}

export function SignalCard({
  eyebrow,
  title,
  description,
  inverse = false,
  emphasis = "title",
  className,
}: SignalCardProps) {
  return (
    <div
      className={cn(
        "signal-card",
        inverse && "signal-card-inverse",
        className,
      )}
    >
      <p
        className={cn(
          "font-mono text-[0.7rem] uppercase tracking-[0.24em]",
          inverse ? "text-sky-200" : "text-slate-400",
        )}
      >
        {eyebrow}
      </p>
      <p
        className={cn(
          "mt-4 font-display tracking-[-0.04em] text-balance",
          inverse ? "text-white" : "text-slate-50",
          emphasis === "display"
            ? "text-[1.8rem] font-semibold md:text-[2.15rem]"
            : "text-[1.65rem] font-semibold leading-tight",
        )}
      >
        {title}
      </p>
      {description ? (
        <p
          className={cn(
            "mt-2.5 text-[0.93rem] leading-7",
            inverse ? "text-slate-300" : "text-slate-400",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
