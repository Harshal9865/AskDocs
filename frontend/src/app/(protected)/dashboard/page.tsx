"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import {
  ArrowRight,
  Check,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Plus,
  Shield,
  Crown,
  Sparkles,
  Target,
  Upload,
  UsersRound,
  X,
  Brain,
  FileSignature,
  Activity,
  Scale,
  Table,
  GraduationCap,
  Headphones,
  FileCode,
  Presentation,
  Plug2,
} from "lucide-react";
import type { ContractObligation, DocumentItem, PlanInfo, TeamChat, WorkspaceMemory, AudienceMode } from "@/lib/types";
import { useAudienceMode, AUDIENCE_MODES } from "@/lib/audience-mode-context";
import HintTooltip from "@/components/HintTooltip";

/* ── Helpers ── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  txt: "📃",
  md: "📋",
  png: "🖼️",
  jpg: "🖼️",
  jpeg: "🖼️",
  webp: "🖼️",
  gif: "🖼️",
};

/* ── Stat Card ── */
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  accent,
  children,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 sm:p-4.5 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-purple-300/60 hover:shadow-lg hover:shadow-purple-500/5 dark:border-white/10 dark:bg-[#141422]/90 dark:hover:border-purple-500/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div
            className={`text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight truncate leading-tight py-0.5 ${
              accent
                ? "bg-gradient-to-r from-rose-500 to-red-500 bg-clip-text text-transparent"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {value}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 truncate leading-snug">
            {label}
          </div>
        </div>
        <div
          className={`flex h-8.5 w-8.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Getting Started ── */
function GettingStarted({
  docCount,
  questionCount,
  onDismiss,
}: {
  docCount: number;
  questionCount: number;
  onDismiss: () => void;
}) {
  const steps = [
    { done: docCount > 0, label: "Upload your first document", href: "/documents" },
    { done: questionCount > 0, label: "Ask your first question", href: "/chat" },
    { done: false, label: "Invite a teammate", href: "/members" },
  ];
  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-violet-500/10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-indigo-900 dark:text-white">
            Get started — {completed}/{steps.length} steps done
          </h3>
          <p className="mt-1 text-xs text-indigo-700/70 dark:text-indigo-200/70">
            Set up your workspace in under 2 minutes.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {steps.map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
              s.done
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/10 dark:bg-[#181818] dark:text-zinc-300 dark:hover:border-indigo-500/30"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                s.done
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400"
              }`}
            >
              {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="font-medium">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Activity Item ── */
function ActivityItem({ item }: { item: { actor: string; action: string; target: string; created_at: string } }) {
  const actionIcons: Record<string, { icon: string; color: string }> = {
    "document.uploaded": { icon: "📄", color: "text-indigo-500" },
    "document.trashed": { icon: "🗑️", color: "text-rose-500" },
    "document.restored": { icon: "♻️", color: "text-emerald-500" },
    "member.invited": { icon: "📧", color: "text-sky-500" },
    "member.joined": { icon: "👤", color: "text-violet-500" },
    "workspace.created": { icon: "🏗️", color: "text-amber-500" },
  };
  const meta = actionIcons[item.action] ?? { icon: "📋", color: "text-slate-500" };
  const actionLabel = item.action.replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <li className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-sm">{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-700 dark:text-zinc-300">
          <span className="font-medium">{item.actor}</span>{" "}
          <span className="text-slate-500 dark:text-zinc-400">{actionLabel}</span>{" "}
          <span className="font-medium">{item.target}</span>
        </p>
        <p className="text-xs text-slate-400 dark:text-zinc-500">{timeAgo(item.created_at)}</p>
      </div>
    </li>
  );
}

const MODE_PROMPTS: Record<AudienceMode, string[]> = {
  academic: [
    "Summarize midterm & final exam topics",
    "Generate 3D flashcards & practice quiz",
    "Derive step-by-step math proof",
    "Lab report submission checklist",
  ],
  office: [
    "Summarize team standups & SOPs",
    "Quarterly engineering architecture sync",
    "Extract team action items & owners",
    "Weekly digest of workspace changes",
  ],
  legal: [
    "Audit contract liability & indemnity risks",
    "Contract renewal & expiration deadlines",
    "Compare 2 agreement versions (Redline)",
    "Privilege & NDA compliance verification",
  ],
  finance: [
    "Extract invoice line items & totals",
    "Tax & audit reconciliation report",
    "CapEx budget allocation review",
    "Payroll discrepancy verification",
  ],
  clinical: [
    "Patient de-identification audit",
    "Clinical protocol & safety review",
    "Medical study flashcard deck",
    "Grand rounds case vignette summary",
  ],
  personal: [
    "Generate pitch deck outline",
    "Create 3-minute spoken audio podcast",
    "Document health & freshness audit",
    "Key takeaways executive summary",
  ],
};

const MODE_HERO_ACTIONS: Record<
  AudienceMode,
  { label: string; href: string; icon: any; color: string }[]
> = {
  academic: [
    { label: "Study Studio", href: "/study-guide", icon: GraduationCap, color: "from-purple-600 to-indigo-600" },
    { label: "Audio Briefs", href: "/listen", icon: Headphones, color: "from-indigo-600 to-blue-600" },
    { label: "Slide Decks", href: "/slides", icon: Presentation, color: "from-emerald-600 to-teal-600" },
    { label: "Data Extractor", href: "/extract", icon: Table, color: "from-cyan-600 to-blue-600" },
  ],
  office: [
    { label: "Memory Graph", href: "/memory", icon: Brain, color: "from-indigo-600 to-blue-600" },
    { label: "Weekly Digest", href: "/digest", icon: FileCode, color: "from-purple-600 to-indigo-600" },
    { label: "Team Chats", href: "/chats", icon: MessagesSquare, color: "from-emerald-600 to-teal-600" },
    { label: "Slide Decks", href: "/slides", icon: Presentation, color: "from-amber-600 to-orange-600" },
  ],
  legal: [
    { label: "Redline Diff", href: "/contracts/compare", icon: Scale, color: "from-rose-600 to-pink-600" },
    { label: "Contracts", href: "/contracts", icon: FileSignature, color: "from-indigo-600 to-purple-600" },
    { label: "Redact & Mask", href: "/convert", icon: FileCode, color: "from-amber-600 to-orange-600" },
    { label: "Canvas Vault", href: "/canvas", icon: Sparkles, color: "from-cyan-600 to-blue-600" },
  ],
  finance: [
    { label: "Invoice Extractor", href: "/extract", icon: Table, color: "from-emerald-600 to-teal-600" },
    { label: "Redline Diff", href: "/contracts/compare", icon: Scale, color: "from-rose-600 to-pink-600" },
    { label: "Redact PII", href: "/convert", icon: FileCode, color: "from-amber-600 to-orange-600" },
    { label: "Weekly Digest", href: "/digest", icon: FileCode, color: "from-indigo-600 to-purple-600" },
  ],
  clinical: [
    { label: "Doc Health", href: "/health", icon: Activity, color: "from-cyan-600 to-teal-600" },
    { label: "Study Cards", href: "/study-guide", icon: GraduationCap, color: "from-purple-600 to-indigo-600" },
    { label: "Audio Briefs", href: "/listen", icon: Headphones, color: "from-emerald-600 to-teal-600" },
    { label: "Redact PII", href: "/convert", icon: FileCode, color: "from-amber-600 to-orange-600" },
  ],
  personal: [
    { label: "Slide Decks", href: "/slides", icon: Presentation, color: "from-purple-600 to-indigo-600" },
    { label: "Audio Briefs", href: "/listen", icon: Headphones, color: "from-indigo-600 to-blue-600" },
    { label: "Study Studio", href: "/study-guide", icon: GraduationCap, color: "from-emerald-600 to-teal-600" },
    { label: "Canvas", href: "/canvas", icon: Sparkles, color: "from-cyan-600 to-blue-600" },
  ],
};

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [chats, setChats] = useState<TeamChat[]>([]);
  const [obligations, setObligations] = useState<ContractObligation[]>([]);
  const [memories, setMemories] = useState<WorkspaceMemory[]>([]);
  const [quickPrompt, setQuickPrompt] = useState("");
  const [insights, setInsights] = useState<{
    total_questions: number;
    unanswered_count: number;
    unanswered_questions: { question: string; asked_at: string }[];
  } | null>(null);
  const [activity, setActivity] = useState<
    { id: string; actor: string; action: string; target: string; created_at: string }[]
  >([]);
  const [members, setMembers] = useState<{ user_id: string; name: string; email: string; avatar_kind?: string; avatar_value?: string | null; role: string; online: boolean }[]>([]);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [docList, chatList, ins, memList, planInfo, obList, mems] = await Promise.all([
        api.listDocuments(workspace.id),
        api.listTeamChats(workspace.id),
        api.insights(workspace.id).catch(() => null),
        api.listMembers(workspace.id).catch(() => []),
        api.getPlan().catch(() => null),
        api.getContractObligations(workspace.id).catch(() => []),
        api.getWorkspaceMemories(workspace.id).catch(() => []),
      ]);
      setDocs(docList);
      setChats(chatList);
      if (ins) setInsights(ins);
      setMembers(memList);
      if (planInfo) setPlan(planInfo);
      setObligations(obList);
      setMemories(mems);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void load();
  }, [load]);

  // Load activity (admin-only, fail silently for members)
  useEffect(() => {
    if (!workspace) return;
    api.getActivity(workspace.id).then(setActivity).catch(() => {});
  }, [workspace]);

  // Check if user dismissed guide
  useEffect(() => {
    const key = `askdocs_guide_dismissed_${user?.id}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) {
      setShowGuide(false);
    }
  }, [user]);

  function dismissGuide() {
    const key = `askdocs_guide_dismissed_${user?.id}`;
    if (typeof window !== "undefined") localStorage.setItem(key, "1");
    setShowGuide(false);
  }

  /* Empty state — no workspace */
  if (!workspace) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#121212]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
          <LayoutDashboard className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-xl font-bold">
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Create your first workspace in the sidebar to start uploading documents and asking questions.
        </p>
        <Link
          href="/documents"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 dark:bg-[#1DB954] dark:text-black"
        >
          <Plus className="h-4 w-4" /> Create Workspace
        </Link>
      </div>
    );
  }

  const { mode, setMode, config: modeConfig } = useAudienceMode();

  const docCount = docs.length;
  const processingCount = docs.filter((d) => d.status === "pending" || d.status === "processing").length;
  const memberCount = members.length;
  const onlineCount = members.filter((m) => m.online).length;
  const questionCount = insights?.total_questions ?? 0;
  const activeObligations = obligations.filter((o) => o.status === "active");
  const recentActivity = activity.slice(0, 7);

  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const heroActions = MODE_HERO_ACTIONS[mode] || MODE_HERO_ACTIONS.academic;
  const heroPrompts = MODE_PROMPTS[mode] || MODE_PROMPTS.academic;

  return (
    <div className="relative mx-auto max-w-5xl space-y-6">
      {/* Header Banner with Mode Badge & Interactive Ask AI Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white/95 via-purple-50/30 to-indigo-50/20 p-5 shadow-xs backdrop-blur-xl dark:border-white/10 dark:from-[#13111f]/95 dark:via-[#19152e]/50 dark:to-[#0f0e1c]/80 sm:p-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/60 bg-purple-50/80 px-3.5 py-1 text-xs font-semibold text-purple-700 backdrop-blur-sm dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Workspace: {workspace.name}</span>
              </div>
              <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-mono font-extrabold text-purple-700 dark:text-purple-300 border border-purple-500/25">
                {modeConfig.badge}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl leading-normal py-1">
                {greeting},{" "}
                <span className="inline-block bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent pb-1">
                  {firstName}
                </span>{" "}
                <span className="inline-block">👋</span>
              </h1>
              <HintTooltip text="Ask Docs searches across all PDFs & spreadsheets in this workspace with page citations." />
            </div>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {modeConfig.tagline}
            </p>
          </div>

          {/* Dynamic Hero Actions tailored to Mode */}
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {heroActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                    idx === 0
                      ? `bg-gradient-to-r ${action.color} text-white shadow-md shadow-purple-500/20`
                      : "border border-slate-200/80 bg-white/80 text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-purple-300/80 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  }`}
                >
                  <ActionIcon className="h-3.5 w-3.5" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Interactive Ask AI Form inside Hero */}
        <div className="mt-2 border-t border-purple-100/80 pt-4 dark:border-white/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quickPrompt.trim()) return;
              router.push(`/chat?q=${encodeURIComponent(quickPrompt.trim())}`);
            }}
            className="relative flex items-center"
          >
            <Sparkles className="pointer-events-none absolute left-3.5 h-4 w-4 text-purple-600 dark:text-purple-400" />
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder={`Ask AI anything in ${modeConfig.name} mode…`}
              className="w-full rounded-2xl border border-slate-200/90 bg-white/95 py-2.5 pl-10 pr-24 text-xs sm:text-sm text-slate-800 shadow-xs backdrop-blur-md outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/95 dark:text-white"
            />
            <button
              type="submit"
              disabled={!quickPrompt.trim()}
              className="absolute right-1.5 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              <span>Ask</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Mode-Specific Quick Prompt Accelerator Chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {modeConfig.badge} Prompts:
            </span>
            {heroPrompts.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => router.push(`/chat?q=${encodeURIComponent(chip)}`)}
                className="rounded-lg border border-slate-200/80 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition-all hover:border-purple-300 hover:bg-white hover:text-purple-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-purple-500/30 dark:hover:text-purple-400 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Mode Switcher Bar & Security Notice */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#141424]/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Active Mode Engine:
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              {modeConfig.name}
            </span>
          </div>

          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 italic">
            🔒 {modeConfig.securityNote}
          </span>
        </div>

        {/* 1-Click Mode Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { id: "academic", label: "🎓 Academic & Student", modeKey: "academic" },
              { id: "office", label: "🏢 Corporate & SOP", modeKey: "office" },
              { id: "legal", label: "⚖️ Legal & Regulatory", modeKey: "legal" },
              { id: "finance", label: "💰 Finance & Audit", modeKey: "finance" },
              { id: "clinical", label: "🩺 Clinical & Health", modeKey: "clinical" },
              { id: "personal", label: "💼 Solo & Studio", modeKey: "personal" },
            ] as const
          ).map((m) => {
            const isCurrentMode = mode === m.modeKey;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.modeKey as AudienceMode)}
                className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isCurrentMode
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 scale-105 font-black"
                    : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Getting Started (new users) */}
      {showGuide && docCount === 0 && questionCount === 0 && (
        <GettingStarted
          docCount={docCount}
          questionCount={questionCount}
          onDismiss={dismissGuide}
        />
      )}

      {/* Stats Row — 6 cards with gradient accents */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Documents"
          value={loading ? "…" : docCount}
          icon={FileText}
          color="from-purple-600 to-indigo-600"
        >
          {processingCount > 0 && (
            <p className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {processingCount} processing...
            </p>
          )}
        </StatCard>

        <StatCard
          label="AI Questions"
          value={loading ? "…" : questionCount}
          icon={Sparkles}
          color="from-indigo-600 to-blue-600"
        >
          {plan && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                  style={{
                    width: `${
                      plan.questions_limit === -1
                        ? 10
                        : Math.min((plan.questions_used / plan.questions_limit) * 100, 100)
                    }%`,
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">
                {plan.questions_used}/{plan.questions_limit === -1 ? "∞" : plan.questions_limit} used
              </p>
            </div>
          )}
        </StatCard>

        <Link href="/contracts" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <StatCard
            label="Active Contracts"
            value={loading ? "…" : activeObligations.length}
            icon={FileSignature}
            color="from-indigo-500 via-purple-500 to-pink-500"
          >
            <p className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Obligations tracked</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </p>
          </StatCard>
        </Link>

        <Link href="/memory" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <StatCard
            label="Memory Facts"
            value={loading ? "…" : memories.length}
            icon={Brain}
            color="from-purple-600 via-indigo-600 to-cyan-500"
          >
            <p className="mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>Knowledge graph</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </p>
          </StatCard>
        </Link>

        <StatCard
          label="Team Online"
          value={loading ? "…" : `${onlineCount}/${memberCount}`}
          icon={UsersRound}
          color="from-emerald-500 to-teal-500"
        >
          {onlineCount > 0 && (
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} online now
            </p>
          )}
        </StatCard>

        <Link href="/pricing" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <StatCard
            label="Plan Tier"
            value={
              plan?.plan === "ultra_premium"
                ? "Ultra 👑"
                : plan?.plan === "premium"
                  ? "Premium ⭐"
                  : "Free"
            }
            icon={plan?.plan === "ultra_premium" ? Crown : plan?.plan === "premium" ? Sparkles : Shield}
            color={
              plan?.plan === "ultra_premium"
                ? "from-amber-500 via-orange-500 to-yellow-500"
                : plan?.plan === "premium"
                  ? "from-purple-600 to-indigo-600"
                  : "from-slate-600 to-slate-800"
            }
          >
            {plan && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                    style={{
                      width: `${
                        plan.documents_limit === -1
                          ? 100
                          : Math.min((plan.documents_used / plan.documents_limit) * 100, 100)
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                  {plan.documents_limit === -1 ? `${plan.documents_used} docs (∞)` : `${plan.documents_used}/${plan.documents_limit} docs`}
                </p>
              </div>
            )}
          </StatCard>
        </Link>
      </div>

      {/* Intelligence & Workflow Highlight Cards — Dynamically Sorted by Active Mode */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" /> Workflow & Intelligence Studios ({modeConfig.name})
          </h2>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            Sorted by {modeConfig.badge} Priority
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/study-guide",
              title: "Study Studio & Quizzes",
              desc: "Synthesize multi-doc cheat sheets, 3D flippable flashcards, and test quizzes.",
              icon: GraduationCap,
              action: "Learn →",
              bgClass: "from-white/95 to-purple-50/30 dark:from-[#131122]/90 dark:to-[#1e132d]/80 border-purple-200/80 hover:border-purple-400 text-purple-600 dark:text-purple-400",
            },
            {
              href: "/listen",
              title: "Document Audio Briefs",
              desc: "Listen to 3-minute spoken audio summaries of long PDFs with wave visualizers.",
              icon: Headphones,
              action: "Listen →",
              bgClass: "from-white/95 to-violet-50/30 dark:from-[#131122]/90 dark:to-[#1c132d]/80 border-violet-200/80 hover:border-violet-400 text-violet-600 dark:text-violet-400",
            },
            {
              href: "/extract",
              title: "AI Data Extractor",
              desc: "Extract tables from invoices, receipts, and reports into Excel & CSV grids.",
              icon: Table,
              action: "Extract →",
              bgClass: "from-white/95 to-emerald-50/30 dark:from-[#131122]/90 dark:to-[#12241d]/80 border-emerald-200/80 hover:border-emerald-400 text-emerald-600 dark:text-emerald-400",
            },
            {
              href: "/contracts/compare",
              title: "Redline Diff Studio",
              desc: "Compare 2 contract versions side-by-side with automated liability & risk detection.",
              icon: Scale,
              action: "Diff →",
              bgClass: "from-white/95 to-rose-50/30 dark:from-[#131122]/90 dark:to-[#24131d]/80 border-rose-200/80 hover:border-rose-400 text-rose-600 dark:text-rose-400",
            },
            {
              href: "/contracts",
              title: "Contract Intelligence",
              desc: activeObligations.length > 0 ? `${activeObligations.length} active contract terms and renewal dates monitored.` : "Audit agreements, NDAs, and auto-extract obligations & deadlines.",
              icon: FileSignature,
              action: "View →",
              bgClass: "from-white/95 to-indigo-50/30 dark:from-[#131122]/90 dark:to-[#17142d]/80 border-indigo-200/80 hover:border-indigo-400 text-indigo-600 dark:text-indigo-400",
            },
            {
              href: "/memory",
              title: "Institutional Memory",
              desc: memories.length > 0 ? `${memories.length} organizational decisions and facts recorded in graph.` : "Ingest meeting transcripts and preserve team decisions automatically.",
              icon: Brain,
              action: "Graph →",
              bgClass: "from-white/95 to-purple-50/30 dark:from-[#131122]/90 dark:to-[#1a122e]/80 border-purple-200/80 hover:border-purple-400 text-purple-600 dark:text-purple-400",
            },
            {
              href: "/health",
              title: "Document Health",
              desc: docCount > 0 ? `${docCount} documents audited for freshness, clarity, and policy conflicts.` : "Audit document freshness and detect contradictory policies in real-time.",
              icon: Activity,
              action: "Audit →",
              bgClass: "from-white/95 to-cyan-50/30 dark:from-[#131122]/90 dark:to-[#0f172a]/80 border-cyan-200/80 hover:border-cyan-400 text-cyan-600 dark:text-cyan-400",
            },
            {
              href: "/slides",
              title: "Slide Deck Studio",
              desc: "Transform 40-page reports into 4-slide executive presentation decks with themes.",
              icon: Presentation,
              action: "Present →",
              bgClass: "from-white/95 to-indigo-50/30 dark:from-[#131122]/90 dark:to-[#17132e]/80 border-indigo-200/80 hover:border-indigo-400 text-indigo-600 dark:text-indigo-400",
            },
            {
              href: "/convert",
              title: "Format & PII Redact",
              desc: "Convert docs to Markdown, JSON, CSV & mask emails, phones, and SSNs.",
              icon: FileCode,
              action: "Convert →",
              bgClass: "from-white/95 to-purple-50/30 dark:from-[#131122]/90 dark:to-[#1c122e]/80 border-purple-200/80 hover:border-purple-400 text-purple-600 dark:text-purple-400",
            },
            {
              href: "/integrations",
              title: "Integrations & API",
              desc: "Connect Slack, Discord, Notion, Google Drive & Odoo ERP for auto-sync.",
              icon: Plug2,
              action: "Sync →",
              bgClass: "from-white/95 to-emerald-50/30 dark:from-[#131122]/90 dark:to-[#12241b]/80 border-emerald-200/80 hover:border-emerald-400 text-emerald-600 dark:text-emerald-400",
            },
          ]
            .sort((a, b) => {
              const idxA = modeConfig.priorityStudios.indexOf(a.href);
              const idxB = modeConfig.priorityStudios.indexOf(b.href);
              const posA = idxA === -1 ? 99 : idxA;
              const posB = idxB === -1 ? 99 : idxB;
              return posA - posB;
            })
            .map((card, idx) => {
              const Icon = card.icon;
              const isTopPriority = idx < 2;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-4.5 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${card.bgClass} ${
                    isTopPriority ? "ring-2 ring-purple-500/30 scale-[1.01]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50/80 dark:bg-purple-950/60">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <span>{card.title}</span>
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isTopPriority && (
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-extrabold uppercase text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          Top Choice
                        </span>
                      )}
                      <span className="text-[10px] font-bold group-hover:translate-x-0.5 transition-transform">
                        {card.action}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-snug">
                    {card.desc}
                  </p>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Two-column grid: Documents + Activity / Team */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Recent Documents */}
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <FileText className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Documents
              </h2>
            </div>
            <Link
              href="/documents"
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {docs.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
              <p className="mt-2 text-xs font-medium text-slate-400 dark:text-zinc-500">
                No documents uploaded yet.
              </p>
              <Link
                href="/documents"
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition-all"
              >
                Upload First Document
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {docs.slice(0, 5).map((d) => (
                <li
                  key={d.id}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:bg-white hover:shadow-xs dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-purple-500/20 dark:hover:bg-white/[0.05]"
                >
                  <Link
                    href={`/documents/${workspace.id}/${d.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <span className="text-lg">{FILE_ICONS[d.file_type] ?? "📄"}</span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-slate-800 group-hover:text-purple-600 dark:text-zinc-200 dark:group-hover:text-purple-400 transition-colors">
                        {d.title}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {d.file_type.toUpperCase()} · {fmtSize(d.size_bytes)}
                      </div>
                    </div>
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      d.status === "ready"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : d.status === "failed"
                        ? "bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300"
                    }`}
                  >
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activity Feed (admin-only) or Team Members */}
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <UsersRound className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {recentActivity.length > 0 ? "Recent Activity" : "Team Members"}
              </h2>
            </div>
            <Link
              href={recentActivity.length > 0 ? "/activity" : "/members"}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              {recentActivity.length > 0 ? "View all" : "Manage"} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {recentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </ul>
          ) : members.length > 0 ? (
            <ul className="space-y-2">
              {members.slice(0, 5).map((m) => (
                <li key={m.user_id}>
                  <Link
                    href={`/profile/${m.user_id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-xs dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-indigo-500/20 dark:hover:bg-white/[0.05]"
                  >
                    <div className="relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
                        {m.name?.slice(0, 2)?.toUpperCase() ?? "?"}
                      </div>
                      {m.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#13111f]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-slate-800 group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400 transition-colors">
                        {m.name || m.email}
                      </div>
                      <div className="truncate text-[10px] text-slate-400 dark:text-zinc-500">{m.role}</div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      View →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
              <p className="mt-2 text-xs text-slate-400 dark:text-zinc-500">No team members yet.</p>
            </div>
          )}
        </section>
      </div>

      {/* Office Chats Quick Panel */}
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <MessagesSquare className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Office Chats
            </h2>
          </div>
          <Link
            href="/chats"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
          >
            Open chats <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {chats.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              No conversations yet.{" "}
              <Link
                href="/friends"
                className="font-bold text-purple-600 hover:underline dark:text-purple-400"
              >
                Message a colleague
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chats.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href="/chats"
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:bg-white hover:shadow-xs dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-purple-500/20 dark:hover:bg-white/[0.05]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-sm shadow-xs shadow-purple-500/30">
                  {c.type === "group" ? "👥" : "💬"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-800 group-hover:text-purple-600 dark:text-zinc-200 dark:group-hover:text-purple-400 transition-colors">
                    {c.title}
                  </div>
                  {c.last_message_preview && (
                    <div className="truncate text-[11px] text-slate-400 dark:text-zinc-500">
                      {c.last_message_preview}
                    </div>
                  )}
                </div>
                {c.unread_count > 0 && (
                  <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-1.5 text-[10px] font-bold text-white shadow-xs">
                    {c.unread_count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Knowledge Gaps (if any) */}
      {insights && insights.unanswered_questions.length > 0 && (
        <section className="rounded-3xl border border-amber-200/80 bg-amber-50/60 p-5 backdrop-blur-md dark:border-amber-500/30 dark:bg-amber-950/30">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Knowledge gaps — {insights.unanswered_questions.length} unanswered questions
            </h2>
            <Link
              href="/insights"
              className="text-xs font-bold text-amber-700 hover:underline dark:text-amber-300"
            >
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {insights.unanswered_questions.slice(0, 3).map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
                <span className="truncate">{q.question}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

