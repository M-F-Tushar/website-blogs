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
            className="overflow-hidden rounded-[1.3rem] border border-white/8 bg-white/4"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-white"
            >
              <span className="text-[1rem] font-medium">{item.question}</span>
              <ChevronDown
                className={cn("h-4 w-4 text-slate-400 transition", isOpen && "rotate-180")}
              />
            </button>
            {isOpen ? (
              <div className="border-t border-white/8 px-5 py-4 text-[0.98rem] leading-8 text-slate-400">
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
