"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useGoogleLogin } from "@react-oauth/google";
import { Mail, Lock, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const { login, googleLogin, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const googleLoginAction = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setBusy(true);
      setError(null);
      try {
        const token = tokenResponse.access_token;
        if (!token) throw new Error("No token received from Google");
        await googleLogin(token);
        router.replace("/dashboard");
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
      await login(email.trim().toLowerCase(), password);
      router.replace("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  // Don't flash the login form while checking session or during redirect
  if (loading || user) return null;

  return (
    <div className="ambient-mesh relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50/90 px-3 py-6 sm:px-6 lg:px-8 dark:bg-[#07070a]">
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
      <div className="glass-card card-hover-lift relative z-10 flex w-full max-w-sm sm:max-w-md lg:max-w-4xl flex-col overflow-hidden rounded-3xl sm:rounded-[2.5rem] lg:flex-row transition-all duration-500">
        
        {/* Left Panel: Form */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:w-[54%] lg:p-12">
          {/* Brand Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/60 bg-purple-50/80 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              AskDocs Workspace
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Enter your credentials to access your workspaces
            </p>
          </div>
          
          <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4 sm:space-y-4.5">
            {/* Email Input */}
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-purple-600 dark:text-zinc-500 dark:group-focus-within:text-purple-400 transition-colors">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 sm:py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-black/30 dark:focus:ring-purple-500/20 transition-all duration-300 shadow-sm"
                placeholder="name@company.com"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-purple-600 dark:text-zinc-500 dark:group-focus-within:text-purple-400 transition-colors">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 sm:py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-black/30 dark:focus:ring-purple-500/20 transition-all duration-300 shadow-sm"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="flex justify-end pr-1">
              <Link href="/forgot" className="text-xs font-semibold text-slate-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 animate-fadeIn">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={busy} 
              className="btn-gradient-shimmer mt-2 flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold tracking-wide text-white shadow-lg disabled:opacity-70 active:scale-[0.98]"
            >
              {busy ? "Signing in..." : "Sign In"}
              {!busy && <ChevronRight className="ml-1.5 h-4 w-4" />}
            </button>

            {/* Google OAuth Button */}
            <button 
              type="button" 
              onClick={() => googleLoginAction()} 
              disabled={busy}
              className="flex w-full items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] py-3 text-sm font-semibold tracking-wide text-slate-700 dark:text-zinc-200 transition-all hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] shadow-sm hover:shadow"
            >
              <svg className="mr-2.5 h-4.5 w-4.5" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
              </svg>
              Continue with Google
            </button>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                Create an account
              </Link>
            </p>
          </form>
        </div>

        {/* Right Panel: Graphic with Interactive Hover Zoom & Ambient Vignette */}
        <div className="group w-full h-44 sm:h-56 lg:h-auto lg:w-[46%] order-first lg:order-last shrink-0 p-3 sm:p-4">
          <div className="relative h-full w-full overflow-hidden rounded-2xl sm:rounded-[2rem] border border-white/20 dark:border-white/10 shadow-inner">
             {/* Atmospheric Multi-Gradient Overlays */}
             <div className="absolute inset-0 z-10 bg-gradient-to-t lg:bg-gradient-to-tr from-purple-950/60 lg:from-purple-950/40 via-transparent to-black/20 pointer-events-none" />
             <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 backdrop-blur-md text-[11px] font-medium text-white shadow-lg">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
               AI-Powered Document Intelligence
             </div>
             <Image 
               src="/login-day.jpg" 
               alt="Scenery" 
               fill
               priority
               sizes="(max-width: 768px) 100vw, 46vw"
               className="object-cover dark:hidden transform group-hover:scale-105 transition-transform duration-700 ease-out"
             />
             <Image 
               src="/login-night.jpg" 
               alt="Scenery" 
               fill
               priority
               sizes="(max-width: 768px) 100vw, 46vw"
               className="hidden object-cover dark:block transform group-hover:scale-105 transition-transform duration-700 ease-out"
             />
          </div>
        </div>

      </div>
    </div>
  );
}
