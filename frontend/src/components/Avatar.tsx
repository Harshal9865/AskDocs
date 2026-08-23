"use client";

import { PresenceDot } from "@/components/PresenceDot";

// Teams-like deterministic color palette
const COLORS = [
  "bg-indigo-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-600",
  "bg-orange-500",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({
  name,
  size = 36,
  online,
  showPresence = false,
}: {
  name: string;
  size?: number;
  /** optional email/second string to vary the color */
  online?: boolean;
  showPresence?: boolean;
}) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className={`flex h-full w-full items-center justify-center rounded-full font-semibold text-white select-none ${colorFor(name)}`}
        style={{ fontSize: size * 0.38 }}
        aria-label={name}
      >
        {initials}
      </span>
      {showPresence && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <span
            className={`block rounded-full border-2 border-white ${
              online ? "bg-emerald-500" : "bg-slate-300"
            }`}
            style={{ width: Math.max(10, size * 0.3), height: Math.max(10, size * 0.3) }}
            title={online ? "Online" : "Offline"}
            aria-label={online ? "Online" : "Offline"}
          />
        </span>
      )}
    </span>
  );
}

export { PresenceDot };
