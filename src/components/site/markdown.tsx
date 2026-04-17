import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

import { createArticleHeadingIdGenerator } from "@/lib/content/article-outline";
import { MermaidDiagram } from "@/components/site/mermaid-diagram";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

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

export function Markdown({ content, className }: MarkdownProps) {
  const nextHeadingId = createArticleHeadingIdGenerator();

  const components: Components = {
    a(props) {
      const href = props.href ?? "";
      const isExternal = /^https?:\/\//i.test(href);

      return (
        <a
          {...props}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
        />
      );
    },
    img(props) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...props}
          alt={props.alt ?? ""}
          className="my-6 w-full rounded-[1.4rem] border border-white/10 object-cover"
        />
      );
    },
    pre(props) {
      return <pre {...props} className="overflow-x-auto" />;
    },
    code(props) {
      const { className: codeClassName, children, ...rest } = props;
      const match = /language-([\w-]+)/.exec(codeClassName ?? "");
      const language = match?.[1]?.toLowerCase();
      const rawCode = String(children).replace(/\n$/, "");

      if (language === "mermaid") {
        return <MermaidDiagram chart={rawCode} />;
      }

      return (
        <code {...rest} className={codeClassName}>
          {children}
        </code>
      );
    },
    table(props) {
      return (
        <div className="my-6 overflow-x-auto">
          <table {...props} className="min-w-full border-collapse text-left text-sm" />
        </div>
      );
    },
    th(props) {
      return <th {...props} className="border-b border-white/10 px-3 py-2 font-semibold" />;
    },
    td(props) {
      return <td {...props} className="border-b border-white/6 px-3 py-2 align-top" />;
    },
    h2(props) {
      const id = nextHeadingId(getNodeTextContent(props.children));

      return <h2 {...props} id={id} className={cn("scroll-mt-32", props.className)} />;
    },
    h3(props) {
      const id = nextHeadingId(getNodeTextContent(props.children));

      return <h3 {...props} id={id} className={cn("scroll-mt-32", props.className)} />;
    },
    h4(props) {
      const id = nextHeadingId(getNodeTextContent(props.children));

      return <h4 {...props} id={id} className={cn("scroll-mt-32", props.className)} />;
    },
  };

  return (
    <div className={cn("markdown-body", className)}>
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
