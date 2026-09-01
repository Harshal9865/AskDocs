"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return <div className={cn("space-y-3.5", className)}>{children}</div>;
}

interface AccordionItemProps {
  question: React.ReactNode;
  answer: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
  gradient?: string;
  defaultOpen?: boolean;
}

export function AccordionItem({
  question,
  answer,
  icon,
  badge,
  gradient = "from-purple-600 via-indigo-600 to-blue-600",
  defaultOpen = false,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="relative group">
      {/* Ambient gradient glow on hover and when open */}
      <div
        className={cn(
          "absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-0 blur-md transition-all duration-500 group-hover:opacity-30",
          gradient,
          isOpen && "opacity-50 group-hover:opacity-70"
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-md",
          "border-slate-200/80 bg-white/95 shadow-sm hover:shadow-md",
          "dark:border-white/10 dark:bg-[#141416]/95 dark:shadow-none",
          isOpen &&
            "border-transparent ring-2 ring-purple-500/30 dark:border-transparent dark:ring-purple-400/30 shadow-xl"
        )}
      >
        {/* Subtle top gradient accent line when open */}
        {isOpen && (
          <div
            className={cn("h-1 w-full bg-gradient-to-r", gradient)}
            aria-hidden
          />
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between gap-3.5 p-4 sm:p-5 text-left transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {icon && (
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-105",
                  gradient
                )}
              >
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white sm:text-[15px]">
                  {question}
                </span>
                {badge && (
                  <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300">
                    {badge}
                  </span>
                )}
              </div>
            </div>
          </div>

          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
              isOpen &&
                "rotate-180 border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-950/50 dark:text-purple-400"
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>

        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-slate-100 px-4 sm:px-5 pb-5 pt-3 dark:border-white/5">
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
