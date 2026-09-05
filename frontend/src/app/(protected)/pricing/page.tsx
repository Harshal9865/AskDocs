"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Crown, Zap, HelpCircle, ArrowRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import FakeCheckoutModal from "@/components/FakeCheckoutModal";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [checkoutTarget, setCheckoutTarget] = useState<"premium" | "ultra_premium" | null>(null);

  const currentPlan = (user?.plan || "free").toLowerCase();

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-4 sm:py-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-start sm:hidden">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/70 bg-purple-50/80 px-3.5 py-1 text-xs font-bold text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          <span>Plans & Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200 py-1.5 pb-2.5 leading-snug sm:leading-normal">
          Supercharge your Team Intelligence
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">
          Choose the plan that fits your workflow. Upgrade or downgrade anytime.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="pt-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 p-1.5 dark:border-white/10 dark:bg-[#131220]/90 shadow-sm backdrop-blur-md">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${interval === "monthly" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"}`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setInterval("annual")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all ${interval === "annual" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"}`}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-300">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#131220]/90 sm:p-7">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Free Starter
              </span>
              {currentPlan === "free" && (
                <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-zinc-300">
                  Current Tier
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Free</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">/ forever</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Essential document AI search & cited chat for personal exploration.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
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
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={currentPlan === "free"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 cursor-default"
            >
              {currentPlan === "free" ? "Active Free Tier" : "Downgrade to Free"}
            </button>
          </div>
        </div>

        {/* Premium Plan */}
        <div className="relative flex flex-col justify-between rounded-3xl border-2 border-purple-500 bg-white p-6 shadow-xl shadow-purple-500/10 backdrop-blur-md dark:border-purple-500/80 dark:bg-[#131220] sm:p-7">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md">
            ⭐ Most Popular
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Professional
              </span>
              {currentPlan === "premium" && (
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Current Tier
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Premium</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  ${interval === "annual" ? "190" : "19"}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  /{interval === "annual" ? "year" : "month"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Accelerated priority AI, audio voice synthesis, and multi-team collaboration.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
              {[
                "1,500 Fast AI Reasoning Queries / month",
                "Context Deduplication (Saves ~40% tokens)",
                "1,000 Documents upload limit",
                "Up to 15 Workspaces",
                "Max 50 MB file size",
                "Study Studio & Timed Exam Simulator",
                "2-Host Audio Podcast & Spoken Briefs",
                "Format & Redact (HIPAA, Legal NDA, Blind Review)",
                "Contracts Tracker & Redline Diff",
                "Priority Gemini 2.5 Flash Speed",
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-200 font-medium">
                  <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
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

        {/* Ultra Premium Plan */}
        <div className="relative flex flex-col justify-between rounded-3xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-50/40 via-white to-white p-6 shadow-xl shadow-amber-500/10 backdrop-blur-md dark:border-amber-400/60 dark:from-amber-950/20 dark:via-[#131220] dark:to-[#131220] sm:p-7">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 px-4 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md flex items-center gap-1">
            <Crown className="h-3.5 w-3.5" />
            <span>Ultra VIP</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Executive & Enterprise
              </span>
              {currentPlan === "ultra_premium" && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Current Tier
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Ultra Premium</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  ${interval === "annual" ? "490" : "49"}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  /{interval === "annual" ? "year" : "month"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Max reasoning intelligence, unlimited storage, and executive PDF dossier generator.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
              {[
                "10,000 Deep Synthesis & Multi-Doc Queries / mo",
                "Dedicated Token Bucket & High-Yield Cache Shield",
                "UNLIMITED Documents & Workspaces",
                "Max 200 MB file upload size",
                "Gemini 2.5 Pro Ultra Reasoning Mode",
                "Multi-Workspace Deep Knowledge RAG",
                "Executive PDF Dossier Exports",
                "Golden Radiant Avatar Ring & Badge 👑",
                "24/7 VIP Dedicated Queue",
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-zinc-100 font-semibold">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0" />
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

      {/* Student & Educator Academic Discount Banner */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-teal-500/10 p-6 sm:p-7 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/25">
            <span className="text-xl">🎓</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Student & Educator Discount
              </h3>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-300">
                50% OFF
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Verify your university email (<code className="text-purple-600 dark:text-purple-400 font-bold">.edu</code> / <code className="text-purple-600 dark:text-purple-400 font-bold">.ac.uk</code>) in Account Settings to unlock half-price access on all Professional plans.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCheckoutTarget("premium")}
          className="shrink-0 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-100 cursor-pointer"
        >
          Claim 50% Student Discount
        </button>
      </div>

      {/* FAQ Section */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 backdrop-blur-md dark:border-white/10 dark:bg-[#131220]/90 space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Can I cancel or switch plans anytime?
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Yes! You can upgrade, downgrade, or cancel your subscription anytime directly from Account Settings with instant effect.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              How does the simulated payment sandbox work?
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              All payment methods (Card, Apple/Google Pay, PayPal) run on test sandbox mode. You get instant access to full tier quotas without real billing charges.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              What happens to my documents if I downgrade?
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              All previously uploaded documents and chat histories remain safely accessible and indexed.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              What is Ultra Reasoning Mode?
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Ultra Reasoning leverages advanced chain-of-thought models (Gemini 2.5 Pro) with deeper semantic chunking to synthesize complex queries across hundreds of pages.
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
          onSuccess={() => setCheckoutTarget(null)}
        />
      )}
    </div>
  );
}
