import Image from "next/image";
import type { ReactNode } from "react";

import { ArticleToc } from "@/components/site/article-toc";
import { Markdown } from "@/components/site/markdown";
import type { MarkdownHeading } from "@/lib/markdown-outline";

interface LongformArticleLayoutProps {
  taxonomy: string[];
  title: string;
  summary?: string | null;
  heroMeta?: ReactNode;
  coverUrl?: string | null;
  coverAlt?: string | null;
  bodyMarkdown: string;
  headings: MarkdownHeading[];
  railTitle?: string;
  railSummary?: string;
  railContent?: ReactNode;
  afterContent?: ReactNode;
}

export function LongformArticleLayout({
  taxonomy,
  title,
  summary,
  heroMeta,
  coverUrl,
  coverAlt,
  bodyMarkdown,
  headings,
  railTitle = "On this page",
  railSummary = "A guided outline for faster scanning and better long-form flow.",
  railContent,
  afterContent,
}: LongformArticleLayoutProps) {
  return (
    <article className="mx-auto max-w-[1380px] px-6 pb-24 pt-10 md:pt-16">
      <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.18),transparent_22%),radial-gradient(circle_at_86%_14%,rgba(99,102,241,0.18),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.94))] px-6 py-8 shadow-[0_30px_120px_rgba(2,6,23,0.42)] md:px-10 md:py-12 xl:px-14">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-20 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.78),transparent_92%)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.38em] text-sky-300">
            {taxonomy.join(" / ") || "Long-form reading"}
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-[2.9rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[4.4rem] xl:text-[5.4rem]">
            {title}
          </h1>
          {summary ? (
            <p className="mt-6 max-w-3xl text-[1.05rem] leading-8 text-slate-300 md:text-[1.16rem]">
              {summary}
            </p>
          ) : null}
          {heroMeta ? <div className="mt-7 flex flex-wrap gap-3">{heroMeta}</div> : null}
        </div>
      </div>

      {coverUrl ? (
        <div className="mt-10 xl:mt-12">
          <div className="editorial-panel overflow-hidden rounded-[2rem] p-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[1.6rem]">
              <Image
                src={coverUrl}
                alt={coverAlt ?? title}
                fill
                sizes="(max-width: 1280px) 100vw, 1100px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.02),rgba(2,6,23,0.3))]" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 xl:mt-12 xl:grid-cols-[minmax(0,1fr)_18.5rem] xl:items-start">
        <aside className="order-1 xl:order-2 xl:sticky xl:top-28">
          <div className="surface-panel rounded-[1.8rem] p-5">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-sky-300">
              {railTitle}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">{railSummary}</p>
            <div className="mt-5">
              <ArticleToc headings={headings} />
            </div>
          </div>

          {railContent ? <div className="mt-4">{railContent}</div> : null}
        </aside>

        <div className="order-2 min-w-0 xl:order-1">
          <div className="editorial-panel rounded-[2rem] px-6 py-7 md:px-9 md:py-10 xl:px-12 xl:py-12">
            <Markdown content={bodyMarkdown} className="reading-markdown" />
          </div>

          {afterContent ? <div className="mt-6">{afterContent}</div> : null}
        </div>
      </div>
    </article>
  );
}
