"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  signInAction,
  type SignInActionState,
} from "@/features/admin/auth-actions";

const initialState: SignInActionState = {
  error: null,
};

export function LoginForm({ authAvailable }: { authAvailable: boolean }) {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );
  const [email, setEmail] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const authUnavailable = !authAvailable;

  useEffect(() => {
    if (state.error) {
      errorRef.current?.focus();
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="surface-panel rounded-[1.75rem] p-6 md:p-8"
    >
      <div className="mb-7 border-b border-border pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
          Secure session
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">
          Editor sign in
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use the admin account connected to the publishing workspace.
        </p>
      </div>
      {authUnavailable ? (
        <div
          role="alert"
          className="mb-6 rounded-[1.25rem] border border-amber-300/40 bg-amber-50/80 p-4 text-sm leading-7 text-amber-900"
        >
          <p className="font-medium text-amber-950">Admin sign-in is not connected yet.</p>
          <p className="mt-2">
            This local preview is missing `NEXT_PUBLIC_SUPABASE_URL` and
            `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Add them to `.env.local`, restart the dev
            server, then sign in with an admin account.
          </p>
        </div>
      ) : null}

      <div className="space-y-5">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Email
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={authUnavailable}
            className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          Password
          <input
            name="password"
            type="password"
            required
            disabled={authUnavailable}
            className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending || authUnavailable}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/92 disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      {state.error ? (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="mt-4 text-sm text-red-700 focus-visible:outline-none"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
