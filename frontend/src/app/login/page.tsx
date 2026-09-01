"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Mail,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const { login, googleLogin, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already logged in, route to profile edit if details missing, else dashboard
  useEffect(() => {
    if (!loading && user) {
      const isMissing =
        !user.name?.trim() || !user.job_title?.trim() || !user.job_role?.trim();
      if (isMissing) {
        router.replace(`/profile/${user.id}?edit=true`);
      } else {
        router.replace("/dashboard");
      }
    }
  }, [loading, user, router]);

  const googleLoginAction = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setBusy(true);
      setError(null);
      try {
        const token = tokenResponse.access_token;
        if (!token) throw new Error("No token received from Google");
        const me = await googleLogin(token);
        const isMissing =
          !me.name?.trim() || !me.job_title?.trim() || !me.job_role?.trim();
        if (isMissing) {
          router.replace(`/profile/${me.id}?edit=true`);
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        setError((err as Error).message || "Google sign-in failed");
        setBusy(false);
      }
    },
    onError: () => {
      setError("Google sign-in failed or was cancelled.");
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailClean = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailClean)) {
      setError("Please enter a valid, real email address (e.g. name@domain.com)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const me = await login(email.trim().toLowerCase(), password);
      const isMissing =
        !me.name?.trim() || !me.job_title?.trim() || !me.job_role?.trim();
      if (isMissing) {
        router.replace(`/profile/${me.id}?edit=true`);
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  // Don't flash the login form while checking session or during redirect
  if (loading || user) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-3 sm:p-6 lg:p-8">
      {/* Pure Generative Gradient Wave Art Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-[#07060e] transition-colors duration-700">
        {/* Luminous Ambient Aurora Blobs */}
        <div className="absolute -top-[15%] -left-[10%] h-[60vw] w-[60vw] rounded-full bg-gradient-to-br from-purple-400/35 via-indigo-300/25 to-transparent blur-[100px] dark:from-purple-900/35 dark:via-indigo-900/25 animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-[15%] -right-[10%] h-[60vw] w-[60vw] rounded-full bg-gradient-to-tl from-cyan-400/25 via-indigo-400/20 to-pink-400/20 blur-[120px] dark:from-cyan-900/25 dark:via-purple-900/30 dark:to-indigo-900/20 animate-pulse duration-[10000ms]" />
        <div className="absolute top-[35%] left-[20%] h-[45vw] w-[45vw] rounded-full bg-gradient-to-tr from-violet-300/25 via-fuchsia-300/20 to-transparent blur-[90px] dark:from-violet-800/20 dark:via-fuchsia-900/15" />

        {/* Fluid SVG Waves Art Layer */}
        <svg
          className="absolute inset-0 h-full w-full opacity-80 dark:opacity-70 transition-opacity duration-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Light Theme Wave Gradients */}
            <linearGradient id="waveDay1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="waveDay2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="waveDay3" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
            </linearGradient>

            {/* Dark Theme Wave Gradients */}
            <linearGradient id="waveNight1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="waveNight2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#db2777" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#9333ea" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="waveNight3" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#4338ca" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Undulating Dynamic Curves */}
          <path
            d="M0,280 C320,140 460,460 760,340 C1060,220 1180,480 1440,360 L1440,900 L0,900 Z"
            className="fill-[url(#waveDay1)] dark:fill-[url(#waveNight1)]"
          />
          <path
            d="M0,420 C260,560 520,300 820,460 C1120,620 1280,360 1440,480 L1440,900 L0,900 Z"
            className="fill-[url(#waveDay2)] dark:fill-[url(#waveNight2)]"
          />
          <path
            d="M0,580 C380,460 640,700 980,560 C1220,460 1360,660 1440,600 L1440,900 L0,900 Z"
            className="fill-[url(#waveDay3)] dark:fill-[url(#waveNight3)]"
          />
        </svg>

        {/* Subtle Tech Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:32px_32px] opacity-25 dark:opacity-15 pointer-events-none" />
      </div>

      {/* Main Responsive Glass Card */}
      <div className="relative z-10 flex w-full max-w-[420px] lg:max-w-4xl flex-col overflow-hidden rounded-3xl sm:rounded-[2.25rem] border border-white/60 bg-white/80 shadow-2xl shadow-purple-950/15 backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-[#110f22]/85 dark:shadow-[0_0_80px_-15px_rgba(147,51,234,0.3)] lg:flex-row">
        
        {/* Left Panel: Form */}
        <div className="flex flex-col justify-center p-5 sm:p-8 lg:w-[54%] lg:p-10">
          {/* Header */}
          <div className="mb-5 sm:mb-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/70 bg-purple-50/80 px-3 py-1 text-[11px] font-semibold text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300 mb-2.5 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>AskDocs Workspace AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-normal">
              Sign in to your intelligent knowledge hub and team chat.
            </p>
          </div>
          
          <form onSubmit={onSubmit} className="mx-auto w-full space-y-3.5">
            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 sm:py-3 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-[#181628]"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  href="/forgot"
                  className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 sm:py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-[#181628]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2 text-center text-xs font-semibold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300 animate-in fade-in">
                {error}
              </p>
            )}

            {/* Primary Sign In Button */}
            <button 
              type="submit" 
              disabled={busy} 
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold tracking-wide text-white shadow-md shadow-purple-500/25 transition-all hover:scale-[1.02] hover:shadow-purple-500/35 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {busy ? "Signing in…" : "Sign In to Workspace"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
              <span className="absolute bg-white px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:bg-[#110f22] dark:text-zinc-500">
                or
              </span>
            </div>

            {/* Google OAuth Button */}
            <button 
              type="button" 
              onClick={() => googleLoginAction()} 
              disabled={busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200/90 bg-white/80 py-2.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
              </svg>
              Continue with Google
            </button>

            <p className="pt-1 text-center text-xs text-slate-500 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                Create an account →
              </Link>
            </p>
          </form>
        </div>

        {/* Right Panel: Clean Showcase Scenery Image (Desktop Only, 100% Pure Image) */}
        <div className="hidden lg:block lg:w-[46%] shrink-0 p-3 relative">
          <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] border border-slate-200/60 dark:border-white/10 shadow-inner">
             <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
             <Image 
               src="/login-day.jpg" 
               alt="AskDocs Workspace Day" 
               fill
               priority
               sizes="45vw"
               className="object-cover dark:hidden transition-transform duration-700 hover:scale-105"
             />
             <Image 
               src="/login-night.jpg" 
               alt="AskDocs Workspace Night" 
               fill
               priority
               sizes="45vw"
               className="hidden object-cover dark:block transition-transform duration-700 hover:scale-105"
             />
          </div>
      </div>
    </div>
  );
}
