"use client";

import { useState } from "react";
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Crown, 
  Lock, 
  ArrowRight, 
  Loader2, 
  Smartphone, 
  QrCode,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface FakeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: "premium" | "ultra_premium";
  initialInterval?: "monthly" | "annual";
  onSuccess?: () => void;
}

export default function FakeCheckoutModal({
  isOpen,
  onClose,
  targetPlan,
  initialInterval = "monthly",
  onSuccess,
}: FakeCheckoutModalProps) {
  const { refreshUser } = useAuth();

  const [interval, setInterval] = useState<"monthly" | "annual">(initialInterval);
  const [method, setMethod] = useState<"credit_card" | "apple_pay" | "google_pay" | "paypal">("credit_card");

  // Card Form State
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExp, setCardExp] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("424");
  const [cardName, setCardName] = useState("Alex Morgan");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ planName: string; invoiceNo?: string } | null>(null);

  if (!isOpen) return null;

  const isUltra = targetPlan === "ultra_premium";
  const planName = isUltra ? "Ultra Premium" : "Premium";
  const monthlyPrice = isUltra ? 49 : 19;
  const annualPrice = isUltra ? 490 : 190;
  const price = interval === "annual" ? annualPrice : monthlyPrice;

  function setPreset(type: "success" | "declined") {
    if (type === "success") {
      setCardNumber("4242 4242 4242 4242");
      setCardExp("12/28");
      setCardCvc("424");
      setCardName("Alex Morgan");
      setError(null);
    } else {
      setCardNumber("4242 4242 4242 0002");
      setCardExp("12/28");
      setCardCvc("000");
      setCardName("Declined Test");
      setError(null);
    }
  }

  function handleCardNumberChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumber(formatted);
  }

  function handleExpChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExp(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExp(raw);
    }
  }

  async function handlePay(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setBusy(true);
    setError(null);

    // Realistic simulation delay (1.2s)
    await new Promise((r) => setTimeout(r, 1200));

    try {
      const res = await api.checkoutPlan({
        plan: targetPlan,
        billing_interval: interval,
        payment_method: method,
        card_number: cardNumber,
        card_exp: cardExp,
        card_cvc: cardCvc,
        cardholder_name: cardName,
      });

      await refreshUser();
      setSuccessData({ planName: res.plan_name || planName, invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}` });
      onSuccess?.();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Payment processing failed. Please try a different card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/40 bg-white/95 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-[#110f22]/95 dark:shadow-[0_0_80px_-15px_rgba(147,51,234,0.3)]">
        
        {/* Header Ribbon */}
        <div className="relative flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/10 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${isUltra ? "bg-amber-500/20 text-amber-500" : "bg-purple-500/20 text-purple-600"}`}>
              {isUltra ? <Crown className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Upgrade to {planName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Simulated Sandbox Payment (No real charge)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {successData ? (
            /* Success State */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  Welcome to {successData.planName}!
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Your simulated payment was successful. All {planName} features & quotas are unlocked.
                </p>
              </div>

              <div className="inline-block rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                Receipt Number: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{successData.invoiceNo}</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:scale-105 transition-all"
                >
                  Start Exploring {planName} →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Billing Toggle & Plan Summary */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-white/10 dark:bg-white/5">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {planName} Subscription
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                    {interval === "annual" ? "Billed annually • Save 20%" : "Billed monthly"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-black/40">
                    <button
                      type="button"
                      onClick={() => setInterval("monthly")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${interval === "monthly" ? "bg-white text-slate-900 shadow-xs dark:bg-[#1f1d30] dark:text-white" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900"}`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterval("annual")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${interval === "annual" ? "bg-white text-slate-900 shadow-xs dark:bg-[#1f1d30] dark:text-white" : "text-slate-500 dark:text-zinc-400 hover:text-slate-900"}`}
                    >
                      Annual (-20%)
                    </button>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ${price}<span className="text-[10px] font-normal text-slate-500">/{interval === "annual" ? "yr" : "mo"}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Select Simulated Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("credit_card")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${method === "credit_card" ? "border-purple-500 bg-purple-50/50 text-purple-700 dark:border-purple-500/80 dark:bg-purple-950/40 dark:text-purple-300 ring-2 ring-purple-500/20" : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("apple_pay")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${method === "apple_pay" ? "border-purple-500 bg-purple-50/50 text-purple-700 dark:border-purple-500/80 dark:bg-purple-950/40 dark:text-purple-300 ring-2 ring-purple-500/20" : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Pay Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("paypal")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${method === "paypal" ? "border-purple-500 bg-purple-50/50 text-purple-700 dark:border-purple-500/80 dark:bg-purple-950/40 dark:text-purple-300 ring-2 ring-purple-500/20" : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>PayPal</span>
                  </button>
                </div>
              </div>

              {/* Quick Test Presets Bar */}
              <div className="flex items-center justify-between rounded-xl bg-purple-50/70 p-2.5 border border-purple-200/60 dark:border-purple-900/30 dark:bg-purple-950/30">
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  🧪 Test Cards:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreset("success")}
                    className="rounded-lg bg-white dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shadow-2xs hover:scale-105 transition-all"
                  >
                    ✓ Auto-fill Success
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset("declined")}
                    className="rounded-lg bg-white dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 shadow-2xs hover:scale-105 transition-all"
                  >
                    ✕ Auto-fill Decline
                  </button>
                </div>
              </div>

              {/* Form by Method */}
              {method === "credit_card" ? (
                <form onSubmit={handlePay} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Card Number
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        required
                        className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs sm:text-sm font-mono text-slate-900 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628] dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        Expiration
                      </label>
                      <input
                        type="text"
                        value={cardExp}
                        onChange={(e) => handleExpChange(e.target.value)}
                        placeholder="MM/YY"
                        required
                        className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 px-3.5 text-xs sm:text-sm font-mono text-slate-900 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628] dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        CVC
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-zinc-500">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                          placeholder="123"
                          required
                          className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 pl-9 pr-3.5 text-xs sm:text-sm font-mono text-slate-900 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628] dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Alex Morgan"
                      required
                      className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628] dark:text-white"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs font-semibold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing Simulated Charge…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Pay ${price} (Sandbox Simulation)</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* One-click Apple / Google / PayPal button */
                <div className="space-y-4 py-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-center dark:border-white/10 dark:bg-white/5 space-y-2">
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Click below to simulate an authorized token payment via {method === "paypal" ? "PayPal Sandbox" : method === "apple_pay" ? "Apple Pay" : "Google Pay"}.
                    </p>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">
                      Total: ${price} USD
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs font-semibold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePay()}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-black hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-slate-100 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Authorizing with {method.toUpperCase()}…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Authorize ${price} with {method === "paypal" ? "PayPal" : "Fast Pay"}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Security Footnote */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Simulated 256-bit encrypted test environment. No real money charged.</span>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
