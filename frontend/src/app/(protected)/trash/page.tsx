"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";

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
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Select a workspace first.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold">Trash</h1>
      <p className="mb-6 text-sm text-slate-500">
        Deleted items live here. Admins can restore documents or delete them forever.
      </p>

      <div className="mb-4 flex gap-2">
        {(["documents", "conversations"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading trash…</p>
      ) : tab === "documents" ? (
        docs.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
            Trash is empty.
          </p>
        ) : (
          <ul className="space-y-2">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <div className="text-sm font-medium">📄 {d.title}</div>
                  <div className="text-xs text-slate-400">
                    deleted {new Date(d.deleted_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <>
                      <button onClick={() => void restore(d.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        Restore
                      </button>
                      <button onClick={() => void purge(d.id, d.title)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                        Delete forever
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : convs.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          No trashed conversations. (Deleted AI chats appear here.)
        </p>
      ) : (
        <ul className="space-y-2">
          {convs.map((c) => (
            <li key={c.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-sm font-medium">💬 {c.title}</div>
              <div className="text-xs text-slate-400">deleted {new Date(c.deleted_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
