"use client";

export default function Loading({
  label = "Loading your workspace…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-[#121212]"
    >
      <div className="relative">
        <div className="loading-orb relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-2xl font-black text-white shadow-xl shadow-indigo-500/30">
          A
        </div>
        <span className="loading-ring" aria-hidden />
      </div>
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="loading-dot h-2 w-2 rounded-full bg-indigo-500" />
        <span
          className="loading-dot h-2 w-2 rounded-full bg-purple-500"
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className="loading-dot h-2 w-2 rounded-full bg-pink-500"
          style={{ animationDelay: "0.3s" }}
        />
      </div>
      <p className="text-xs font-medium tracking-wide text-slate-400 dark:text-zinc-500">
        {label}
      </p>
    </div>
  );
}
