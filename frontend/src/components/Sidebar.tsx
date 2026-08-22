"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";

const NAV = [
  { href: "/chat", label: "Chat" },
  { href: "/documents", label: "Documents" },
  { href: "/members", label: "Members" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { workspace, workspaces, select, refresh } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);

  // resolve my role in the active workspace
  useEffect(() => {
    if (!workspace || !user) {
      setMyRole(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const members = await api.listMembers(workspace.id);
        if (!cancelled) {
          setMyRole(members.find((m) => m.email === user.email)?.role ?? null);
        }
      } catch {
        if (!cancelled) setMyRole(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace, user]);

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const ws = await api.createWorkspace(newName.trim());
      select(ws);
      await refresh(); // refetch list so the dropdown matches
      setNewName("");
      setCreating(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteWorkspace() {
    if (!workspace) return;
    const confirmed = confirm(
      `Delete workspace "${workspace.name}"?\n\nThis permanently removes all its documents and conversations. This cannot be undone.`,
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await api.deleteWorkspace(workspace.id);
      localStorage.removeItem("askdocs_workspace");
      await refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <div className="text-lg font-bold">AskDocs</div>
        <div className="mt-3 flex items-center gap-1.5">
          <select
            value={workspace?.id ?? ""}
            onChange={(e) => {
              const ws = workspaces.find((w) => w.id === e.target.value);
              if (ws) select(ws);
            }}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            aria-label="Active workspace"
          >
            {workspaces.length === 0 && <option value="">No workspace</option>}
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          {myRole === "admin" && (
            <button
              onClick={() => void deleteWorkspace()}
              disabled={busy}
              aria-label={`Delete workspace ${workspace?.name ?? ""}`}
              title="Delete this workspace"
              className="shrink-0 rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              🗑
            </button>
          )}
        </div>
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="mt-2 w-full rounded-lg border border-dashed border-slate-300 py-1.5 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
          >
            + New workspace
          </button>
        ) : (
          <form onSubmit={createWorkspace} className="mt-2 flex gap-1">
            <input
              autoFocus
              maxLength={100}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              aria-label="Cancel creating workspace"
              className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
          </form>
        )}
      </div>

      <nav className="flex-1 p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-1 block rounded-lg px-3 py-2 text-sm ${
              pathname === item.href
                ? "bg-indigo-600 font-semibold text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="truncate text-sm font-medium">{user?.name}</div>
        <div className="mb-3 truncate text-xs text-slate-500">{user?.email}</div>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="w-full rounded-lg border border-slate-300 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
