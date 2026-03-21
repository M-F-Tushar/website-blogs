"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      setError("Supabase is not configured for browser auth.");
      setIsSubmitting(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <form className="surface-panel rounded-[1.75rem] p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/92 disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
