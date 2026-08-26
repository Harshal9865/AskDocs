"use client";

/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";
import Avatar from "@/components/Avatar";
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
  Star,
  Mail,
  Globe,
  AtSign,
  MessageCircle,
  Heart,
  Quote,
  Activity,
  Target,
  Lock,
  FileKey,
  Plug2,
  ArrowUp,
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

const REVIEWS = [
  {
    name: "Aarav Mehta",
    role: "Engineering Lead, FintechCo",
    quote:
      "We dumped 200+ PDFs into AskDocs and now onboarding new engineers takes days, not weeks. The cited answers mean I never second-guess the AI.",
    stars: 5,
    initials: "AM",
    color: "bg-indigo-500",
  },
  {
    name: "Sofia Reyes",
    role: "Product Manager",
    quote:
      "The office chats feel exactly like WhatsApp — my team actually uses them. Presence dots and read receipts were the killer detail for us.",
    stars: 5,
    initials: "SR",
    color: "bg-emerald-500",
  },
  {
    name: "Daniel Kim",
    role: "Founder, 12-person startup",
    quote:
      "Ask anything, get a source. That's the whole pitch and it delivers. We killed our internal wiki because of this tool.",
    stars: 5,
    initials: "DK",
    color: "bg-purple-500",
  },
  {
    name: "Priya Nair",
    role: "HR Manager",
    quote:
      "Policy questions used to eat hours of my week. Now people ask AskDocs and only come to me for the edge cases. The conflict warnings are genius.",
    stars: 4,
    initials: "PN",
    color: "bg-rose-500",
  },
  {
    name: "Tomás Oliveira",
    role: "CTO, HealthTech",
    quote:
      "Spotify-dark UI that engineers actually love, and the aurora ask box makes it feel alive. Underneath it's serious retrieval infrastructure.",
    stars: 5,
    initials: "TO",
    color: "bg-amber-500",
  },
  {
    name: "Emily Chen",
    role: "Operations, Logistics",
    quote:
      "Cross-workspace friends + chat means our contractors and full-timers finally talk in one place. Setup took 10 minutes.",
    stars: 5,
    initials: "EC",
    color: "bg-sky-500",
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Smart Documents",
    desc: "Upload PDFs, DOCX, TXT & CSV. AskDocs auto-chunks, embeds and indexes every paragraph so nothing is lost.",
    color: "from-indigo-500 to-violet-500",
    glow: "glow-indigo",
  },
  {
    icon: Sparkles,
    title: "Cited AI Answers",
    desc: "Every answer links back to the exact document and chunk. Conflict detection warns when sources disagree.",
    color: "from-violet-500 to-fuchsia-500",
    glow: "glow-violet",
  },
  {
    icon: MessagesSquare,
    title: "WhatsApp-style Chats",
    desc: "DMs, group chats, presence dots, read receipts (✓✓), typing indicators and emoji — your team already knows it.",
    color: "from-emerald-500 to-teal-500",
    glow: "glow-emerald",
  },
  {
    icon: UsersRound,
    title: "Friends, Any Workspace",
    desc: "Add friends across workspaces, see who's online, jump into a DM — Instagram-style management, zero friction.",
    color: "from-sky-500 to-cyan-500",
    glow: "glow-sky",
  },
  {
    icon: Search,
    title: "Semantic Search",
    desc: "Search by meaning, not keywords. Find the paragraph you half-remember across every document you own.",
    color: "from-amber-500 to-orange-500",
    glow: "glow-amber",
  },
  {
    icon: Shield,
    title: "Private Workspaces",
    desc: "Public or private spaces, role-based access (admin / member / viewer), soft-delete trash and full activity log.",
    color: "from-rose-500 to-red-500",
    glow: "glow-rose",
  },
];

const FEATURE_MARQUEE = [
  { icon: FileText, title: "Documents", desc: "Upload PDFs, DOCs, TXTs. Auto-chunked & embedded.", color: "from-indigo-500 to-violet-500" },
  { icon: Sparkles, title: "AI Chat", desc: "Ask anything. Cited answers with sources.", color: "from-violet-500 to-fuchsia-500" },
  { icon: MessagesSquare, title: "Office Chats", desc: "WhatsApp-style DMs & groups with presence.", color: "from-emerald-500 to-teal-500" },
  { icon: Search, title: "Semantic Search", desc: "Find any paragraph across all docs.", color: "from-amber-500 to-orange-500" },
  { icon: UsersRound, title: "Friends", desc: "Cross-workspace friends with online status.", color: "from-sky-500 to-cyan-500" },
  { icon: Shield, title: "Workspaces", desc: "Public or private, roles, trash & activity log.", color: "from-rose-500 to-red-500" },
];

const TRUSTED_LOGOS = [
  { name: "FintechCo", color: "from-indigo-400 to-indigo-600" },
  { name: "HealthTech", color: "from-emerald-400 to-teal-600" },
  { name: "LogiStack", color: "from-amber-400 to-orange-600" },
  { name: "DevHive", color: "from-sky-400 to-cyan-600" },
  { name: "Nimbus Labs", color: "from-violet-400 to-purple-600" },
  { name: "PixelForge", color: "from-rose-400 to-red-600" },
  { name: "Quantumly", color: "from-fuchsia-400 to-pink-600" },
];

const FAQS = [
  {
    q: "How does AskDocs cite its answers?",
    a: "Every answer is generated from retrieved chunks of your documents. AskDocs attaches the source document, page and paragraph to each claim, so you can verify anything in one click.",
  },
  {
    q: "Which file types are supported?",
    a: "PDF, DOCX, TXT and CSV today — with more formats landing regularly. Files are chunked, embedded and indexed automatically on upload.",
  },
  {
    q: "Can I chat with my team inside AskDocs?",
    a: "Yes. Office Chats give you WhatsApp-style DMs and groups with presence dots, read receipts, typing indicators and emoji reactions — no context switch needed.",
  },
  {
    q: "Is my data private?",
    a: "Workspaces can be public or private with role-based access (admin / member / viewer). Deleted items go to a recoverable trash, and every action is recorded in the activity log.",
  },
  {
    q: "Do answers warn me when sources disagree?",
    a: "Yes — conflict detection flags when two documents contradict each other so your team never acts on stale information.",
  },
  {
    q: "How long does setup take?",
    a: "Under five minutes: create a workspace, invite colleagues by email, drag in documents, and ask your first question.",
  },
];

function StatCounter({ value, suffix, label, icon: Icon, color }: { value: number; suffix: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let current = 0;
          const duration = 2000;
          const step = value / (duration / 16);
          const timer = setInterval(() => {
            current += step;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 16);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <Icon className={`mx-auto mb-2 h-6 w-6 ${color}`} />
      <div className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        <span className={color}>{count.toLocaleString()}</span><span className="text-slate-500 dark:text-zinc-400">{suffix}</span>
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

function Reveal({ children, dir = "up", delay = 0, className = "" }: { children: React.ReactNode; dir?: "left" | "right" | "up"; delay?: number; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const hidden =
    dir === "left"
      ? "opacity-0 -translate-x-16"
      : dir === "right"
      ? "opacity-0 translate-x-16"
      : "opacity-0 translate-y-10";

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out will-change-transform ${visible ? "opacity-100 translate-x-0 translate-y-0" : hidden}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070b0e] dark:text-white">
      {/* Top bar — HomeNavbar */}
      <header className={`sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 transition-colors duration-300 sm:px-6 ${
        scrolled
          ? "border-slate-200/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-white/5 dark:bg-[#070b0e]/70 dark:supports-[backdrop-filter]:bg-[#070b0e]/60"
          : "border-transparent bg-white dark:bg-[#070b0e]"
      }`}>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent dark:via-white/10" aria-hidden />
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-day.svg" alt="AskDocs" className="h-7 w-7 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-night.svg" alt="AskDocs" className="hidden h-7 w-7 dark:block" />
          <span className="text-[15px] font-bold tracking-tight">AskDocs</span>
        </Link>
        <nav className="home-nav hidden items-center gap-6 md:flex">
          <a href="#how-it-works" className="px-1 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white">
            How it works
          </a>
          <a href="#features" className="px-1 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white">
            Features
          </a>
          <a href="#reviews" className="px-1 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white">
            Reviews
          </a>
          <Link href="/about" className="px-1 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white">
            About us
          </Link>
          <a href="#faq" className="px-1 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white">
            FAQ
          </a>
          <a href="#contact" className="px-1 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white">
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
            <Link href={`/profile/${user.id}`} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-0.5 pr-2.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" title="Your profile">
              <Avatar
                name={user.name}
                size={28}
                src={user.avatar_kind === "upload" ? undefined : undefined}
                stickerId={user.avatar_kind === "sticker" ? user.avatar_value ?? null : null}
              />
              <span className="hidden max-w-[80px] truncate text-xs font-medium sm:inline">{user.name.split(" ")[0]}</span>
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

      {/* Live activity ticker — thin strip with pulse */}
      <section className="border-b border-slate-200/60 bg-white/50 dark:border-white/10 dark:bg-black" aria-label="Live activity">
        <div className="mx-auto max-w-6xl px-4 py-2 overflow-hidden">
          <div className="flex items-center gap-4 opacity-90" style={{ animation: "marquee 50s linear infinite" }}>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>Sarah uploaded "Q3 Budget.pdf"</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-indigo-500 animate-pulse" />
              <span>Mike asked "What&apos;s the leave policy?"</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-amber-500 animate-pulse" />
              <span>AI answered with 3 citations</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-rose-500 animate-pulse" />
              <span>New document "Q3 Roadmap.pdf" uploaded</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-sky-500 animate-pulse" />
              <span>Team "Engineering" created workspace</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-violet-500 animate-pulse" />
              <span>5 new friends added this hour</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>Sarah uploaded "Q3 Budget.pdf"</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-indigo-500 animate-pulse" />
              <span>Mike asked "What&apos;s the leave policy?"</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-amber-500 animate-pulse" />
              <span>AI answered with 3 citations</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-rose-500 animate-pulse" />
              <span>New document "Q3 Roadmap.pdf" uploaded</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-sky-500 animate-pulse" />
              <span>Team "Engineering" created workspace</span>
            </span>
            <span className="flex items-center gap-2 shrink-0 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
              <Activity className="h-3 w-3 text-violet-500 animate-pulse" />
              <span>5 new friends added this hour</span>
            </span>
          </div>
        </div>
      </section>

      {/* Stats counter — count-up on scroll */}
      <section className="relative py-10 overflow-hidden" aria-label="Statistics">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-emerald-500/5" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <StatCounter value={50000} suffix="+" label="Documents indexed" icon={FileText} color="text-indigo-500" />
            <StatCounter value={12000} suffix="+" label="Teams onboarded" icon={UsersRound} color="text-emerald-500" />
            <StatCounter value={99} suffix="%" label="Answer accuracy" icon={Target} color="text-amber-500" />
            <StatCounter value={2} suffix="s" label="Avg response time" icon={Zap} color="text-rose-500" />
          </div>
        </div>
      </section>

      {/* Trusted-by — calm static row, no auto-scroll */}
      <section className="border-y border-slate-100 py-6 dark:border-white/5" aria-label="Trusted by">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-zinc-600">
          Trusted by teams at
        </p>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 px-4 sm:gap-10">
          {TRUSTED_LOGOS.map((l) => (
            <span
              key={l.name}
              className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-400 transition-all hover:scale-[1.02] hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <span className={`h-3.5 w-3.5 rounded-sm bg-gradient-to-br ${l.color} opacity-80`} />
              {l.name}
            </span>
          ))}
        </div>
      </section>

      {/* Hero */}
      <section className="gemini-gradient-bg relative overflow-hidden border-b border-slate-100 dark:border-white/5">
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:flex lg:items-center lg:gap-10 lg:py-20">
          <Reveal dir="left" className="max-w-xl flex-1">
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
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                See how it works
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-500">
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
          </Reveal>
          <Reveal dir="right" delay={150} className="mt-8 flex flex-1 justify-center lg:mt-0">
            <AuroraHeroMock />
          </Reveal>
        </div>
      </section>

      {/* Features teaser — calm, swipeable row (no auto-marquee) */}
      <section id="features" className="scroll-mt-16 border-y border-slate-100 bg-slate-50/50 py-6 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Everything in one place
            </h2>
            <span className="hidden text-xs text-slate-400 sm:inline">drag to explore →</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FEATURE_MARQUEE.map((c) => (
              <div
                key={c.title}
                className="group min-w-[220px] max-w-[260px] flex-1 shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-[#121212]"
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

      {/* Features deep-dive */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-center text-xl font-bold sm:text-2xl">Built for how teams actually work</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-zinc-400">
          Six pillars that make AskDocs feel less like software and more like a teammate.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} dir={i % 2 === 0 ? "left" : "right"} delay={(i % 3) * 100}>
              <div
                className={`glow-card ${f.glow} h-full rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121212]`}
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{f.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why AskDocs — comparison vs alternatives */}
      <section className="scroll-mt-16 border-y border-slate-100 bg-slate-50/50 py-12 dark:border-white/5 dark:bg-white/[0.02] sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal dir="up">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Why AskDocs</p>
            <h2 className="mt-2 text-center text-xl font-bold sm:text-2xl">Built different, for a reason</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-zinc-400">
              We compared AskDocs against the tools your team already uses. Here's what changes.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              {
                tool: "vs Confluence",
                icon: FileText,
                color: "glow-indigo",
                gradient: "from-indigo-500 to-violet-500",
                advantage: "No digging through 50-page wikis",
                detail: "Confluence requires manual organization and keyword search. AskDocs auto-chunks, embeds and answers with citations — your team asks in plain language.",
              },
              {
                tool: "vs Notion AI",
                icon: Search,
                color: "glow-emerald",
                gradient: "from-emerald-500 to-teal-500",
                advantage: "Answers across ALL your docs, not one workspace",
                detail: "Notion AI only searches within one workspace. AskDocs indexes across every document you own, with conflict detection when sources disagree.",
              },
              {
                tool: "vs ChatGPT",
                icon: Sparkles,
                color: "glow-violet",
                gradient: "from-violet-500 to-fuchsia-500",
                advantage: "Cited answers, not hallucinations",
                detail: "ChatGPT guesses from training data. AskDocs retrieves from YOUR documents, links every claim to a source, and warns when documents contradict each other.",
              },
            ].map((c, i) => (
              <Reveal key={c.tool} dir={i === 1 ? "up" : i === 0 ? "left" : "right"} delay={i * 100}>
                <div className={`glow-card ${c.color} h-full rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121212]`}>
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{c.tool}</div>
                  <div className="mt-1.5 text-sm font-bold">{c.advantage}</div>
                  <div className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{c.detail}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 border-y border-slate-100 bg-slate-50/50 py-12 dark:border-white/5 dark:bg-white/[0.02] sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-2xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-zinc-400">
            From zero to cited answers in under five minutes.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { n: "01", t: "Create your workspace", d: "Sign up, name your team space, and invite colleagues by email — they get a notification to accept." },
              { n: "02", t: "Upload your documents", d: "Drag in PDFs, DOCX, TXT or CSV. AskDocs chunks, embeds and indexes every page automatically." },
              { n: "03", t: "Ask & collaborate", d: "Ask in plain language and get answers with citations. Disagreements? Continue the thread in office chats." },
            ].map((s, i) => (
              <Reveal key={s.n} dir="up" delay={i * 120}>
                <div
                  className="relative h-full rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-[#121212]"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-black">
                    {s.n}
                  </div>
                  <div className="text-sm font-semibold">{s.t}</div>
                  <div className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{s.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { v: "< 5 min", l: "to first answer" },
              { v: "100%", l: "answers cited" },
              { v: "∞", l: "documents per workspace" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121212]">
                <div className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-xl font-bold text-transparent dark:from-indigo-400 dark:to-emerald-400 sm:text-2xl">
                  {s.v}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews — calm static grid with subtle reveal */}
      <section id="reviews" className="scroll-mt-16 mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-2 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-zinc-500">Loved by teams of every size</p>
        <h2 className="mt-2 text-center text-xl font-bold sm:text-2xl">What people say</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.name} dir={i % 2 === 0 ? "left" : "right"} delay={(i % 3) * 90}>
              <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#121212]">
                <Quote className="mb-3 h-5 w-5 text-indigo-300 dark:text-indigo-500/50" />
                <p className="flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">&ldquo;{r.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`h-3.5 w-3.5 ${j < r.stars ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-zinc-700"}`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${r.color}`}>
                    {r.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-zinc-400">{r.role}</span>
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ — themed gradient cards with glow */}
      <section id="faq" className="scroll-mt-16 border-t border-slate-100 bg-white py-14 dark:border-white/5 dark:bg-[#0a0a0f] sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal dir="left">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">FAQ</p>
            <h2 className="mt-3 text-center text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
            <p className="mx-auto mt-3 max-w-md text-center text-sm text-slate-500 dark:text-zinc-400">
              Everything teams ask before switching. Still curious?{" "}
              <a href="#contact" className="font-medium text-indigo-600 hover:underline dark:text-[#1DB954]">
                Talk to us
              </a>
              .
            </p>
          </Reveal>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} dir={i % 2 === 0 ? "left" : "right"} delay={i * 60}>
                <details className="group glow-card glow-indigo rounded-2xl dark:bg-[#121212]">
                  <div className="rounded-2xl border border-slate-200/60 bg-white transition-all duration-300 group-open:border-indigo-200/50 group-open:shadow-xl dark:border-white/10 dark:bg-[#121212] dark:group-open:border-indigo-500/20">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white transition-all duration-300 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-5">
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{f.a}</p>
                    </div>
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Security — new end section 1 */}
      <section id="security" className="scroll-mt-16 border-t border-slate-100 bg-white py-12 dark:border-white/5 dark:bg-[#0a0a0f] sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal dir="left">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Security & privacy</p>
            <h2 className="mt-2 text-center text-xl font-bold sm:text-2xl">Your docs stay yours.</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-zinc-400">
              No training on your data, no hidden retention. Just encryption, access control, and a paper trail.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { icon: Lock, title: "Encrypted at rest", desc: "Files and embeddings are encrypted at rest and in transit. Bring your own key in enterprise.", color: "from-indigo-500 to-violet-500", glow: "glow-indigo" },
              { icon: Shield, title: "Private by default", desc: "Public or private workspaces, role-based access (admin / member / viewer) and invite-only sharing.", color: "from-emerald-500 to-teal-500", glow: "glow-emerald" },
              { icon: FileKey, title: "Audit everything", desc: "Soft-delete trash, version history and a full activity log — so every answer is traceable.", color: "from-amber-500 to-orange-500", glow: "glow-amber" },
            ].map((c, i) => (
              <Reveal key={c.title} dir={i === 1 ? "up" : i === 0 ? "left" : "right"} delay={i * 100}>
                <div className={`glow-card ${c.glow} h-full rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-white/[0.04]`}>
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold">{c.title}</div>
                  <div className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{c.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations — new end section 2 */}
      <section id="integrations" className="scroll-mt-16 border-y border-slate-100 bg-slate-50/50 py-12 dark:border-white/5 dark:bg-white/[0.02] sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="lg:flex lg:items-center lg:justify-between lg:gap-10">
            <Reveal dir="left" className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Works with your stack</p>
              <h2 className="mt-2 text-xl font-bold sm:text-2xl">Drop files in, get answers out. No migration.</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
                PDF, DOCX, TXT and CSV today. Slack and Drive connectors in preview. Everything you upload is auto-chunked, embedded and indexed — no tagging required.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["PDF", "DOCX", "TXT", "CSV", "Slack (soon)", "Drive (soon)", "Notion (soon)"].map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal dir="right" delay={120} className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3 lg:mt-0">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">4+</div>
                <div className="text-xs text-indigo-700/70 dark:text-indigo-200/70">file types supported today</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">Zero</div>
                <div className="text-xs text-emerald-700/70 dark:text-emerald-200/70">manual tagging required</div>
              </div>
              <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121212]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <Plug2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold">Connectors coming soon</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">Slack, Google Drive, Notion — join the waitlist from your dashboard.</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Open source — new end section 3 */}
      <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
        <Reveal dir="up">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-white dark:to-zinc-200 dark:text-black">
            <Globe className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-xl font-bold sm:text-2xl">Open in spirit, free to start</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
            Core search and chat are open and auditable. Start free, invite your team, and only think about pricing when you outgrow the hobby limits.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="https://github.com/Harshal9865/AskDocs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <Globe className="h-4 w-4" /> View source
            </a>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black dark:bg-white dark:text-black"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>

{/* Contact — themed cards with gradient accents */}
      <section id="contact" className="scroll-mt-16 border-y border-slate-100 bg-white py-12 dark:border-white/5 dark:bg-[#0a0a0f] sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal dir="left">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-500 text-white">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="text-center text-xl font-bold sm:text-2xl">Talk to us</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-zinc-400">
              Questions, feedback, or a feature your team needs? We read everything and ship fast.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal delay={100} dir="up">
              <a href="mailto:hello@askdocs.app" className="glow-card glow-rose group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121212]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-indigo-500 text-white">
                  <Mail className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Email</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">hello@askdocs.app</span>
              </a>
            </Reveal>
            <Reveal delay={160} dir="up">
              <a href="https://github.com/Harshal9865/AskDocs" target="_blank" rel="noopener noreferrer" className="glow-card glow-indigo group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121212]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <Globe className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">GitHub</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">Issues & source</span>
              </a>
            </Reveal>
            <Reveal delay={220} dir="up">
              <a href="https://twitter.com/askdocs" target="_blank" rel="noopener noreferrer" className="glow-card glow-sky group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121212]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
                  <AtSign className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Twitter</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">@askdocs</span>
              </a>
            </Reveal>
            <Reveal delay={280} dir="up">
              <a href="https://linkedin.com/company/askdocs" target="_blank" rel="noopener noreferrer" className="glow-card glow-emerald group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121212]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">LinkedIn</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">Company page</span>
              </a>
            </Reveal>
          </div>
          <Reveal delay={350} dir="up" className="mt-8 text-center">
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Typical response time: under 24 hours. We're a small team building in public — say hi.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Newsletter / Early Access */}
      <section className="border-t border-slate-100 bg-white py-12 dark:border-white/5 dark:bg-[#0a0a0f] sm:py-16">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <Reveal dir="up">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold sm:text-2xl">Stay in the loop</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-zinc-400">
              Get product updates, tips for getting the most out of AskDocs, and early access to new features. No spam.
            </p>
          </Reveal>
          <Reveal dir="up" delay={150} className="mt-6">
            <form onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing!"); }} className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="glow-input w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-[#121212] dark:text-white sm:w-72"
              />
              <button type="submit" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760] transition-all">
                Get early access
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-400 dark:text-zinc-500">Join 2,400+ early subscribers. Unsubscribe anytime.</p>
          </Reveal>
        </div>
      </section>

{/* CTA — rich gradient with floating orbs + Talk to Us */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(255,255,255,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(ellipse_at_50%_50%,rgba(255,255,255,0.08)_0%,transparent_60%)]" aria-hidden />
        <div className="absolute inset-0" aria-hidden>
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse" style={{ animationDuration: "8s", animationDelay: "1s" }} />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal dir="up" className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Ready when you are
            </div>
          </Reveal>
          <Reveal dir="up" delay={100}>
            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Ready to make your docs
              <br />
              <span className="bg-gradient-to-r from-yellow-200 via-white to-emerald-200 bg-clip-text text-transparent">
                searchable, citable, chat-worthy?
              </span>
            </h2>
          </Reveal>
          <Reveal dir="up" delay={200}>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/80">
              Your team's knowledge, one question away. Free to start, no card required.
            </p>
          </Reveal>
          <Reveal dir="up" delay={300} className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">50k+</div>
              <div className="text-xs text-white/60">docs indexed</div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">12k+</div>
              <div className="text-xs text-white/60">teams onboarded</div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">99%</div>
              <div className="text-xs text-white/60">answer accuracy</div>
            </div>
          </Reveal>
          <Reveal dir="up" delay={400} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-xl hover:bg-white/90 dark:text-indigo-700 transition-all hover:scale-[1.02]"
            >
              {user ? "Go to Dashboard" : "Create free account"} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#security"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all"
            >
              <Shield className="h-4 w-4" /> Why AskDocs
            </a>
          </Reveal>
          <Reveal dir="up" delay={500} className="mt-6 text-center">
            <p className="text-xs text-white/50">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-white hover:underline">
                Log in
              </Link>
            </p>
          </Reveal>

          {/* Talk to Us — social links inside CTA */}
          <Reveal dir="up" delay={600}>
            <div className="glow-divider mx-auto my-10 max-w-xs" />
          </Reveal>
          <Reveal dir="up" delay={650}>
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white/90 backdrop-blur-sm">
              <Heart className="h-4 w-4" />
            </div>
            <h3 className="mt-3 text-xl font-bold text-white">Talk to us</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
              Questions, feedback, or a feature your team needs? We read everything and ship fast.
            </p>
          </Reveal>
          <Reveal dir="up" delay={700} className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="mailto:hello@askdocs.app" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20">
              <Mail className="h-4 w-4" /> hello@askdocs.app
            </a>
            <a href="https://github.com/Harshal9865/AskDocs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20">
              <Globe className="h-4 w-4" /> GitHub
            </a>
            <a href="https://twitter.com/askdocs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20">
              <AtSign className="h-4 w-4" /> Twitter
            </a>
            <a href="https://linkedin.com/company/askdocs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20">
              <MessageCircle className="h-4 w-4" /> LinkedIn
            </a>
          </Reveal>
          <Reveal dir="up" delay={750} className="mt-4 text-center">
            <p className="text-xs text-white/40">
              Typical response time: under 24 hours. We&apos;re a small team building in public — say hi.
            </p>
          </Reveal>
        </div>
      </section>

<footer className="relative border-t border-slate-100 bg-white dark:border-white/5 dark:bg-[#070b0e]">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-emerald-500/5 dark:from-indigo-500/10 dark:via-transparent dark:to-emerald-500/10" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-18">
          <div className="grid gap-8 md:grid-cols-5">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-day.svg" alt="" className="h-8 w-8 dark:hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-night.svg" alt="" className="hidden h-8 w-8 dark:block" />
                <span className="text-[15px] font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-rose-400">
                  AskDocs
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
                Your team's knowledge, one question away. Upload documents, ask in plain language, get cited AI answers — then keep the conversation going in office chats.
              </p>
              <div className="mt-5 flex gap-3">
                <a
                  href="https://github.com/Harshal9865/AskDocs"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="relative group flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-purple-500 hover:text-white dark:bg-white/5 dark:text-zinc-400"
                >
                  <Globe className="h-4.5 w-4.5" />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" aria-hidden />
                </a>
                <a
                  href="https://twitter.com/askdocs"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="relative group flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-sky-500 hover:to-indigo-500 hover:text-white dark:bg-white/5 dark:text-zinc-400"
                >
                  <AtSign className="h-4.5 w-4.5" />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity" aria-hidden />
                </a>
                <a
                  href="https://linkedin.com/company/askdocs"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="relative group flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-sky-500 hover:text-white dark:bg-white/5 dark:text-zinc-400"
                >
                  <MessageCircle className="h-4.5 w-4.5" />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 opacity-0 group-hover:opacity-20 transition-opacity" aria-hidden />
                </a>
                <a
                  href="mailto:hello@askdocs.app"
                  aria-label="Email"
                  className="relative group flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-rose-500 hover:to-indigo-500 hover:text-white dark:bg-white/5 dark:text-zinc-400"
                >
                  <Mail className="h-4.5 w-4.5" />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity" aria-hidden />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Product</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link href="/chat" className="text-slate-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">AI Chat</Link></li>
                <li><Link href="/chats" className="text-slate-500 transition-colors hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400">Office Chats</Link></li>
                <li><Link href="/documents" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400">Documents</Link></li>
                <li><Link href="/search" className="text-slate-500 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400">Search</Link></li>
                <li><Link href="/friends" className="text-slate-500 transition-colors hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400">Friends</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Resources</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#how-it-works" className="text-slate-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">How it works</a></li>
                <li><a href="#features" className="text-slate-500 transition-colors hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400">Features</a></li>
                <li><a href="#reviews" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400">Reviews</a></li>
                <li><Link href="/help" className="text-slate-500 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400">Help & FAQ</Link></li>
                <li><Link href="/discover" className="text-slate-500 transition-colors hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400">Discover workspaces</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Company</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#contact" className="text-slate-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">Contact</a></li>
                <li><Link href="/settings" className="text-slate-500 transition-colors hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400">Account</Link></li>
                <li><Link href="/members" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400">Members</Link></li>
                <li><a href="https://github.com/Harshal9865/AskDocs" target="_blank" rel="noopener noreferrer" className="text-slate-500 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400">Source code</a></li>
              </ul>
            </div>

            {/* Security / Trust */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Trust & security</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#security" className="text-slate-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">Security center</a></li>
                <li><a href="#faq" className="text-slate-500 transition-colors hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400">Privacy policy</a></li>
                <li><a href="#faq" className="text-slate-500 transition-colors hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400">Terms of service</a></li>
                <li><a href="#faq" className="text-slate-500 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400">Cookie policy</a></li>
              </ul>
            </div>
          </div>

          {/* bottom bar — gradient divider + brand */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-xs text-slate-400 dark:border-white/5 dark:text-zinc-500 sm:flex-row">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-zinc-500">© {new Date().getFullYear()} AskDocs.</span>
              <span className="text-indigo-500 dark:text-indigo-400">All rights reserved.</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-500">
                Built with
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                for teams who hate digging through PDFs
              </span>
              <span className="hidden text-slate-400 dark:text-zinc-600 sm:inline">|</span>
              <span className="hidden text-slate-400 dark:text-zinc-600 sm:inline">Made with Next.js + TypeScript</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all duration-300 hover:bg-indigo-600 hover:scale-110 dark:bg-white dark:text-black dark:hover:bg-indigo-400 ${
          scrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}

