"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";
import {
  Sparkles,
  MessagesSquare,
  FileText,
  UsersRound,
  Search,
  Shield,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";

function AuroraHeroMock() {
  return (
    <div className="ask-aurora-wrap w-full max-w-[560px]">
      <div className="ask-aurora-blobs" aria-hidden>
        <span className="ask-aurora-blob ask-aurora-blob--1" />
        <span className="ask-aurora-blob ask-aurora-blob--2" />
        <span className="ask-aurora-blob ask-aurora-blob--3" />
      </div>
      <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0d0d1a]">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">AskDocs — AI Chat</span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 text-sm dark:bg-white/5 dark:text-zinc-200">
              What does our leave policy say?
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-indigo-600 px-3 py-2 text-sm text-white">
              Based on HR Handbook p.12: 24 days annual leave, carry over 5. <span className="text-indigo-200">[Source 1]</span>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Check className="h-3 w-3" /> Answer cited from 2 documents
          </div>
        </div>
        <div className="border-t border-slate-100 px-3 py-3 dark:border-white/5">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5">
            <Search className="h-4 w-4" />
            Ask a question...
            <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070b0e] dark:text-white">
      {/* Top bar — HomeNavbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-white/5 dark:bg-[#070b0e]/80 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-day.svg" alt="AskDocs" className="h-7 w-7 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-night.svg" alt="AskDocs" className="hidden h-7 w-7 dark:block" />
          <span className="text-[15px] font-bold tracking-tight">AskDocs</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <a href="#how-it-works" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10">
            How it works
          </a>
          <a href="#features" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10">
            Features
          </a>
          <Link href="/#reviews" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10">
            Reviews
          </Link>
          <a href="#contact" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} onToggle={toggle} />
          <Link
            href="/dashboard"
            className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white sm:inline"
          >
            Workspace
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="gemini-gradient-bg relative overflow-hidden border-b border-slate-100 dark:border-white/5">
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:flex lg:items-center lg:gap-10 lg:py-20">
          <div className="max-w-xl flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              AI + Team Knowledge, cited &amp; searchable
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Ask your docs.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400">
                Get answers, instantly.
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-base">
              Upload team documents, ask in plain language, and get cited AI answers. Then keep the conversation going in WhatsApp-style office chats — groups, DMs, presence, and read receipts — all in one Spotify-dark workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black dark:bg-white dark:text-black"
              >
                {user ? "Open Dashboard" : "Start for free"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Try AI Chat
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Private workspaces
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Cited answers
              </span>
              <span className="flex items-center gap-1.5">
                <UsersRound className="h-3.5 w-3.5" /> Team chats
              </span>
            </div>
          </div>
          <div className="mt-8 flex flex-1 justify-center lg:mt-0">
            <AuroraHeroMock />
          </div>
        </div>
      </section>

      {/* Sliding boxes */}
      <section className="border-y border-slate-100 bg-slate-50/50 py-6 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Everything in one place
            </h2>
            <span className="text-xs text-slate-400">Slide →</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[
              {
                icon: FileText,
                title: "Documents",
                desc: "Upload PDFs, DOCs, TXTs. Auto-chunked & embedded.",
                color: "from-indigo-500 to-violet-500",
              },
              {
                icon: Sparkles,
                title: "AI Chat",
                desc: "Ask anything. Cited answers with sources.",
                color: "from-violet-500 to-fuchsia-500",
              },
              {
                icon: MessagesSquare,
                title: "Office Chats",
                desc: "WhatsApp-style DMs & groups with presence.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: Search,
                title: "Semantic Search",
                desc: "Find any paragraph across all docs.",
                color: "from-amber-500 to-orange-500",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="group min-w-[220px] max-w-[260px] flex-1 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-[#121212]"
              >
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}
                >
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{c.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-center text-xl font-bold sm:text-2xl">How it works</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-zinc-400">
          Three steps from upload to insight. No setup, just ask.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { n: "01", t: "Create workspace", d: "Name your team space and invite colleagues." },
            { n: "02", t: "Upload docs", d: "Drop PDFs or docs. We chunk & index them." },
            { n: "03", t: "Ask & chat", d: "AI cites sources. Continue in office chats." },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-[#121212]"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-black">
                {s.n}
              </div>
              <div className="text-sm font-semibold">{s.t}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gemini-gradient-bg relative overflow-hidden border-t border-slate-100 dark:border-white/5">
        <div className="gemini-orb gemini-orb-1" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to make your docs searchable?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-zinc-400">
            Your team’s knowledge, one question away. Free to start.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 dark:bg-[#1DB954] dark:text-black"
            >
              {user ? "Go to Dashboard" : "Create account"}
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-4 py-8 text-center text-xs text-slate-400 dark:border-white/5 dark:text-zinc-600 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-day.svg" alt="" className="h-5 w-5 dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-night.svg" alt="" className="hidden h-5 w-5 dark:block" />
            AskDocs © {new Date().getFullYear()}
          </span>
          <span className="flex gap-4">
            <Link href="/dashboard" className="hover:text-slate-600 dark:hover:text-white">
              Dashboard
            </Link>
            <Link href="/chat" className="hover:text-slate-600 dark:hover:text-white">
              AI Chat
            </Link>
            <Link href="/chats" className="hover:text-slate-600 dark:hover:text-white">
              Office Chats
            </Link>
            <Link href="/documents" className="hover:text-slate-600 dark:hover:text-white">
              Documents
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
