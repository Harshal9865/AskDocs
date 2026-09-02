"use client";

import { useEffect, useState } from "react";
import { AIAvatarIcon } from "@/components/AIAvatarIcon";
import { Sparkles } from "lucide-react";

const STATUS_MESSAGES = [
  "Synchronizing workspace intelligence…",
  "Connecting document retrieval pipeline…",
  "Verifying institutional memory…",
  "Preparing AskDocs AI assistant…",
];

export default function Loading({
  label,
}: {
  label?: string;
}) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (label) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [label]);

  const displayMessage = label || STATUS_MESSAGES[msgIndex];

  return (
    <div
      role="status"
      aria-label={displayMessage}
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-purple-50/20 to-slate-100 dark:from-[#090914] dark:via-[#0f0e22] dark:to-[#090914] transition-colors"
    >
      {/* Ambient background glowing orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-purple-500/20 to-indigo-500/10 blur-3xl dark:from-purple-900/30 dark:to-indigo-900/20" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/15 to-purple-500/20 blur-3xl dark:from-cyan-900/20 dark:to-purple-900/30" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Core Luminous Vessel with Multi-Layered Rotating Aurora Rings */}
        <div className="relative mb-7 flex items-center justify-center">
          {/* Outer Cosmic Pulse Wave */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-purple-500/25 via-indigo-500/25 to-cyan-500/25 blur-xl animate-pulse" />

          {/* Outer Rotating Aurora Halo */}
          <div className="absolute -inset-3.5 rounded-full border border-purple-400/40 dark:border-purple-500/30 animate-spin [animation-duration:6s] border-t-purple-500 border-r-cyan-400 border-b-transparent border-l-transparent" />

          {/* Counter-rotating Inner Halo */}
          <div className="absolute -inset-1.5 rounded-full border border-cyan-400/50 dark:border-cyan-400/30 animate-spin [animation-direction:reverse] [animation-duration:4s] border-t-transparent border-r-transparent border-b-indigo-400 border-l-emerald-400" />

          {/* Central AI Prism Vessel */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/40 bg-white/90 p-1 shadow-2xl shadow-purple-500/25 backdrop-blur-xl dark:border-white/15 dark:bg-[#15142b]/90 dark:shadow-purple-900/40">
            <AIAvatarIcon className="h-14 w-14" streaming={true} />
          </div>
        </div>

        {/* Brand signature & animated badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-white/80 px-3 py-1 shadow-sm backdrop-blur-md dark:border-purple-500/20 dark:bg-purple-950/40">
          <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span className="text-xs font-bold tracking-tight bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent dark:from-purple-300 dark:via-indigo-200 dark:to-cyan-300">
            AskDocs Intelligence
          </span>
        </div>

        {/* Dynamic Status Ticker */}
        <p className="min-h-[1.25rem] text-center text-xs font-medium text-slate-600 dark:text-zinc-300 transition-all duration-300">
          {displayMessage}
        </p>

        {/* Sleek Neon Shimmer Progress Bar */}
        <div className="mt-4 relative h-1.5 w-48 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
          <div className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] animate-[shimmer_1.8s_infinite]" />
        </div>
      </div>
    </div>
  );
}

