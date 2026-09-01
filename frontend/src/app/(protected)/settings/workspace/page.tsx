"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";

export default function WorkspaceSettingsPage() {
  const { workspace, refresh } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(workspace?.name ?? "");
  const [isPublic, setIsPublic] = useState(workspace?.is_public ?? false);
  const [visMsg, setVisMsg] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!workspace || !user) return;
    api.listMembers(workspace.id).then((members) => {
      const me = members.find((m) => m.user_id === user.id);
      setIsAdmin(me?.role === "admin");
    }).catch(() => {});
  }, [workspace, user]);

  useEffect(() => {
    setName(workspace?.name ?? "");
    setIsPublic(workspace?.is_public ?? false);
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Create or select a workspace first.
      </div>
    );
  }

  const wsId = workspace?.id;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!wsId || !name.trim() || !isAdmin) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.renameWorkspace(wsId, name.trim());
      await refresh();
      setMsg("Workspace renamed.");
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePublic() {
    if (!wsId || !isAdmin) return;
    const next = !isPublic;
    setVisMsg(null);
    try {
      await api.setWorkspaceVisibility(wsId, next);
      setIsPublic(next);
      await refresh();
      setVisMsg(next ? "Workspace is now discoverable." : "Workspace is now private.");
    } catch (err) {
      setVisMsg((err as Error).message);
    }
  }

  async function deleteWs() {
    if (!workspace || !wsId || !isAdmin) return;
    if (!confirm(`Delete "${workspace.name}" and ALL its documents/chats? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteWorkspace(wsId);
      localStorage.removeItem("askdocs_workspace");
      await refresh();
      router.replace("/dashboard");
    } catch (err) {
      alert((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200">
          Workspace Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
          Configuration and security preferences for &ldquo;{workspace.name}&rdquo;.
        </p>
      </div>

      {!isAdmin && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs sm:text-sm font-medium text-amber-800 backdrop-blur-sm dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200">
          You are a <span className="font-bold">{workspace.role}</span> in this workspace. Only workspace admins can modify these settings.
        </div>
      )}

      {/* General Settings Card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90">
        <form onSubmit={save} className="space-y-3.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300" htmlFor="ws-name">
            Workspace Name
          </label>
          <input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            disabled={!isAdmin}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 dark:border-white/10 dark:bg-[#181628] dark:text-white"
          />
          {msg && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {msg}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !name.trim() || !isAdmin}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Discoverability Card */}
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Public Discoverability
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Allow others on AskDocs to find and request to join this workspace in Discover.
            </p>
          </div>
          <button
            onClick={() => void togglePublic()}
            disabled={!isAdmin}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none disabled:opacity-50 ${
              isPublic ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs shadow-emerald-500/30" : "bg-slate-200 dark:bg-white/10"
            }`}
            aria-pressed={isPublic}
            aria-label="Toggle discoverability"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {visMsg && (
          <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {visMsg}
          </p>
        )}
      </section>

      {/* Danger Zone */}
      <section className="rounded-3xl border border-red-200/80 bg-red-50/50 p-5 backdrop-blur-md dark:border-red-900/30 dark:bg-red-950/20">
        <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
          Danger Zone
        </h2>
        <p className="mt-1 text-xs text-red-600/90 dark:text-red-300/80">
          Deleting this workspace permanently removes all documents, AI chat history, office messages, and memberships. This action cannot be undone.
        </p>
        <button
          onClick={() => void deleteWs()}
          disabled={busy || !isAdmin}
          className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-700 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          Delete Workspace
        </button>
      </section>
    </div>
  );
}
