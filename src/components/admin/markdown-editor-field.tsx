"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, FileCode2, ImageIcon, ListChecks, PencilLine, Table2 } from "lucide-react";

import { Markdown } from "@/components/site/markdown";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types/content";

type ComposerVariant = "post" | "academic" | "recommendation" | "section";
type ComposerTab = "write" | "preview" | "guide";

interface MarkdownEditorFieldProps {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  placeholder?: string;
  minHeightClassName?: string;
  assets?: MediaAsset[];
  variant?: ComposerVariant;
  required?: boolean;
}

const guideItems = [
  "Code fences work with language labels like ```ts, ```python, or ```sql.",
  "Tables, task lists, blockquotes, links, and strikethrough are enabled through GitHub-flavored Markdown.",
  "Embedded images use standard markdown image syntax and can be inserted from the media library.",
  "Diagrams can be written with ```mermaid fenced blocks and render on the public site.",
  "Raw HTML embeds are intentionally not supported for production safety.",
];

const templatesByVariant: Record<ComposerVariant, Array<{ label: string; snippet: string }>> = {
  post: [
    {
      label: "Post scaffold",
      snippet: `## Why this matters\n\nWrite the problem, tension, or learning goal.\n\n## What I tried\n\n- Attempt one\n- Attempt two\n- Key tradeoff\n\n## What changed my understanding\n\nCapture the technical shift or insight.\n\n## Next steps\n\n- Follow-up experiment\n- Open question\n`,
    },
    {
      label: "Code example",
      snippet: "```ts\nexport function example() {\n  return \"replace me\";\n}\n```\n",
    },
  ],
  academic: [
    {
      label: "Research note",
      snippet: `## Context\n\nWhat paper, course, or experiment is this tied to?\n\n## Core idea\n\nSummarize the mechanism or argument.\n\n## Evidence and observations\n\n- Observation one\n- Observation two\n- Limitation or open question\n\n## Follow-up experiment\n\nDescribe the next thing to test.\n`,
    },
    {
      label: "Paper summary table",
      snippet: "| Section | Notes |\n| --- | --- |\n| Problem |  |\n| Method |  |\n| Results |  |\n| Questions |  |\n",
    },
  ],
  recommendation: [
    {
      label: "Recommendation rationale",
      snippet: `## Why it earns a place\n\nExplain the real value.\n\n## Where it helps most\n\n- Situation one\n- Situation two\n\n## Cautions\n\nWhat should a reader know before using it?\n`,
    },
  ],
  section: [
    {
      label: "Section scaffold",
      snippet: `## Framing\n\nState the purpose of this section.\n\n## Detail\n\nAdd the supporting explanation or context.\n`,
    },
  ],
};

export function MarkdownEditorField({
  name,
  label,
  defaultValue = "",
  hint,
  placeholder = "Write markdown here...",
  minHeightClassName = "min-h-[22rem]",
  assets = [],
  variant = "post",
  required,
}: MarkdownEditorFieldProps) {
  const [content, setContent] = useState(defaultValue);
  const [tab, setTab] = useState<ComposerTab>("write");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const publicAssets = useMemo(
    () => assets.filter((asset) => Boolean(asset.publicUrl)),
    [assets],
  );
  const selectedAsset =
    publicAssets.find((asset) => asset.id === selectedAssetId) ?? null;

  useEffect(() => {
    setContent(defaultValue);
  }, [defaultValue]);

  function updateContent(
    builder: (current: string, start: number, end: number, selected: string) => {
      nextValue: string;
      selectionStart?: number;
      selectionEnd?: number;
    },
  ) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const selected = content.slice(start, end);
    const { nextValue, selectionStart, selectionEnd } = builder(
      content,
      start,
      end,
      selected,
    );

    setContent(nextValue);
    setTab("write");

    requestAnimationFrame(() => {
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(
        selectionStart ?? nextValue.length,
        selectionEnd ?? selectionStart ?? nextValue.length,
      );
    });
  }

  function wrapSelection(prefix: string, suffix = prefix, fallback = "text") {
    updateContent((current, start, end, selected) => {
      const selection = selected || fallback;
      const nextValue =
        current.slice(0, start) +
        prefix +
        selection +
        suffix +
        current.slice(end);
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + selection.length;

      return {
        nextValue,
        selectionStart: cursorStart,
        selectionEnd: cursorEnd,
      };
    });
  }

  function insertSnippet(snippet: string) {
    updateContent((current, start, end) => ({
      nextValue: `${current.slice(0, start)}${snippet}${current.slice(end)}`,
      selectionStart: start + snippet.length,
      selectionEnd: start + snippet.length,
    }));
  }

  function insertHeading() {
    insertSnippet("## New section\n\n");
  }

  function insertCodeBlock() {
    insertSnippet("```ts\n// Add code here\n```\n");
  }

  function insertTable() {
    insertSnippet("| Column | Notes |\n| --- | --- |\n| Item | Detail |\n");
  }

  function insertChecklist() {
    insertSnippet("- [ ] First step\n- [ ] Second step\n");
  }

  function insertMermaidDiagram() {
    insertSnippet(
      "```mermaid\nflowchart TD\n  A[Question] --> B[Experiment]\n  B --> C[Result]\n```\n",
    );
  }

  function insertSelectedImage() {
    if (!selectedAsset?.publicUrl) {
      return;
    }

    const altText = selectedAsset.altText ?? selectedAsset.label ?? "Embedded image";
    insertSnippet(`![${altText}](${selectedAsset.publicUrl})\n`);
  }

  const templates = templatesByVariant[variant];

  return (
    <div className="flex flex-col gap-3 text-sm text-muted">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-medium text-foreground">{label}</span>
          {hint ? <p className="mt-1 text-xs leading-6 text-muted">{hint}</p> : null}
        </div>
        <div className="admin-tab-strip">
          {([
            { value: "write", label: "Write", icon: PencilLine },
            { value: "preview", label: "Preview", icon: Eye },
            { value: "guide", label: "Guide", icon: FileCode2 },
          ] as const).map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={cn(
                  "admin-tab-button",
                  tab === item.value && "admin-tab-button-active",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="admin-editor-shell">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/8 p-3">
          <button type="button" className="admin-toolbar-button" onClick={insertHeading}>
            H2
          </button>
          <button
            type="button"
            className="admin-toolbar-button"
            onClick={() => wrapSelection("**", "**", "Bold text")}
          >
            Bold
          </button>
          <button
            type="button"
            className="admin-toolbar-button"
            onClick={() => wrapSelection("*", "*", "Italic text")}
          >
            Italic
          </button>
          <button
            type="button"
            className="admin-toolbar-button"
            onClick={() => wrapSelection("[", "](https://example.com)", "Useful link")}
          >
            Link
          </button>
          <button type="button" className="admin-toolbar-button" onClick={insertCodeBlock}>
            <FileCode2 className="h-4 w-4" />
            Code
          </button>
          <button type="button" className="admin-toolbar-button" onClick={insertTable}>
            <Table2 className="h-4 w-4" />
            Table
          </button>
          <button type="button" className="admin-toolbar-button" onClick={insertChecklist}>
            <ListChecks className="h-4 w-4" />
            Checklist
          </button>
          <button
            type="button"
            className="admin-toolbar-button"
            onClick={insertMermaidDiagram}
          >
            Diagram
          </button>
        </div>

        <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            {tab === "write" ? (
              <textarea
                ref={textareaRef}
                name={name}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className={cn("admin-editor-textarea", minHeightClassName)}
                placeholder={placeholder}
                required={required}
                spellCheck={false}
              />
            ) : null}

            {tab === "preview" ? (
              <div className="theme-blogsite rounded-[1.5rem] border border-white/8 bg-[#0b1220] p-5">
                {content.trim().length > 0 ? (
                  <Markdown content={content} className="markdown-inverse" />
                ) : (
                  <p className="text-sm text-slate-400">
                    Nothing to preview yet. Start writing in markdown.
                  </p>
                )}
              </div>
            ) : null}

            {tab === "guide" ? (
              <div className="rounded-[1.5rem] border border-border bg-white/55 p-5">
                <p className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
                  Markdown features in this admin
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
                  {guideItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="mt-5 rounded-[1.2rem] border border-border bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">
                  {"```mermaid\nflowchart LR\n  Idea --> Draft --> Publish\n```"}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.4rem] border border-border bg-white/55 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted">
                Templates
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {templates.map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    className="admin-template-button"
                    onClick={() => insertSnippet(template.snippet)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-border bg-white/55 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted">
                Media embeds
              </p>
              <div className="mt-3 space-y-3">
                <select
                  value={selectedAssetId}
                  onChange={(event) => setSelectedAssetId(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
                >
                  <option value="">Choose a public asset</option>
                  {publicAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.label ?? asset.objectPath}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-template-button w-full justify-center"
                  onClick={insertSelectedImage}
                  disabled={!selectedAsset}
                >
                  <ImageIcon className="h-4 w-4" />
                  Insert image markdown
                </button>
                <p className="text-xs leading-6 text-muted">
                  Embedded images use the public URL from the media library, so they stay aligned
                  with the production asset host.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
