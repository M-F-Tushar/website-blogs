"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface NewsletterSignupProps {
  compact?: boolean;
  className?: string;
  contactEmail?: string;
}

export function NewsletterSignup({
  compact = false,
  className,
  contactEmail,
}: NewsletterSignupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm leading-7 text-muted dark:text-slate-400">
        The newsletter is not live yet, so this site points you to real ways to stay in touch instead of collecting emails without a working pipeline.
      </p>
      <div
        className={cn(
          "flex gap-4 justify-center",
          compact ? "flex-col" : "flex-col sm:flex-row sm:flex-wrap sm:items-center",
        )}
      >
        <Link
          href="/contact"
          className={cn(
            "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-sky-500 px-8 py-3.5 text-sm font-semibold text-foreground dark:text-white shadow-[0_0_30px_-10px_rgba(14,165,233,0.5)] transition-all duration-300 hover:scale-105 hover:bg-sky-400 hover:shadow-[0_0_40px_-15px_rgba(14,165,233,0.7)]",
            compact && "w-full",
          )}
        >
          <span className="relative z-10 flex items-center gap-2">Contact Me</span>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[150%] skew-x-[-20deg] transition-transform duration-700 group-hover:translate-x-[150%]" />
        </Link>
        <Link
          href="/blogs"
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/60 px-8 py-3.5 text-sm font-semibold text-foreground dark:text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-slate-700/80 hover:border-slate-500/80",
            compact && "w-full text-center",
          )}
        >
          Read Latest Posts
        </Link>
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}`}
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/60 px-8 py-3.5 text-sm font-semibold text-foreground dark:text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-slate-700/80 hover:border-slate-500/80",
              compact && "w-full text-center",
            )}
          >
            Email Directly
          </a>
        ) : null}
      </div>
    </div>
  );
}
