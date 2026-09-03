"use client";

import { useState } from "react";
import { X, Check, Sparkles, Crown, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import FakeCheckoutModal from "./FakeCheckoutModal";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: "premium" | "ultra_premium";
}

export default function PricingModal({
  isOpen,
  onClose,
}: PricingModalProps) {
  const { user } = useAuth();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [checkoutTarget, setCheckoutTarget] = useState<"premium" | "ultra_premium" | null>(null);

  if (!isOpen) return null;

  const currentPlan = (user?.plan || "free").toLowerCase();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-black/60 overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-white/40 bg-white/95 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-[#0f0d1d]/95 dark:shadow-[0_0_80px_-15px_rgba(147,51,234,0.3)] my-8">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="p-6 sm:p-8 text-center border-b border-slate-100 dark:border-white/10 relative overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-gradient-to-b from-purple-500/20 via-indigo-500/10 to-transparent blur-3xl" />

            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/70 bg-purple-50/80 px-3.5 py-1 text-xs font-bold text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300 mb-3 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Simple, Transparent Plans</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white py-1 leading-normal">
              Unlock the Full Power of AskDocs AI
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">
              Supercharge your workspace with deep multi-document intelligence, cited answers, and unlimited speed.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/90 p-1 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setInterval("monthly")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${interval === "monthly" ? "bg-white text-slate-900 shadow-xs dark:bg-purple-600 dark:text-white" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900"}`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setInterval("annual")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${interval === "annual" ? "bg-white text-slate-900 shadow-xs dark:bg-purple-600 dark:text-white" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900"}`}
              >
                <span>Annual Billing</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-300">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* 3 Tier Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8">
            
            {/* Free Tier */}
            <div className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all ${currentPlan === "free" ? "border-purple-500/50 bg-purple-50/20 dark:border-purple-500/40 dark:bg-purple-950/10" : "border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-white/5"}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Starter
                  </span>
                  {currentPlan === "free" && (
                    <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-zinc-300">
                      Current Plan
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Free</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">$0</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">/ forever</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    Essential document search & cited chat for personal use.
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-200/60 dark:border-white/10">
                  {[
                    "50 AI Reasoning Queries / month",
                    "Smart Token Caching & Context Compressor",
                    "100 Documents upload limit",
                    "Up to 3 Workspaces",
                    "Max 15 MB file size",
                    "Standard Chunk RAG Search",
                    "Team Chat & Profile Stickers",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-300">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  disabled={currentPlan === "free"}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 disabled:opacity-60 transition-all cursor-default"
                >
                  {currentPlan === "free" ? "Active Free Tier" : "Downgrade to Free"}
                </button>
              </div>
            </div>

            {/* Premium Tier (Recommended) */}
            <div className={`relative flex flex-col justify-between rounded-3xl border-2 p-6 shadow-xl transition-all ${currentPlan === "premium" ? "border-purple-600 bg-purple-50/40 dark:border-purple-500 dark:bg-purple-950/20" : "border-purple-500/80 bg-white dark:border-purple-500/60 dark:bg-[#151228] shadow-purple-500/10"}`}>
              {/* Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-3.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
                ⭐ Most Popular
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Professional
                  </span>
                  {currentPlan === "premium" && (
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      Active Plan
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Premium</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      ${interval === "annual" ? "190" : "19"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      /{interval === "annual" ? "year" : "month"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    High speed, priority Gemini 2.5 Flash, and deep team collaboration.
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-200/60 dark:border-white/10">
                  {[
                    "1,500 Fast AI Reasoning Queries / month",
                    "Context Deduplication (Saves ~40% tokens)",
                    "1,000 Documents upload limit",
                    "Up to 15 Workspaces",
                    "Max 50 MB file size",
                    "Priority Gemini 2.5 Flash Speed",
                    "Speech Audio Voice Answers",
                    "Document Conflict & Freshness Alert",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-200 font-medium">
                      <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setCheckoutTarget("premium")}
                  disabled={currentPlan === "premium"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
                >
                  {currentPlan === "premium" ? (
                    "Active Subscription"
                  ) : (
                    <>
                      <span>Upgrade to Premium</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ultra Premium Tier (Crown) */}
            <div className={`relative flex flex-col justify-between rounded-3xl border-2 p-6 transition-all ${currentPlan === "ultra_premium" ? "border-amber-500 bg-amber-50/40 dark:border-amber-500 dark:bg-amber-950/20" : "border-amber-400/70 bg-gradient-to-b from-amber-50/30 via-white to-white dark:from-amber-950/15 dark:via-[#110f22] dark:to-[#110f22] shadow-amber-500/10"}`}>
              {/* VIP Crown Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 px-3.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md flex items-center gap-1">
                <Crown className="h-3 w-3" />
                <span>Ultra VIP</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Executive / Power
                  </span>
                  {currentPlan === "ultra_premium" && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      Active Plan
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ultra Premium</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      ${interval === "annual" ? "490" : "49"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      /{interval === "annual" ? "year" : "month"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    Unlimited power, Gemini 2.5 Pro reasoning, and executive dossiers.
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-200/60 dark:border-white/10">
                  {[
                    "10,000 Deep Synthesis & Multi-Doc Queries / mo",
                    "Dedicated Token Bucket & High-Yield Cache Shield",
                    "UNLIMITED Documents & Workspaces",
                    "Max 200 MB file upload size",
                    "Gemini 2.5 Pro Ultra Reasoning Mode",
                    "Multi-Workspace Deep Knowledge RAG",
                    "Executive PDF Dossier Exports",
                    "Golden Radiant Avatar Ring & Badge 👑",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-zinc-100 font-semibold">
                      <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setCheckoutTarget("ultra_premium")}
                  disabled={currentPlan === "ultra_premium"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
                >
                  {currentPlan === "ultra_premium" ? (
                    "Active Subscription"
                  ) : (
                    <>
                      <span>Upgrade to Ultra</span>
                      <Crown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="p-4 sm:p-6 text-center border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Need custom enterprise billing, invoice POs, or custom AI fine-tuning?{" "}
              <a href="mailto:support@askdocs.ai" className="font-semibold text-purple-600 hover:underline dark:text-purple-400">
                Contact Enterprise Sales →
              </a>
            </p>
          </div>

        </div>
      </div>

      {/* Simulated Checkout Modal */}
      {checkoutTarget && (
        <FakeCheckoutModal
          isOpen={true}
          onClose={() => setCheckoutTarget(null)}
          targetPlan={checkoutTarget}
          initialInterval={interval}
          onSuccess={() => {
            setCheckoutTarget(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
