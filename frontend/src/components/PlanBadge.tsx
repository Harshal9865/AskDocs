"use client";

import { Sparkles, Crown } from "lucide-react";

interface PlanBadgeProps {
  plan?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

export default function PlanBadge({
  plan = "free",
  size = "sm",
  className = "",
  showIcon = true,
}: PlanBadgeProps) {
  const normPlan = (plan || "free").toLowerCase();

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5 font-bold",
    lg: "text-sm px-3.5 py-1.5 gap-2 font-bold",
  }[size];

  if (normPlan === "ultra_premium" || normPlan === "ultra" || normPlan === "enterprise") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 font-extrabold text-white shadow-sm shadow-amber-500/30 border border-amber-300/40 tracking-wide uppercase ${sizeClasses} ${className}`}
      >
        {showIcon && <Crown className="h-3 w-3 shrink-0 text-yellow-100 animate-pulse" />}
        <span>Ultra</span>
      </span>
    );
  }

  if (normPlan === "premium" || normPlan === "pro") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 font-bold text-white shadow-sm shadow-purple-500/25 border border-purple-300/30 tracking-wide uppercase ${sizeClasses} ${className}`}
      >
        {showIcon && <Sparkles className="h-3 w-3 shrink-0 text-purple-200" />}
        <span>Premium</span>
      </span>
    );
  }

  // Free Tier
  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100/90 font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 uppercase tracking-wide ${sizeClasses} ${className}`}
    >
      <span>Free</span>
    </span>
  );
}
