"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";

export default function WorkspaceSettingsPage() {
  const { workspace, refresh } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(workspace?.name ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (!wsId || !name.trim()) return;
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

  async function deleteWs() {
    if (!workspace || !wsId) return;
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

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={save} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="ws-name">Workspace name</label>
          <input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {msg && <p className="text-xs font-medium text-indigo-700">{msg}</p>}
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="mb-2 text-sm font-bold text-red-800">Danger zone</h2>
        <p className="mb-3 text-xs text-red-700">
          Deleting removes every document, chat and member in this workspace. Only admins can do this.
        </p>
        <button
          onClick={() => void deleteWs()}
          disabled={busy}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Delete this workspace
        </button>
      </section>
    </div>
  );
}
