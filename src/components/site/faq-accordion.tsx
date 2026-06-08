"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = index === openIndex;

        return (
          <div
            key={item.question}
            className={`overflow-hidden rounded-[1.3rem] border transition-all duration-300 backdrop-blur-xl ${
              isOpen
                ? "border-rose-400/30 bg-surface-dark/20 dark:bg-[rgba(15,23,42,0.6)] shadow-[0_12px_40px_rgba(244,63,94,0.1)]"
                : "border-border dark:border-white/10 bg-surface-dark/10 dark:bg-[rgba(15,23,42,0.4)] hover:border-white/20 hover:bg-[rgba(15,23,42,0.5)]"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-foreground dark:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/20 rounded-[1.3rem]"
            >
              <span className={`text-[1.05rem] font-semibold leading-snug transition-colors duration-300 ${isOpen ? "text-rose-100" : "text-foreground dark:text-white"}`}>{item.question}</span>
              <div className={`flex shrink-0 items-center justify-center rounded-full h-8 w-8 transition-colors duration-300 ${isOpen ? "bg-rose-500/20 text-rose-400" : "bg-black/5 dark:bg-white/5 text-muted dark:text-slate-400"}`}>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-6 py-4 pb-6 text-[1.05rem] leading-[1.7] text-muted dark:text-slate-300">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
