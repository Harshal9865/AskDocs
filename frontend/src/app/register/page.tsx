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
  User,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
  const { register, googleLogin, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already logged in on initial visit, skip registration
  useEffect(() => {
    if (!loading && user && !busy) router.replace("/dashboard");
  }, [loading, user, busy, router]);

  const googleLoginAction = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setBusy(true);
      setError(null);
      try {
        const token = tokenResponse.access_token;
        if (!token) throw new Error("No token received from Google");
        const me = await googleLogin(token);
        router.replace(`/profile/${me.id}?edit=true`);
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
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(password)) {
      setError("Password must have at least 8 chars, uppercase, lowercase, number, and special char (@$!%*?&)");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const me = await register(emailClean, password, name.trim());
      router.replace(`/profile/${me.id}?edit=true`);
    } catch (err) {
      setError((err as Error).message || "Registration failed");
      setBusy(false);
    }
  }

  // Don't flash the form while checking session or redirecting
  if (loading || (user && !busy)) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-purple-50/40 to-indigo-50/50 p-3 sm:p-6 lg:p-8 dark:from-[#07060e] dark:via-[#0e0c1c] dark:to-[#05040a] transition-colors duration-500">
      {/* Ambient Day/Night Animated Aura Blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-gradient-to-br from-purple-400/25 via-indigo-400/20 to-transparent blur-3xl dark:from-purple-600/20 dark:via-indigo-600/15 dark:to-transparent animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-gradient-to-tl from-indigo-400/25 via-sky-400/15 to-transparent blur-3xl dark:from-indigo-700/20 dark:via-cyan-700/15 dark:to-transparent animate-pulse" style={{ animationDelay: "2.5s" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-gradient-to-tr from-fuchsia-400/10 via-purple-400/10 to-transparent blur-3xl dark:from-fuchsia-600/10 dark:to-transparent" />

      {/* Main Responsive Glass Card */}
      <div className="relative z-10 flex w-full max-w-[420px] lg:max-w-4xl flex-col overflow-hidden rounded-3xl sm:rounded-[2.25rem] border border-slate-200/90 bg-white/90 shadow-2xl shadow-purple-500/10 backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-[#121022]/90 dark:shadow-[0_0_70px_-15px_rgba(147,51,234,0.25)] lg:flex-row">
        
        {/* Left Panel: Compact Form */}
        <div className="flex flex-col justify-center p-5 sm:p-8 lg:w-[54%] lg:p-10">
          {/* Header */}
          <div className="mb-4 sm:mb-5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50/90 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/50 dark:text-purple-300 mb-2 shadow-2xs">
              <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400 animate-pulse" /> Get Started Free
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-100 dark:to-indigo-200">
              Create your account
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Join your team workspace and chat with documents instantly.
            </p>
          </div>
          
          <form onSubmit={onSubmit} className="mx-auto w-full space-y-3">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 sm:py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-[#181628]"
                  placeholder="e.g. Alex Morgan"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Work Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 sm:py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-[#181628]"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2 sm:py-2.5 pl-10 pr-8 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-[#181628]"
                    placeholder="Min 8 chars"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Confirm
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2 sm:py-2.5 pl-10 pr-8 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:bg-[#181628]"
                    placeholder="Repeat"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2 text-center text-xs font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300 animate-in fade-in">
                {error}
              </p>
            )}

            {/* Primary Sign Up Button */}
            <button 
              type="submit" 
              disabled={busy} 
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-2.5 sm:py-3 text-xs sm:text-sm font-bold tracking-wide text-white shadow-md shadow-purple-500/25 transition-all hover:scale-[1.02] hover:shadow-purple-500/35 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {busy ? "Creating Account…" : "Create Free Account"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-0.5">
              <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
              <span className="absolute bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:bg-[#121022] dark:text-zinc-500">
                or
              </span>
            </div>

            {/* Google OAuth Button */}
            <button 
              type="button" 
              onClick={() => googleLoginAction()} 
              disabled={busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200/90 bg-white/80 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
              </svg>
              Sign up with Google
            </button>

            <p className="pt-1 text-center text-xs text-slate-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                Log In →
              </Link>
            </p>
          </form>
        </div>

        {/* Right Panel: Showcase Image (Desktop Only for Sleek Mobile Experience) */}
        <div className="hidden lg:block lg:w-[46%] shrink-0 p-3 relative">
          <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] border border-slate-200/60 dark:border-white/10 shadow-inner">
             <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0e0c1c]/90 via-[#0e0c1c]/30 to-transparent" />
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

             {/* Floating Glassmorphic Branding Banner */}
             <div className="absolute bottom-5 left-5 right-5 z-20 rounded-2xl border border-white/20 bg-white/20 p-4 backdrop-blur-md dark:border-white/10 dark:bg-black/30">
               <div className="text-xs font-bold text-white">Intelligent Team Workspace</div>
               <div className="mt-0.5 text-[11px] text-white/80 leading-relaxed">
                 Fast cited answers, document intelligence, and real-time team collaboration.
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
