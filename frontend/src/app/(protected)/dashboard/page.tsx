"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import type { DocumentItem, TeamChat, Workspace } from "@/lib/types";

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`text-2xl font-bold ${accent ? "text-indigo-600" : "text-slate-900"}`}>{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
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
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Recent documents</h2>
            <Link href="/documents" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-slate-400">
              No documents yet.{" "}
              <Link href="/documents" className="font-medium text-indigo-600 hover:underline">
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
                    className="min-w-0 truncate text-indigo-700 hover:underline"
                  >
                    📄 {d.title}
                  </Link>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      d.status === "ready"
                        ? "bg-emerald-100 text-emerald-800"
                        : d.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Recent office chats</h2>
            <Link href="/chats" className="text-xs font-medium text-indigo-600 hover:underline">
              Open chats
            </Link>
          </div>
          {chats.length === 0 ? (
            <p className="text-sm text-slate-400">
              No conversations yet. Message a colleague from the Office Chats page.
            </p>
          ) : (
            <ul className="space-y-2">
              {chats.map((c) => (
                <li key={c.id} className="truncate text-sm text-slate-600">
                  {c.type === "group" ? "👥" : "💬"} <span className="font-medium">{c.title}</span>
                  {c.last_message_preview && (
                    <span className="block truncate text-xs text-slate-400">{c.last_message_preview}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
        <h2 className="text-sm font-semibold text-indigo-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/documents" className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
            ⬆ Upload document
          </Link>
          <Link href="/chat" className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
            💬 Ask AI a question
          </Link>
          <Link href="/insights" className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
            📊 View knowledge gaps
          </Link>
        </div>
      </div>
    </div>
  );
}
