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
      <p className="text-sm leading-7 text-slate-400">
        The newsletter is not live yet, so this site points you to real ways to stay in touch instead of collecting emails without a working pipeline.
      </p>
      <div
        className={cn(
          "flex gap-3",
          compact ? "flex-col" : "flex-col sm:flex-row sm:flex-wrap sm:items-center",
        )}
      >
        <Link
          href="/contact"
          className={cn(
            "rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400",
            compact && "w-full",
          )}
        >
          Contact Me
        </Link>
        <Link
          href="/blogs"
          className={cn(
            "rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/8",
            compact && "w-full text-center",
          )}
        >
          Read Latest Posts
        </Link>
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}`}
            className={cn(
              "rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/8",
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
