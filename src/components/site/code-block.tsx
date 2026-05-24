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
    <div className="code-block-shell">
      <div className="code-block-header">
        <span>{language ?? "code"}</span>
        {canCopy ? (
          <button
            type="button"
            onClick={handleCopy}
            data-copied={copied ? "true" : "false"}
            className="code-copy-button"
            aria-label={copied ? "Code copied" : "Copy code to clipboard"}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden />
                Copy
              </>
            )}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
