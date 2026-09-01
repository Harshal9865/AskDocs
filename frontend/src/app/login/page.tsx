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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-3 py-6 sm:px-6 lg:px-8 dark:bg-[#090810]">
      {/* Dynamic Animated Gradient Background Blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-500/25 to-indigo-500/0 blur-3xl dark:from-purple-900/30 dark:to-indigo-900/0 animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-indigo-500/25 to-cyan-500/0 blur-3xl dark:from-indigo-900/30 dark:to-cyan-900/0 animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Main Glass Card */}
      <div className="relative z-10 flex w-full max-w-sm sm:max-w-md lg:max-w-4xl flex-col overflow-hidden rounded-[2.25rem] sm:rounded-[2.75rem] border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-[#121020]/90 dark:shadow-[0_0_80px_-20px_rgba(147,51,234,0.18)] lg:flex-row">
        
        {/* Left Panel: Form */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:w-[55%] lg:p-12">
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/80 px-3 py-1 text-[11px] font-bold text-purple-700 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300 mb-3 shadow-xs">
              <Sparkles className="h-3 w-3" /> AskDocs Workspace AI
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-100 dark:to-indigo-200">
              Welcome back
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Sign in to your intelligent workspace to access documents & chats.
            </p>
          </div>
          
          <form onSubmit={onSubmit} className="mx-auto w-full space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-zinc-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-3 sm:py-3.5 pl-11 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/70 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-[#181628]"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  href="/forgot"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-zinc-500">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 py-3 sm:py-3.5 pl-11 pr-11 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/70 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-[#181628]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-center text-xs font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300 animate-in fade-in">
                {error}
              </p>
            )}

            {/* Primary Sign In Button */}
            <button 
              type="submit" 
              disabled={busy} 
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-3 sm:py-3.5 text-xs sm:text-sm font-bold tracking-wide text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-102 hover:shadow-purple-500/35 active:scale-98 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign In to Workspace"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>

            {/* Google OAuth Button */}
            <button 
              type="button" 
              onClick={() => googleLoginAction()} 
              disabled={busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-slate-200/90 bg-white/80 py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:scale-101 active:scale-98 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
              </svg>
              Continue with Google
            </button>

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                Create an account →
              </Link>
            </p>
          </form>
        </div>

        {/* Right Panel: Aesthetic Showcase with Glass Badges */}
        <div className="w-full h-48 sm:h-64 lg:h-auto lg:w-[45%] order-first lg:order-last shrink-0 p-3 sm:p-4 relative">
          <div className="relative h-full w-full overflow-hidden rounded-2xl sm:rounded-[2.25rem]">
             <div className="absolute inset-0 z-10 bg-gradient-to-t lg:bg-gradient-to-tr from-[#121020]/80 via-[#121020]/30 to-transparent" />
             <Image 
               src="/login-day.jpg" 
               alt="Scenery" 
               fill
               priority
               sizes="(max-width: 768px) 100vw, 45vw"
               className="object-cover dark:hidden"
             />
             <Image 
               src="/login-night.jpg" 
               alt="Scenery" 
               fill
               priority
               sizes="(max-width: 768px) 100vw, 45vw"
               className="hidden object-cover dark:block"
             />
          </div>
        </div>

      </div>
    </div>
  );
}
