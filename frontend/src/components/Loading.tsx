"use client";

import { AIAvatarIcon } from "@/components/AIAvatarIcon";

export default function Loading({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-slate-50/80 dark:bg-[#0c0c1a] transition-colors select-none"
    >
      {/* Soft Ambient Aurora Backdrop Bloom */}
      <div className="pointer-events-none absolute -top-24 h-96 w-96 rounded-full bg-gradient-to-tr from-purple-500/15 via-indigo-500/15 to-cyan-500/10 blur-[90px] dark:from-purple-900/25 dark:via-indigo-900/20 dark:to-cyan-900/15" />
      <div className="pointer-events-none absolute -bottom-24 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/10 via-purple-500/15 to-indigo-500/10 blur-[90px] dark:from-cyan-900/15 dark:to-purple-900/25" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Luminous 3D Glassmorphic Aurora Orb */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Pulsing Glow Wave */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-cyan-400/30 blur-xl animate-pulse" />

          {/* Outer Smooth Rotating Aurora Halo */}
          <div className="absolute -inset-3 rounded-full border-2 border-transparent border-t-purple-500 border-r-cyan-400 animate-spin [animation-duration:3s]" />

          {/* Counter-rotating Inner Arc */}
          <div className="absolute -inset-1.5 rounded-full border-2 border-transparent border-b-indigo-400 border-l-emerald-400 animate-spin [animation-direction:reverse] [animation-duration:2.2s]" />

          {/* Frosted Glass Vessel holding AI Neural Prism */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/40 bg-white/80 p-2 shadow-2xl shadow-purple-500/20 backdrop-blur-xl dark:border-white/15 dark:bg-[#14132b]/85 dark:shadow-purple-900/40">
            <AIAvatarIcon className="h-14 w-14" streaming={true} />
          </div>
        </div>

        {/* Minimalist 3-dot Aurora Pulsing Indicator */}
        <div className="flex items-center gap-2" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}



