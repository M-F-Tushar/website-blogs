"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
      <div className="surface-panel rounded-[2rem] p-8 md:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
          Runtime error
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.05em] text-balance">
          The content backend is unavailable.
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">
          This environment is configured to fail loudly instead of silently showing
          demo content. Check the Supabase connection, environment variables, and
          public read access, then retry.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/92"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
