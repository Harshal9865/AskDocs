"use client";

import { useEffect, useState } from "react";

const SYSTEM_STAGES = [
  { label: "INDEXING WORKSPACE REPOSITORY", detail: "Resolving document embeddings & chunk graph" },
  { label: "INITIALIZING NEURAL PIPELINE", detail: "Connecting vector store & institutional memory" },
  { label: "SYNCHRONIZING PERMISSIONS", detail: "Applying role-based access & encryption keys" },
  { label: "READYING AI AGENT INSTANCE", detail: "Gemini multi-modal pipeline online" },
];

export default function Loading({
  label,
}: {
  label?: string;
}) {
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % SYSTEM_STAGES.length);
    }, 2400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 96 ? 96 : prev + Math.floor(Math.random() * 8 + 3)));
    }, 400);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentStage = SYSTEM_STAGES[stageIdx];

  return (
    <div
      role="status"
      aria-label={label || currentStage.label}
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#fafafa] dark:bg-[#080811] text-slate-900 dark:text-zinc-100 transition-colors select-none"
    >
      {/* Precision Background Micro-Grid & Ambient Radial Beam */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#6366f112_1px,transparent_1px)] [background-size:28px_28px] opacity-70 dark:opacity-40" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-cyan-500/10 blur-[100px] dark:from-indigo-600/15 dark:via-purple-600/15 dark:to-cyan-500/10" />

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6">
        
        {/* Kinetic Quantum Aperture (High-Tech Vector Core) */}
        <div className="relative mb-9 flex items-center justify-center">
          
          {/* Subtle Ambient Core Glow */}
          <div className="absolute h-24 w-24 rounded-full bg-indigo-500/20 blur-xl dark:bg-indigo-500/30 animate-pulse" />

          {/* SVG Precision Kinetic Ring System */}
          <svg
            className="h-28 w-28"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Static Track with Micro-ticks */}
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="1"
              strokeDasharray="3 5"
            />

            {/* Orbit 1: Fast Thin Laser Arc */}
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="url(#laserGrad1)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="60 260"
              className="origin-center animate-[spin_2.4s_cubic-bezier(0.4,0,0.2,1)_infinite]"
            />

            {/* Middle Track: Precision Segmented Gyro */}
            <circle
              cx="60"
              cy="60"
              r="38"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1.5"
            />
            <circle
              cx="60"
              cy="60"
              r="38"
              stroke="url(#laserGrad2)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="45 190"
              className="origin-center animate-[spin_3.6s_linear_infinite_reverse]"
            />

            {/* Inner Precision Hexagon Lattice */}
            <path
              d="M60 34 L82 47 L82 73 L60 86 L38 73 L38 47 Z"
              stroke="url(#hexGrad)"
              strokeWidth="1.2"
              strokeOpacity="0.6"
              fill="url(#innerHexGlow)"
              className="origin-center animate-[pulse_2.8s_ease-in-out_infinite]"
            />

            {/* Central Holographic Neural Prism */}
            <path
              d="M60 46 C60 53 53 60 46 60 C53 60 60 67 60 74 C60 67 67 60 74 60 C67 60 60 53 60 46 Z"
              fill="url(#coreSparkGrad)"
              className="origin-center animate-[spin_8s_linear_infinite]"
            />

            {/* Center Photon Spark */}
            <circle cx="60" cy="60" r="2.5" fill="#FFFFFF" />

            {/* Gradients */}
            <defs>
              <linearGradient id="laserGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0" />
                <stop offset="60%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>

              <linearGradient id="laserGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="80%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>

              <linearGradient id="hexGrad" x1="38" y1="34" x2="82" y2="86">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="50%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>

              <radialGradient id="innerHexGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#080811" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="coreSparkGrad" x1="46" y1="46" x2="74" y2="74">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#A5B4FC" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Telemetry Header Badge */}
        <div className="mb-3 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[10px] font-mono font-medium tracking-wider text-slate-500 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>ASKDOCS // KERNEL INITIALIZE</span>
        </div>

        {/* Dynamic Telemetry Status */}
        <div className="w-full text-center min-h-[44px]">
          <h4 className="text-xs font-mono font-semibold tracking-wider text-slate-800 dark:text-zinc-200 uppercase transition-all duration-300">
            {label || currentStage.label}
          </h4>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500 font-sans leading-tight">
            {currentStage.detail}
          </p>
        </div>

        {/* Precision Progress Metric Bar */}
        <div className="mt-5 w-full">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-zinc-600">
            <span>SYS_MEM: OK</span>
            <span>{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}


