"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const googleLoginAction = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setBusy(true);
      setError(null);
      try {
        await googleLogin(tokenResponse.access_token);
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
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

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0d0d1f]">
      {/* Left panel: Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold dark:text-white">
               <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
               </span>
               AskDocs
            </h1>
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in to your account</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-[#1DB954] dark:hover:text-[#1ed760]">
                Register
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300" htmlFor="email">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-[#1a1a2e] dark:text-white dark:ring-white/10 dark:focus:ring-[#1DB954] sm:text-sm sm:leading-6"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <div className="mt-2">
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={setPassword}
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                  </p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
                  >
                    {busy ? "Signing in\u2026" : "Sign in"}
                  </button>
                </div>
              </form>

              <div className="mt-10">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm font-medium leading-6">
                    <span className="bg-white px-6 text-slate-900 dark:bg-[#0d0d1f] dark:text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => googleLoginAction()}
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:ring-transparent dark:bg-[#1a1a2e] dark:text-white dark:ring-white/10 dark:hover:bg-white/5"
                  >
                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                      <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                      <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                      <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
                    </svg>
                    <span className="text-sm font-semibold leading-6">Google</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Graphic */}
      <div className="relative hidden w-0 flex-1 lg:block bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900" />
        {/* Abstract background shapes */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500 opacity-20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-purple-600 opacity-20 blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-[0.15] mix-blend-overlay" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg">
             <div className="mb-8 flex justify-center">
               <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-2xl backdrop-blur-xl ring-1 ring-white/20">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
               </span>
             </div>
             <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Unleash your team's collective brain.</h2>
             <p className="mt-6 text-lg leading-8 text-indigo-200">
               Search instantly across all your company documents, wikis, and chats. Ask questions and get intelligent, cited answers in seconds.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

