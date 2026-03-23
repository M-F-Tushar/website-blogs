"use client";

import { useState, startTransition } from "react";

import { cn } from "@/lib/utils";

interface NewsletterSignupProps {
  compact?: boolean;
  className?: string;
}

export function NewsletterSignup({
  compact = false,
  className,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      setMessage(
        email.trim()
          ? "Subscription is coming soon. For now, use the contact page for updates."
          : "Enter an email first, then I can keep the spot ready for launch.",
      );
    });
  }

  return (
    <form className={cn("space-y-3", className)} onSubmit={handleSubmit}>
      <div
        className={cn(
          "flex gap-3",
          compact ? "flex-col" : "flex-col sm:flex-row sm:items-center",
        )}
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/40 focus:bg-white/8"
        />
        <button
          type="submit"
          className={cn(
            "rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400",
            compact && "w-full",
          )}
        >
          Subscribe
        </button>
      </div>
      {message ? <p className="text-sm text-slate-400">{message}</p> : null}
    </form>
  );
}
