"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";

const NAV = [
  { href: "/chat", label: "Chat" },
  { href: "/documents", label: "Documents" },
  { href: "/members", label: "Members" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { workspace, workspaces, select } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const ws = await api.createWorkspace(newName.trim());
      select(ws);
      setNewName("");
      setCreating(false);
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="border-b border-zinc-200 p-4">
        <div className="text-lg font-bold">AskDocs</div>
        <select
          value={workspace?.id ?? ""}
          onChange={(e) => {
            const ws = workspaces.find((w) => w.id === e.target.value);
            if (ws) select(ws);
          }}
          className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          aria-label="Active workspace"
        >
          {workspaces.length === 0 && <option value="">No workspace</option>}
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="mt-2 w-full rounded-lg border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-800"
          >
            + New workspace
          </button>
        ) : (
          <form onSubmit={createWorkspace} className="mt-2 flex gap-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name"
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg px-2 py-1 text-xs text-zinc-500"
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
                ? "bg-zinc-900 font-semibold text-white"
                : "text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <div className="truncate text-sm font-medium">{user?.name}</div>
        <div className="mb-3 truncate text-xs text-zinc-500">{user?.email}</div>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="w-full rounded-lg border border-zinc-300 py-1.5 text-xs text-zinc-600 hover:bg-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
