"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  code: string;
  children: React.ReactNode;
}

function subscribe() {
  return () => {};
}

function getClipboardSupport() {
  return Boolean(navigator.clipboard?.writeText);
}

function getServerClipboardSupport() {
  return false;
}

export function CodeBlock({ language, code, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const canCopy = useSyncExternalStore(
    subscribe,
    getClipboardSupport,
    getServerClipboardSupport,
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(t);
    } catch {
      setCopied(false);
    }
  }, [code]);

  return (
    <div className="group relative my-8 overflow-hidden rounded-xl border border-border dark:border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/5 bg-black/[0.02] dark:bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-700/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-slate-700/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-slate-700/50" />
          </div>
          {language ? (
            <span className="ml-2 font-mono text-[0.7rem] font-medium uppercase tracking-wider text-muted dark:text-slate-400">
              {language}
            </span>
          ) : null}
        </div>
        {canCopy ? (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted dark:text-slate-400 opacity-0 transition-all duration-200 hover:bg-black/5 dark:bg-white/5 hover:text-muted dark:text-slate-200 focus:opacity-100 group-hover:opacity-100"
            aria-label={copied ? "Code copied" : "Copy code to clipboard"}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden />
                <span>Copy</span>
              </>
            )}
          </button>
        ) : null}
      </div>
      <div className="overflow-x-auto p-4 text-[0.85rem] leading-relaxed text-muted dark:text-slate-300 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
        {children}
      </div>
    </div>
  );
}
