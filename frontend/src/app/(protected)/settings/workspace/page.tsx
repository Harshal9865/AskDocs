"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";

export default function WorkspaceSettingsPage() {
  const { workspace, refresh } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(workspace?.name ?? "");
  const [isPublic, setIsPublic] = useState(workspace?.is_public ?? false);
  const [visMsg, setVisMsg] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const isAdmin = workspace?.role === "admin";

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
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-bold">Workspace settings</h1>
      <p className="mb-6 text-sm text-slate-500">Configuration for “{workspace.name}”.</p>

      {!isAdmin && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You are a {workspace.role} in this workspace. Only admins can change these settings.
        </div>
      )}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={save} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="ws-name">Workspace name</label>
          <input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          />
          {msg && <p className="text-xs font-medium text-indigo-700">{msg}</p>}
          <button
            type="submit"
            disabled={busy || !name.trim() || !isAdmin}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Discoverable</h2>
            <p className="text-xs text-slate-500">Allow others to find and request to join this workspace.</p>
          </div>
          <button
            onClick={() => void togglePublic()}
            disabled={!isAdmin}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
              isPublic ? "bg-indigo-600" : "bg-slate-300"
            }`}
            aria-pressed={isPublic}
            aria-label="Toggle discoverability"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
        {visMsg && <p className="mt-2 text-xs font-medium text-indigo-600">{visMsg}</p>}
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="mb-2 text-sm font-bold text-red-800">Danger zone</h2>
        <p className="mb-3 text-xs text-red-700">
          Deleting removes every document, chat and member in this workspace. Only admins can do this.
        </p>
        <button
          onClick={() => void deleteWs()}
          disabled={busy || !isAdmin}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Delete this workspace
        </button>
      </section>
    </div>
  );
}
