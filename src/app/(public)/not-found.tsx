import Link from "next/link";

export default function PublicNotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
        404 · Route not found
      </p>
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-[-0.05em] text-foreground dark:text-white">
        This page is outside the current map.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-8 text-muted dark:text-slate-300">
        The address may have moved, or the content has not been published yet.
        Return to the public index to continue exploring.
      </p>
      <Link
        href="/"
        prefetch={false}
        className="mt-8 inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold !text-slate-950 transition hover:bg-sky-400"
      >
        Return home
      </Link>
    </section>
  );
}
