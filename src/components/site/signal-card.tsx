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
    <div className={cn("signal-card", inverse && "signal-card-inverse", className)}>
      <p
        className={cn(
          "font-mono text-[0.66rem] uppercase tracking-[0.24em]",
          inverse ? "text-cyan-200/90" : "text-accent-strong",
        )}
      >
        {eyebrow}
      </p>
      <p
        className={cn(
          "mt-4 font-display tracking-[-0.05em] text-balance",
          inverse ? "text-white" : "text-foreground",
          emphasis === "display"
            ? "text-3xl font-semibold md:text-4xl"
            : "text-xl font-semibold leading-tight md:text-[1.7rem]",
        )}
      >
        {title}
      </p>
      {description ? (
        <p
          className={cn(
            "mt-3 text-sm leading-7",
            inverse ? "text-slate-300" : "text-muted",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
