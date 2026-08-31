"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "verify" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.requestPasswordReset(email.trim().toLowerCase());
      setSuccessMessage("Reset code sent to your email");
      setStep("verify");
    } catch (err) {
      setError((err as Error).message || "Failed to send reset code");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.verifyResetCode(email.trim().toLowerCase(), code);
      setStep("reset");
    } catch (err) {
      setError((err as Error).message || "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.resetPassword(email.trim().toLowerCase(), code, password);
      setStep("success");
    } catch (err) {
      setError((err as Error).message || "Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
  return (
    <div className="ambient-mesh relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50/90 px-4 py-12 dark:bg-[#07070a] sm:px-6 lg:px-8">
      {/* Background Radial Glow Flares */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-500/20 blur-[120px] dark:bg-purple-600/15" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-600/15" />
      
      {/* Subtle Geometric Background Grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Glassmorphic Card */}
      <div className="glass-card card-hover-lift relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-3xl sm:rounded-[2.5rem] shadow-2xl transition-all duration-500">
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <Link href="/" className="mb-6 flex items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-day.svg" alt="AskDocs" className="h-7 w-7 dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-night.svg" alt="AskDocs" className="hidden h-7 w-7 dark:block" />
            <span className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-white">AskDocs</span>
          </Link>

          <h1 className="mb-1.5 text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Forgot Password?
          </h1>
          <p className="mb-7 text-center text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {step === "request" && "Enter your email to receive a secure reset code"}
            {step === "verify" && "Enter the 6-digit code sent to your inbox"}
            {step === "reset" && "Create your new secure password"}
            {step === "success" && "Your password has been reset successfully"}
          </p>

          {step === "request" && (
            <form onSubmit={onRequestCode} className="space-y-4">
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-purple-600 dark:text-zinc-500 dark:group-focus-within:text-purple-400 transition-colors">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-black/30 dark:focus:ring-purple-500/20 transition-all duration-300 shadow-sm"
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-center text-xs font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1.5 justify-center animate-fadeIn">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-gradient-shimmer mt-2 flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold tracking-wide text-white shadow-lg disabled:opacity-70 active:scale-[0.98]"
              >
                {busy ? "Sending..." : "Send Reset Code"}
                {!busy && <ChevronRight className="ml-1.5 h-4 w-4" />}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={onVerifyCode} className="space-y-4">
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-purple-600 dark:text-zinc-500 dark:group-focus-within:text-purple-400 transition-colors">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-black/30 dark:focus:ring-purple-500/20 tracking-widest text-center text-2xl font-bold transition-all duration-300 shadow-sm"
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-center text-xs font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1.5 justify-center animate-fadeIn">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-gradient-shimmer mt-2 flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold tracking-wide text-white shadow-lg disabled:opacity-70 active:scale-[0.98]"
              >
                {busy ? "Verifying..." : "Verify Code"}
                {!busy && <ChevronRight className="ml-1.5 h-4 w-4" />}
              </button>

              <p className="text-center text-xs text-slate-500 dark:text-zinc-500">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setCode("");
                    setError(null);
                  }}
                  className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Resend
                </button>
              </p>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={onResetPassword} className="space-y-3.5">
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-purple-600 dark:text-zinc-500 dark:group-focus-within:text-purple-400 transition-colors">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-black/30 dark:focus:ring-purple-500/20 transition-all duration-300 shadow-sm"
                  placeholder="New Password (min 8 chars)"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-purple-600 dark:text-zinc-500 dark:group-focus-within:text-purple-400 transition-colors">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-black/30 dark:focus:ring-purple-500/20 transition-all duration-300 shadow-sm"
                  placeholder="Confirm New Password"
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-center text-xs font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1.5 justify-center animate-fadeIn">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-gradient-shimmer mt-2 flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold tracking-wide text-white shadow-lg disabled:opacity-70 active:scale-[0.98]"
              >
                {busy ? "Resetting..." : "Reset Password"}
                {!busy && <ChevronRight className="ml-1.5 h-4 w-4" />}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                Password Reset Complete
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                {successMessage || "Your password has been updated. You can now sign in with your new credentials."}
              </p>
              <Link
                href="/login"
                className="btn-gradient-shimmer flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold tracking-wide text-white shadow-lg"
              >
                Go to Sign In
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="mt-7 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}