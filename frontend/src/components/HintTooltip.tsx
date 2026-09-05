"use client";

import React, { useState } from "react";
import { HelpCircle, Sparkles } from "lucide-react";

interface HintTooltipProps {
  text: string;
  badge?: string;
  children?: React.ReactNode;
}

export default function HintTooltip({ text, badge = "HINT", children }: HintTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center group">
      {children}
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="ml-1.5 inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 transition-colors"
        aria-label="View hint"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 w-56 rounded-2xl border border-indigo-200 bg-white p-3 shadow-xl dark:border-indigo-500/30 dark:bg-[#161826] text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-3 w-3" />
            <span>{badge}</span>
          </div>
          <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 leading-snug">
            {text}
          </p>
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-indigo-200 bg-white dark:border-indigo-500/30 dark:bg-[#161826]" />
        </div>
      )}
    </div>
  );
}
