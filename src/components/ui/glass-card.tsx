import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all hover:bg-white/10",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
