import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { ExternalLink, Link2, Quote } from "lucide-react";

import { createArticleHeadingIdGenerator } from "@/lib/content/article-outline";
import { CodeBlock } from "@/components/site/code-block";
import { MermaidDiagram } from "@/components/site/mermaid-diagram";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

const MERMAID_BLOCK_PATTERN = /(^|\n)\s*```\s*mermaid\b/;

function getNodeTextContent(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (!isValidElement(child)) {
        return "";
      }

      return getNodeTextContent((child.props as { children?: ReactNode }).children);
    })
    .join("")
    .trim();
}

function findCodeChild(node: ReactNode): {
  code: string;
  language: string | null;
} | null {
  const arr = Children.toArray(node);
  for (const child of arr) {
    if (isValidElement(child)) {
      const props = child.props as {
        className?: string;
        children?: ReactNode;
      };
      const match = /language-([\w-]+)/.exec(props.className ?? "");
      if (match) {
        return {
          code: getNodeTextContent(props.children),
          language: match[1].toLowerCase(),
        };
      }
    }
  }
  return null;
}

function HeadingAnchor({ id, label }: { id: string; label: string }) {
  return (
    <a
      href={`#${id}`}
      className="heading-anchor ml-2 inline-flex opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100"
      aria-label={`Link to section: ${label}`}
    >
      <Link2 className="h-5 w-5 text-sky-400/70 hover:text-sky-300" aria-hidden />
    </a>
  );
}

export function Markdown({ content, className }: MarkdownProps) {
  const nextHeadingId = createArticleHeadingIdGenerator();
  const hasMermaid = MERMAID_BLOCK_PATTERN.test(content);

  const components: Components = {
    a(props) {
      const href = props.href ?? "";
      const isExternal = /^https?:\/\//i.test(href);

      return (
        <a
          {...props}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
          className="font-medium text-sky-400 underline decoration-sky-400/30 decoration-[1.5px] underline-offset-[3px] transition-colors hover:text-sky-300 hover:decoration-sky-300"
        >
          {props.children}
          {isExternal ? (
            <ExternalLink
              className="ml-1 inline-block h-3.5 w-3.5 align-baseline opacity-70"
              aria-hidden
            />
          ) : null}
        </a>
      );
    },
    img(props) {
      return (
        <span className="my-10 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            {...props}
            alt={props.alt ?? ""}
            className="w-full rounded-2xl border border-border dark:border-white/10 shadow-xl object-cover"
          />
          {props.alt ? (
            <span className="mt-3 block text-center text-[0.85rem] text-muted dark:text-slate-400">
              {props.alt}
            </span>
          ) : null}
        </span>
      );
    },
    pre(props) {
      const info = findCodeChild(props.children);
      if (info && info.code) {
        return (
          <CodeBlock language={info.language ?? undefined} code={info.code}>
            <pre className="font-mono text-[0.85rem] leading-relaxed text-muted dark:text-slate-300">
              {props.children}
            </pre>
          </CodeBlock>
        );
      }
      return <pre {...props} className="overflow-x-auto rounded-xl bg-slate-900/50 p-4 font-mono text-sm border border-border dark:border-white/10" />;
    },
    code(props) {
      const { className: codeClassName, children, ...rest } = props;
      const match = /language-([\w-]+)/.exec(codeClassName ?? "");
      const language = match?.[1]?.toLowerCase();
      const rawCode = String(children).replace(/\n$/, "");

      if (language === "mermaid" && hasMermaid) {
        return <MermaidDiagram chart={rawCode} />;
      }

      const isInline = !match;
      
      return (
        <code
          {...rest}
          className={cn(
            codeClassName,
            isInline && "rounded-md bg-slate-800/60 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-200"
          )}
        >
          {children}
        </code>
      );
    },
    table(props) {
      return (
        <div className="my-8 overflow-x-auto rounded-xl border border-border dark:border-white/10 bg-slate-900/20">
          <table {...props} className="min-w-full border-collapse text-left text-[0.95rem]" />
        </div>
      );
    },
    th(props) {
      return <th {...props} className="border-b border-border dark:border-white/10 bg-slate-900/40 px-4 py-3 font-semibold text-muted dark:text-slate-200" />;
    },
    td(props) {
      return <td {...props} className="border-b border-white/5 px-4 py-3 align-top text-muted dark:text-slate-300" />;
    },
    p(props) {
      return <p {...props} className="my-6 text-[1.1rem] leading-[1.8] text-muted dark:text-slate-300 tracking-[-0.01em]" />;
    },
    ul(props) {
      return <ul {...props} className="my-6 ml-6 list-disc space-y-2 text-[1.1rem] leading-[1.8] text-muted dark:text-slate-300 marker:text-sky-500/60" />;
    },
    ol(props) {
      return <ol {...props} className="my-6 ml-6 list-decimal space-y-2 text-[1.1rem] leading-[1.8] text-muted dark:text-slate-300 marker:text-sky-500/60 marker:font-medium" />;
    },
    li(props) {
      return <li {...props} className="pl-1" />;
    },
    blockquote(props) {
      return (
        <blockquote {...props} className="relative my-8 overflow-hidden rounded-r-2xl border-l-4 border-sky-500 bg-sky-500/5 px-6 py-4 text-sky-100">
          <Quote className="absolute right-4 top-4 h-16 w-16 -rotate-6 text-sky-500/10" aria-hidden />
          <div className="relative z-10 text-[1.1rem] italic leading-relaxed text-muted dark:text-slate-300">
            {props.children}
          </div>
        </blockquote>
      );
    },
    hr(props) {
      return <hr {...props} className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />;
    },
    h2(props) {
      const text = getNodeTextContent(props.children);
      const id = nextHeadingId(text);
      return (
        <h2 {...props} id={id} className={cn("group scroll-mt-32 mt-16 mb-6 font-display text-3xl font-semibold tracking-tight text-foreground dark:text-slate-100", props.className)}>
          {props.children}
          <HeadingAnchor id={id} label={text} />
        </h2>
      );
    },
    h3(props) {
      const text = getNodeTextContent(props.children);
      const id = nextHeadingId(text);
      return (
        <h3 {...props} id={id} className={cn("group scroll-mt-32 mt-12 mb-4 font-display text-2xl font-semibold tracking-tight text-muted dark:text-slate-200", props.className)}>
          {props.children}
          <HeadingAnchor id={id} label={text} />
        </h3>
      );
    },
    h4(props) {
      const text = getNodeTextContent(props.children);
      const id = nextHeadingId(text);
      return (
        <h4 {...props} id={id} className={cn("group scroll-mt-32 mt-8 mb-4 font-display text-xl font-medium tracking-tight text-muted dark:text-slate-200", props.className)}>
          {props.children}
          <HeadingAnchor id={id} label={text} />
        </h4>
      );
    },
  };

  return (
    <div className={cn("markdown-body font-sans", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
