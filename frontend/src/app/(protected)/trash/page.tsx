"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";

import {
  FileText,
  MessageSquare,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface TrashedDoc {
  id: string;
  title: string;
  file_type: string;
  deleted_at: string;
}
interface TrashedConv {
  id: string;
  title: string;
  deleted_at: string;
}

export default function TrashPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [tab, setTab] = useState<"documents" | "conversations">("documents");
  const [docs, setDocs] = useState<TrashedDoc[]>([]);
  const [convs, setConvs] = useState<TrashedConv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      setDocs(await api.trashDocuments(workspace.id));
      setConvs(await api.trashConversations(workspace.id));
      if (user) {
        const members = await api.listMembers(workspace.id);
        setIsAdmin(members.find((m) => m.email === user.email)?.role === "admin");
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(docId: string) {
    if (!workspace) return;
    try {
      await api.restoreDocument(workspace.id, docId);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function purge(docId: string, title: string) {
    if (!workspace || !confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.purgeDocument(workspace.id, docId);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (!workspace) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center text-sm font-medium text-slate-500 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-400">
        Select a workspace first.
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200">
          Trash & Archive
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
          Recover deleted items or delete them permanently. Only workspace admins can restore or purge files.
        </p>
      </div>

      {/* Capsule Tabs */}
      <div className="flex gap-2">
        {(["documents", "conversations"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition-all ${
              tab === t
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                : "border border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            {t === "documents" ? `Documents (${docs.length})` : `AI Chats (${convs.length})`}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-xs font-bold text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600 dark:text-purple-400" />
        </div>
      ) : tab === "documents" ? (
        docs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/50 p-10 text-center dark:border-white/10 dark:bg-[#13111f]/50">
            <Trash2 className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-zinc-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Trash is empty</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Deleted documents will appear here for 30 days before automatic cleanup.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {docs.map((d) => (
              <li
                key={d.id}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-2xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300/80 hover:shadow-md hover:shadow-purple-500/5 dark:border-white/10 dark:bg-[#13111f]/90 dark:hover:border-purple-500/30"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{d.title}</div>
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Deleted {new Date(d.deleted_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => void restore(d.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-emerald-500" /> Restore
                      </button>
                      <button
                        onClick={() => void purge(d.id, d.title)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete forever
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : convs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/50 p-10 text-center dark:border-white/10 dark:bg-[#13111f]/50">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-zinc-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No trashed AI conversations</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Deleted AI chat threads appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {convs.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{c.title}</div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500">Deleted {new Date(c.deleted_at).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
