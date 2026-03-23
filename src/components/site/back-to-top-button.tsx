"use client";

import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  function handleClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/14 bg-slate-950/78 text-white shadow-[0_20px_48px_rgba(2,6,23,0.45)] backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-400/35 hover:bg-slate-900"
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
