"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  MessagesSquare,
  FileText,
  UsersRound,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Heart,
  Target,
  Globe,
  Rocket,
} from "lucide-react";

const VALUES = [
  {
    icon: Target,
    title: "Answers you can trust",
    desc: "Every claim carries a citation. If our AI can't ground an answer in your documents, it says so instead of guessing.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: Zap,
    title: "Speed is a feature",
    desc: "Sub-second retrieval and a two-second median answer. Knowledge that arrives late might as well not arrive at all.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Privacy by default",
    desc: "Your documents belong to your workspace alone. Role-based access, recoverable trash and a complete activity log come standard.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Heart,
    title: "Software that feels human",
    desc: "WhatsApp-style chats, presence dots, read receipts — tools people already love, applied to the way teams actually work.",
    color: "from-rose-500 to-red-500",
  },
];

const TIMELINE = [
  { year: "2024", title: "The itch", desc: "Our founding team spent hours digging through PDFs for answers that were written down all along. AskDocs started as a weekend hack to end that." },
  { year: "2025", title: "First teams", desc: "Cited answers landed, then semantic search. Twelve pilot workspaces replaced their internal wikis within a month." },
  { year: "2025", title: "Office Chats", desc: "We noticed teams kept switching to WhatsApp to discuss what they found — so we brought the chat inside, presence dots and read receipts included." },
  { year: "2026", title: "One workspace", desc: "Friends across workspaces, public discovery, conflict detection and the aurora ask box. Everything knowledge work needs, in one place." },
];

const TEAM_STATS = [
  { v: "12k+", l: "people using AskDocs daily" },
  { v: "50k+", l: "documents indexed" },
  { v: "6", l: "time zones covered" },
  { v: "1", l: "mission: kill busywork" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070b0e] dark:text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/70 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-white/5 dark:bg-[#070b0e]/70 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent dark:via-white/10" aria-hidden />
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-day.svg" alt="AskDocs" className="h-7 w-7 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-night.svg" alt="AskDocs" className="hidden h-7 w-7 dark:block" />
          <span className="text-[15px] font-bold tracking-tight">AskDocs</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
      </header>

      {/* Hero */}
      <section className="gemini-gradient-bg relative overflow-hidden border-b border-slate-100 dark:border-white/5">
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Rocket className="h-3.5 w-3.5" /> About us
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            We turn scattered documents into
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400">
              conversations your team can trust.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-base">
            AskDocs exists because knowledge work shouldn&apos;t mean archaeology. We believe every team deserves
            instant, cited answers from its own documents — plus a place to talk about them without switching apps.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
            >
              Join AskDocs <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#story"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              Read our story
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-slate-100 py-8 dark:border-white/5">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 text-center sm:grid-cols-4 sm:px-6">
          {TEAM_STATS.map((s) => (
            <div key={s.l}>
              <div className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent dark:from-indigo-400 dark:to-emerald-400">
                {s.v}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Our mission</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              Every organization drowns in its own documents. Policies, specs, contracts, research — written once,
              lost forever. People re-ask the same questions, make decisions on stale info, and waste hours searching.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              AskDocs pairs serious retrieval infrastructure with interfaces people genuinely enjoy: ask a question,
              get an answer with the exact source attached, then keep the discussion going in office chats that feel
              like the messaging apps you already use.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: FileText, label: "Documents understood", sub: "chunked & embedded on upload" },
              { icon: Sparkles, label: "Answers cited", sub: "source attached to every claim" },
              { icon: MessagesSquare, label: "Chats built-in", sub: "DMs & groups with presence" },
              { icon: UsersRound, label: "Friends anywhere", sub: "across workspaces" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121212]">
                <c.icon className="mb-2 h-5 w-5 text-indigo-500 dark:text-[#1DB954]" />
                <div className="text-xs font-semibold">{c.label}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-500">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="story" className="scroll-mt-16 border-y border-slate-100 bg-slate-50/50 py-12 dark:border-white/5 dark:bg-white/[0.02] sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-2xl">What we believe</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500 dark:text-zinc-400">
            Four principles behind every line of AskDocs.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#121212]"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${v.color} text-white`}>
                  <v.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{v.title}</div>
                <div className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-center text-xl font-bold sm:text-2xl">How we got here</h2>
        <div className="relative mt-10 space-y-8 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-px before:bg-gradient-to-b before:from-indigo-400 before:via-purple-400 before:to-emerald-400 dark:before:via-[#1DB954]/60">
          {TIMELINE.map((t) => (
            <div key={t.title} className="relative flex gap-5 pl-1">
              <span className="z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#121212]">
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500" />
              </span>
              <div className="min-w-0 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-[#1DB954]">{t.year}</span>
                <div className="text-sm font-semibold">{t.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gemini-gradient-bg relative overflow-hidden border-t border-slate-100 dark:border-white/5">
        <div className="gemini-orb gemini-orb-2" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <Globe className="mx-auto mb-3 h-6 w-6 text-indigo-500 dark:text-[#1DB954]" />
          <h2 className="text-2xl font-bold sm:text-3xl">Come build with us</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-zinc-400">
            We&apos;re a small team shipping fast and building in public. Try AskDocs free, or say hello — we read everything.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
            >
              Create free account
            </Link>
            <a
              href="mailto:hello@askdocs.app"
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              hello@askdocs.app
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-[#1DB954]">
              Log in
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50/60 py-8 dark:border-white/5 dark:bg-black">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-400 dark:text-zinc-600 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} AskDocs. All rights reserved.</span>
          <Link href="/" className="font-medium text-indigo-600 hover:underline dark:text-[#1DB954]">
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
