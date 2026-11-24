"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
      <div className="surface-panel rounded-[2rem] p-8 md:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
          Page interrupted
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.05em] text-balance">
          Something did not load as expected.
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">
          Your work has not been changed by this page error. Try again, or return to
          the previous page if the problem continues.
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
    </main>
  );
}
