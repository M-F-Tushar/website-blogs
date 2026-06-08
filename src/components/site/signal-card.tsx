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
        "relative overflow-hidden rounded-[1.5rem] border p-6 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1",
        inverse 
          ? "border-sky-500/20 bg-sky-500/10 hover:border-sky-400/40 hover:bg-sky-400/10" 
          : "border-border dark:border-white/10 bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] hover:border-sky-500/20 hover:shadow-[0_10px_30px_rgba(14,165,233,0.15)]",
        className,
      )}
    >
      <p
        className={cn(
          "font-mono text-[0.7rem] uppercase tracking-[0.24em]",
          inverse ? "text-sky-200" : "text-muted dark:text-slate-400",
        )}
      >
        {eyebrow}
      </p>
      <p
        className={cn(
          "mt-4 font-display tracking-[-0.04em] text-balance",
          inverse ? "text-foreground dark:text-white" : "text-slate-50",
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
            inverse ? "text-muted dark:text-slate-300" : "text-muted dark:text-slate-400",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
