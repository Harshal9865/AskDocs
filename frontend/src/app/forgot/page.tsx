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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-[#0B0B0F] sm:px-6 lg:px-8">
      {/* Background Wavy Patterns */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply dark:opacity-10 dark:mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%236366f1' fill-opacity='1' d='M0,192L48,202.7C96,213,192,235,288,218.7C384,203,480,149,576,144C672,139,768,181,864,192C960,203,1056,181,1152,149.3C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: "cover",
          backgroundPosition: "bottom",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply dark:opacity-5 dark:mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%238b5cf6' fill-opacity='1' d='M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: "cover",
          backgroundPosition: "bottom",
        }}
      />

      {/* Main Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl dark:bg-[#121214]">
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-day.svg" alt="AskDocs" className="h-7 w-7 dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-night.svg" alt="AskDocs" className="hidden h-7 w-7 dark:block" />
            <span className="text-[15px] font-bold tracking-tight">AskDocs</span>
          </Link>

          <h1 className="mb-2 text-center text-3xl font-bold text-slate-900 dark:text-white">
            Forgot Password?
          </h1>
          <p className="mb-8 text-center text-slate-500 dark:text-zinc-400">
            {step === "request" && "Enter your email to receive a reset code"}
            {step === "verify" && "Enter the 6-digit code sent to your email"}
            {step === "reset" && "Enter your new password"}
            {step === "success" && "Your password has been reset successfully"}
          </p>

          {step === "request" && (
            <form onSubmit={onRequestCode} className="space-y-5">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-full border border-slate-300 bg-transparent py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:ring-purple-500"
                  placeholder="Email"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2 justify-center">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center rounded-full bg-purple-600 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-purple-700 disabled:opacity-70 dark:bg-[#7b39ed] dark:hover:bg-[#6d32d3]"
              >
                {busy ? "Sending..." : "Send Reset Code"}
                {!busy && <ChevronRight className="ml-2 h-4 w-4" />}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={onVerifyCode} className="space-y-5">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full rounded-full border border-slate-300 bg-transparent py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:ring-purple-500 tracking-widest text-center text-2xl"
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2 justify-center">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center rounded-full bg-purple-600 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-purple-700 disabled:opacity-70 dark:bg-[#7b39ed] dark:hover:bg-[#6d32d3]"
              >
                {busy ? "Verifying..." : "Verify Code"}
                {!busy && <ChevronRight className="ml-2 h-4 w-4" />}
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
                  className="font-medium text-purple-600 hover:underline dark:text-purple-400"
                >
                  Resend
                </button>
              </p>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={onResetPassword} className="space-y-5">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-full border border-slate-300 bg-transparent py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:ring-purple-500"
                  placeholder="New Password (min 8 chars)"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-full border border-slate-300 bg-transparent py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:ring-purple-500"
                  placeholder="Confirm New Password"
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2 justify-center">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center rounded-full bg-purple-600 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-purple-700 disabled:opacity-70 dark:bg-[#7b39ed] dark:hover:bg-[#6d32d3]"
              >
                {busy ? "Resetting..." : "Reset Password"}
                {!busy && <ChevronRight className="ml-2 h-4 w-4" />}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-lg font-medium text-slate-700 dark:text-zinc-200">
                Password Reset Complete
              </p>
              <p className="text-slate-500 dark:text-zinc-400">
                {successMessage || "Your password has been updated. You can now log in with your new password."}
              </p>
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-full bg-purple-600 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-purple-700 dark:bg-[#7b39ed] dark:hover:bg-[#6d32d3]"
              >
                Go to Login
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-purple-600 dark:text-zinc-500 dark:hover:text-purple-400"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}