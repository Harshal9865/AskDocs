"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { ChartNoAxesColumn, FileText, MessageSquare, MessagesSquare, Sparkles, Upload, Users2 } from "lucide-react";
import type { DocumentItem, TeamChat } from "@/lib/types";

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#181818] sm:p-5">
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-emerald-500/5 dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-emerald-500/10" />
      </div>
      <div className={`relative text-2xl font-bold ${accent ? "text-indigo-600 dark:text-[#1DB954]" : "text-slate-900 dark:text-white"}`}>{value}</div>
      <div className="relative mt-1 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { workspace, workspaces } = useWorkspace();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [readyCount, setReadyCount] = useState(0);
  const [chats, setChats] = useState<TeamChat[]>([]);
  const [insights, setInsights] = useState<{ total_questions: number; unanswered_count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [docList, chatList, ins] = await Promise.all([
        api.listDocuments(workspace.id),
        api.listTeamChats(workspace.id),
        api.insights(workspace.id).catch(() => null),
      ]);
      setDocs(docList.slice(0, 5));
      setReadyCount(docList.filter((d) => d.status === "ready").length);
      setChats(chatList.slice(0, 5));
      if (ins) setInsights(ins);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!workspace) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-bold">Welcome to AskDocs, {user?.name}! 👋</h1>
        <p className="text-sm text-slate-600">
          Create your first workspace in the sidebar to start uploading documents and asking questions.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-xl font-bold">
        {workspace.name}
      </h1>
      <p className="mb-6 text-sm text-slate-500">Overview of this workspace.</p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Documents" value={loading ? "…" : docs.length} />
        <Stat label="Workspaces" value={workspaces.length} />
        <Stat label="Questions asked" value={insights?.total_questions ?? "…"} />
        <Stat label="Unanswered" value={insights?.unanswered_count ?? "…"} accent={!!insights && insights.unanswered_count > 0} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121212] sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Recent documents</h2>
            <Link href="/documents" className="text-xs font-medium text-indigo-600 hover:underline dark:text-[#1DB954]">
              View all
            </Link>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-zinc-500">
              No documents yet.{" "}
              <Link href="/documents" className="font-medium text-indigo-600 hover:underline dark:text-[#1DB954]">
                Upload your first one
              </Link>{" "}
              to start asking questions.
            </p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/documents/${workspace.id}/${d.id}`}
                    className="min-w-0 truncate text-indigo-700 hover:underline dark:text-indigo-300"
                  >
                    📄 {d.title}
                  </Link>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
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

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121212] sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Recent office chats</h2>
            <Link href="/chats" className="text-xs font-medium text-indigo-600 hover:underline dark:text-[#1DB954]">
              Open chats
            </Link>
          </div>
          {chats.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-zinc-500">
              No conversations yet. Message a colleague from the Office Chats page.
            </p>
          ) : (
            <ul className="space-y-2">
              {chats.map((c) => (
                <li key={c.id} className="truncate text-sm text-slate-600 dark:text-zinc-300">
                  {c.type === "group" ? "👥" : "💬"} <span className="font-medium">{c.title}</span>
                  {c.last_message_preview && (
                    <span className="block truncate text-xs text-slate-400 dark:text-zinc-500">{c.last_message_preview}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="ask-aurora-wrap mt-6 rounded-xl dark:border dark:border-white/10">
        <div className="ask-aurora-blobs" aria-hidden>
          <span className="ask-aurora-blob ask-aurora-blob--1" />
          <span className="ask-aurora-blob ask-aurora-blob--2" />
        </div>
        <div className="relative z-10 rounded-xl border border-indigo-100 bg-indigo-50 p-5 dark:border-white/10 dark:bg-[#0d0d1f] sm:p-6">
          <h2 className="text-sm font-semibold text-indigo-900 dark:text-white">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/documents" className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]">
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Upload document
            </Link>
            <Link href="/chat" className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Ask AI a question
            </Link>
            <Link href="/insights" className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
              <ChartNoAxesColumn className="h-3.5 w-3.5" aria-hidden />
              View knowledge gaps
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




