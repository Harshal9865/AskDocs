"use client";

import { useState } from "react";
import Link from "next/link";
import { AccordionItem } from "@/components/Accordion";
import {
  Bot,
  FileText,
  HelpCircle,
  Mail,
  MessageSquare,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from "lucide-react";

interface FAQ {
  q: string;
  a: React.ReactNode;
  category: "ai" | "files" | "roles" | "privacy" | "troubleshooting";
  icon: React.ReactNode;
  badge: string;
  gradient: string;
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const faqs: FAQ[] = [
    {
      q: "How does the AI answer questions?",
      a: "When you upload a document, it is split into chunks and embedded into a vector index. When you ask a question, we find the most similar chunks, show them to the AI, and it answers using only that content — always citing which document and chunk each claim came from.",
      category: "ai",
      icon: <Bot className="h-4 w-4" />,
      badge: "AI & Vector Search",
      gradient: "from-violet-600 via-indigo-600 to-blue-600",
    },
    {
      q: "What file types can I upload?",
      a: "PDF, DOCX, Markdown (.md) and plain text (.txt), up to 20 MB each. Scanned/image-only PDFs are not supported yet (no OCR).",
      category: "files",
      icon: <FileText className="h-4 w-4" />,
      badge: "File Formats",
      gradient: "from-cyan-500 via-blue-600 to-indigo-600",
    },
    {
      q: "What do the roles mean?",
      a: "Admins manage everything (members, deletion, settings, activity log). Members upload documents and chat. Viewers can read documents and ask questions but cannot change anything.",
      category: "roles",
      icon: <Users className="h-4 w-4" />,
      badge: "Workspace Roles",
      gradient: "from-amber-500 via-orange-500 to-rose-500",
    },
    {
      q: "Who can see my Office Chats?",
      a: "Only the participants. Even workspace admins cannot read your direct messages or group chats.",
      category: "privacy",
      icon: <MessageSquare className="h-4 w-4" />,
      badge: "Chat Privacy",
      gradient: "from-emerald-500 via-teal-600 to-cyan-600",
    },
    {
      q: "What is the Knowledge-Gap Radar?",
      a: (
        <>
          On the{" "}
          <Link href="/insights" className="font-semibold text-purple-600 hover:underline dark:text-purple-400">
            Insights
          </Link>{" "}
          page you&apos;ll see every question the AI couldn&apos;t answer from your documents. Treat this list as a to-do list of exactly what to document next.
        </>
      ),
      category: "ai",
      icon: <Radio className="h-4 w-4" />,
      badge: "Knowledge Radar",
      gradient: "from-fuchsia-600 via-purple-600 to-indigo-600",
    },
    {
      q: "Someone deleted a document — can we get it back?",
      a: (
        <>
          Deleted documents go to the{" "}
          <Link href="/trash" className="font-semibold text-purple-600 hover:underline dark:text-purple-400">
            Trash
          </Link>{" "}
          page where workspace admins can restore them or delete them permanently.
        </>
      ),
      category: "files",
      icon: <Trash2 className="h-4 w-4" />,
      badge: "Trash & Recovery",
      gradient: "from-rose-500 via-pink-600 to-purple-600",
    },
    {
      q: "The first answer after a break is slow — why?",
      a: "On the free hosting tier the backend sleeps after ~15 minutes of inactivity. The first request wakes it up (30–60 seconds); everything after that is super fast.",
      category: "troubleshooting",
      icon: <Zap className="h-4 w-4" />,
      badge: "Performance",
      gradient: "from-yellow-500 via-amber-500 to-orange-500",
    },
    {
      q: "Is my data isolated from other teams?",
      a: "Yes. Every query is strictly scoped to your workspace. Non-members get 'not found' responses even for existing resources — they can't even confirm a workspace exists.",
      category: "privacy",
      icon: <ShieldCheck className="h-4 w-4" />,
      badge: "Data Isolation",
      gradient: "from-emerald-600 via-teal-600 to-blue-600",
    },
  ];

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "ai", label: "AI & Search" },
    { id: "files", label: "Files & Uploads" },
    { id: "roles", label: "Roles & Access" },
    { id: "privacy", label: "Privacy & Security" },
    { id: "troubleshooting", label: "Performance" },
  ];

  const filtered = faqs.filter((f) => {
    const matchesCat = activeCategory === "all" || f.category === activeCategory;
    const matchesQuery =
      !query.trim() ||
      f.q.toLowerCase().includes(query.toLowerCase()) ||
      f.badge.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="relative mx-auto max-w-3xl pb-12">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-72 w-full max-w-2xl -translate-x-1/2 overflow-hidden opacity-30 blur-3xl dark:opacity-20" aria-hidden>
        <div className="absolute -top-10 left-1/4 h-56 w-56 rounded-full bg-purple-500 animate-pulse" style={{ animationDuration: "7s" }} />
        <div className="absolute top-10 right-1/4 h-56 w-56 rounded-full bg-indigo-500 animate-pulse" style={{ animationDuration: "9s", animationDelay: "1s" }} />
        <div className="absolute top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-rose-500 animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
      </div>

      {/* Hero Header */}
      <div className="mb-8 text-center sm:mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/80 px-3.5 py-1 text-xs font-semibold text-purple-700 backdrop-blur-md shadow-xs dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300">
          <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "10s" }} />
          Knowledge Base & Support
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:via-indigo-300 dark:to-blue-400">
            Help & Frequently Asked Questions
          </span>
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 dark:text-zinc-400">
          Instant answers to how AskDocs AI indexing, search, security, and team collaboration works.
        </p>

        {/* Quick Search */}
        <div className="relative mx-auto mt-6 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs, topics, or features…"
            className="w-full rounded-2xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm shadow-sm backdrop-blur-md transition-all outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#141416]/90 dark:text-white"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeCategory === c.id
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/25"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#121214]">
            <HelpCircle className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No questions matched &ldquo;{query}&rdquo;</p>
            <p className="mt-1 text-xs text-slate-500">Try another search keyword or reach out to us directly.</p>
          </div>
        ) : (
          filtered.map((f, i) => (
            <AccordionItem
              key={f.q}
              question={f.q}
              answer={f.a}
              icon={f.icon}
              badge={f.badge}
              gradient={f.gradient}
              defaultOpen={i === 0 && !query}
            />
          ))
        )}
      </div>

      {/* Direct Help / Quick Support Gradient Banner */}
      <div className="relative mt-12 overflow-hidden rounded-3xl border border-purple-200/60 bg-gradient-to-br from-indigo-900 via-[#1e1b4b] to-[#0f172a] p-6 sm:p-8 text-white shadow-xl dark:border-white/10">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-purple-500/20 blur-2xl" aria-hidden />
        <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-indigo-500/20 blur-2xl" aria-hidden />

        <div className="relative z-10 flex flex-col items-center justify-between gap-5 sm:flex-row text-center sm:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold backdrop-blur-md">
              <Mail className="h-3.5 w-3.5" /> Need personalized help?
            </div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Can&apos;t find what you&apos;re looking for?</h2>
            <p className="mt-1 max-w-md text-xs sm:text-sm text-purple-200/80">
              Our team is here to assist with document indexing, workspace setup, and custom team integrations.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-2.5">
            <a
              href="mailto:hello@askdocs.app"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-purple-900 shadow-md hover:bg-purple-50 transition-transform active:scale-95"
            >
              <Mail className="h-4 w-4" /> Contact Support
            </a>
            <Link
              href="/chats"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-transform active:scale-95"
            >
              <MessageSquare className="h-4 w-4" /> Office Chats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
