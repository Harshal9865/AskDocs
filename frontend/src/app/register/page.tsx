"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useGoogleLogin } from "@react-oauth/google";
import { Mail, Lock, User, ChevronRight } from "lucide-react";

export default function RegisterPage() {
  const { register, googleLogin, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-3 py-6 sm:px-6 lg:px-8 dark:bg-[#0B0B0F]">
      {/* Background Wavy Patterns */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply dark:opacity-10 dark:mix-blend-screen"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%236366f1' fill-opacity='1' d='M0,192L48,202.7C96,213,192,235,288,218.7C384,203,480,149,576,144C672,139,768,181,864,192C960,203,1056,181,1152,149.3C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`, 
          backgroundSize: 'cover',
          backgroundPosition: 'bottom'
        }}
      />
      <div 
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply dark:opacity-5 dark:mix-blend-screen"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%238b5cf6' fill-opacity='1' d='M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`, 
          backgroundSize: 'cover',
          backgroundPosition: 'bottom'
        }}
      />

      {/* Main Card */}
      <div className="relative z-10 flex w-full max-w-sm sm:max-w-md lg:max-w-4xl flex-col overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-white/95 shadow-2xl border border-slate-200/80 dark:border-white/10 dark:bg-[#121214]/95 backdrop-blur-xl lg:flex-row">
        
        {/* Left Panel: Form */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:w-[55%] lg:p-12">
          <h1 className="mb-6 sm:mb-8 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Create Account <span className="inline-block animate-wave origin-bottom-right">✨</span>
          </h1>
          
          <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-3.5 sm:space-y-4">
            
            {/* Name Input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <User className="h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-full border border-slate-300 bg-transparent py-2.5 sm:py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:ring-purple-500 transition-all"
                placeholder="Full Name"
                required
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Mail className="h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-full border border-slate-300 bg-transparent py-2.5 sm:py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:ring-purple-500 transition-all"
                placeholder="Email address"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Lock className="h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-full border border-slate-300 bg-transparent py-2.5 sm:py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:ring-purple-500 transition-all"
                placeholder="Password"
                required
              />
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Lock className="h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
              </div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="block w-full rounded-full border border-slate-300 bg-transparent py-2.5 sm:py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500 dark:focus:ring-purple-500 transition-all"
                placeholder="Confirm Password"
                required
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-xs font-medium text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <button 
              type="submit" 
              disabled={busy} 
              className="mt-2 sm:mt-3 flex w-full items-center justify-center rounded-full bg-purple-600 py-3 sm:py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-purple-700 active:scale-[0.99] disabled:opacity-70 dark:bg-[#7b39ed] dark:hover:bg-[#6d32d3] shadow-md shadow-purple-600/20"
            >
              {busy ? "Creating Account..." : "Sign Up"}
              {!busy && <ChevronRight className="ml-1.5 h-4 w-4" />}
            </button>

            <button 
              type="button" 
              onClick={() => googleLoginAction()} 
              disabled={busy}
              className="flex w-full items-center justify-center rounded-full border border-slate-300 dark:border-zinc-800 bg-white/50 dark:bg-white/[0.02] py-2.5 sm:py-3 text-sm font-bold tracking-wide text-slate-700 dark:text-zinc-200 transition-all hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.99]"
            >
              <svg className="mr-2.5 h-4.5 w-4.5" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
              </svg>
              Sign up with Google
            </button>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-500">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                Log In
              </Link>
            </p>
          </form>
        </div>

        {/* Right Panel: Graphic (Visible at the top on mobile, right on desktop) */}
        <div className="w-full h-36 sm:h-48 lg:h-auto lg:w-[45%] order-first lg:order-last shrink-0 p-3 sm:p-4">
          <div className="relative h-full w-full overflow-hidden rounded-2xl sm:rounded-[2rem]">
             {/* Subtle dark gradient overlay on bottom left */}
             <div className="absolute inset-0 z-10 bg-gradient-to-t lg:bg-gradient-to-tr from-[#121214]/60 lg:from-[#121214]/40 via-transparent to-transparent" />
             
             {/* Dynamic terraces image based on theme */}
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
