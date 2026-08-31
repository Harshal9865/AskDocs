"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import {
  ChartNoAxesColumn,
  FileText,
  Sparkles,
  Upload,
  UsersRound,
  Shield,
  Target,
  LayoutDashboard,
  Check,
  Plus,
  X,
} from "lucide-react";
import type { DocumentItem, PlanInfo, TeamChat } from "@/lib/types";

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
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-hover-lift glass-card group relative rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-[#151518]/90 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              accent
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {value}
          </div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {label}
          </div>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md transition-transform group-hover:scale-105 duration-300`}
        >
          <Icon className="h-5 w-5" />
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

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { workspace, workspaces } = useWorkspace();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [chats, setChats] = useState<TeamChat[]>([]);
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
      const [docList, chatList, ins, memList, planInfo] = await Promise.all([
        api.listDocuments(workspace.id),
        api.listTeamChats(workspace.id),
        api.insights(workspace.id).catch(() => null),
        api.listMembers(workspace.id).catch(() => []),
        api.getPlan().catch(() => null),
      ]);
      setDocs(docList);
      setChats(chatList);
      if (ins) setInsights(ins);
      setMembers(memList);
      if (planInfo) setPlan(planInfo);
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

  const docCount = docs.length;
  const processingCount = docs.filter((d) => d.status === "pending" || d.status === "processing").length;
  const memberCount = members.length;
  const onlineCount = members.filter((m) => m.online).length;
  const questionCount = insights?.total_questions ?? 0;
  const unansweredCount = insights?.unanswered_count ?? 0;
  const recentActivity = activity.slice(0, 7);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">{workspace.name}</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Overview of this workspace
        </p>
      </div>

      {/* Getting Started (new users) */}
      {showGuide && docCount === 0 && questionCount === 0 && (
        <GettingStarted
          docCount={docCount}
          questionCount={questionCount}
          onDismiss={dismissGuide}
        />
      )}

      {/* Stats Row — 6 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Documents"
          value={loading ? "…" : docCount}
          icon={FileText}
          color="from-indigo-500 to-violet-500"
        >
          {processingCount > 0 && (
            <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
              {processingCount} processing...
            </p>
          )}
        </StatCard>

        <StatCard
          label="Questions"
          value={loading ? "…" : questionCount}
          icon={Sparkles}
          color="from-violet-500 to-fuchsia-500"
        >
          {plan && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
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
                {plan.questions_used}/{plan.questions_limit === -1 ? "∞" : plan.questions_limit} this month
              </p>
            </div>
          )}
        </StatCard>

        <StatCard
          label="Team"
          value={loading ? "…" : `${onlineCount}/${memberCount}`}
          icon={UsersRound}
          color="from-emerald-500 to-teal-500"
        >
          {onlineCount > 0 && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} online now
            </p>
          )}
        </StatCard>

        <StatCard
          label="Workspaces"
          value={loading ? "…" : workspaces.length}
          icon={LayoutDashboard}
          color="from-sky-500 to-cyan-500"
        />

        <StatCard
          label="Knowledge Gaps"
          value={loading ? "…" : unansweredCount}
          icon={Target}
          color="from-amber-500 to-orange-500"
          accent={unansweredCount > 0}
        />

        <StatCard
          label="Plan"
          value={plan?.plan?.toUpperCase() ?? "FREE"}
          icon={Shield}
          color="from-rose-500 to-red-500"
        >
          {plan && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500 transition-all"
                  style={{
                    width: `${
                      plan.documents_limit === -1
                        ? 10
                        : Math.min((plan.documents_used / plan.documents_limit) * 100, 100)
                    }%`,
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">
                {plan.documents_used}/{plan.documents_limit === -1 ? "∞" : plan.documents_limit} docs
              </p>
            </div>
          )}
        </StatCard>
      </div>

      {/* Two-column grid: Documents + Activity OR Documents + Chats */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Recent Documents */}
        <section className="glass-card card-hover-lift rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#151518]/90 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
              Recent Documents
            </h2>
            <Link
              href="/documents"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          {docs.length === 0 ? (
            <div className="py-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
              <p className="mt-2 text-sm text-slate-400 dark:text-zinc-500">
                No documents yet.{" "}
                <Link
                  href="/documents"
                  className="font-medium text-indigo-600 hover:underline dark:text-[#1DB954]"
                >
                  Upload your first one
                </Link>
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {docs.slice(0, 6).map((d) => (
                <li
                  key={d.id}
                  className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <Link
                    href={`/documents/${workspace.id}/${d.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <span className="text-base">{FILE_ICONS[d.file_type] ?? "📄"}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400">
                        {d.title}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {d.file_type.toUpperCase()} · {fmtSize(d.size_bytes)}
                      </div>
                    </div>
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      d.status === "ready"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : d.status === "failed"
                        ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                    }`}
                  >
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-card card-hover-lift rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#151518]/90 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
              Team Members
            </h2>
            <Link
              href="/members"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              Manage →
            </Link>
          </div>
          {members.length > 0 ? (
            <ul className="space-y-1.5">
              {members.slice(0, 5).map((m) => (
                <li
                  key={m.id}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="relative">
                    <Avatar
                      name={m.name ?? m.email}
                      size={32}
                      src={m.avatar_value ? `${API_BASE}${m.avatar_value}` : undefined}
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#181818] ${
                        m.online ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-700 dark:text-zinc-200">{m.name}</div>
                    <div className="truncate text-[11px] text-slate-400 dark:text-zinc-500">{m.role}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
              <p className="mt-2 text-sm text-slate-400 dark:text-zinc-500">No team members yet.</p>
            </div>
          )}
        </section>
      </div>

      {/* Chats Row */}
      <section className="glass-card card-hover-lift rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#151518]/90 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
            Office Chats
          </h2>
          <Link
            href="/chats"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            Open chats →
          </Link>
        </div>
        {chats.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400 dark:text-zinc-500">
            No conversations yet.{" "}
            <Link
              href="/friends"
              className="font-medium text-indigo-600 hover:underline dark:text-[#1DB954]"
            >
              Message a colleague
            </Link>
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chats.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href="/chats"
                className="group flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-white/5 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm">
                  {c.type === "group" ? "👥" : "💬"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400">
                    {c.title}
                  </div>
                  {c.last_message_preview && (
                    <div className="truncate text-xs text-slate-400 dark:text-zinc-500">
                      {c.last_message_preview}
                    </div>
                  )}
                </div>
                {c.unread_count > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
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
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/40 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-100">
              Knowledge gaps — {insights.unanswered_questions.length} unanswered
            </h2>
            <Link
              href="/insights"
              className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-300"
            >
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {insights.unanswered_questions.slice(0, 3).map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
                <span className="truncate">{q.question}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121212] sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-zinc-200">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
          >
            <Upload className="h-3.5 w-3.5" /> Upload document
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <Sparkles className="h-3.5 w-3.5" /> Ask AI
          </Link>
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <ChartNoAxesColumn className="h-3.5 w-3.5" /> View insights
          </Link>
          <Link
            href="/members"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <UsersRound className="h-3.5 w-3.5" /> Invite team
          </Link>
        </div>
      </div>
    </div>
  );
}
