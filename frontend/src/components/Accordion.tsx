"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}

interface AccordionItemProps {
  question: React.ReactNode;
  answer: React.ReactNode;
}

export function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group glow-card glow-indigo rounded-2xl dark:bg-[#121212]">
      <div
        className={cn(
          "rounded-2xl border border-slate-200/60 bg-white transition-all duration-300 dark:border-white/10 dark:bg-[#121212]",
          isOpen && "border-indigo-200/50 shadow-xl dark:border-indigo-500/20"
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between gap-3 p-5 text-left text-sm font-semibold text-slate-900 dark:text-white"
        >
          <span>{question}</span>
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white transition-transform duration-300",
              isOpen && "rotate-45"
            )}
          >
            +
          </span>
        </button>
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5">
              <div className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
                {answer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
