"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import Colleagues from "@/components/Colleagues";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/chat", label: "AI Chat", icon: "💬" },
  { href: "/chats", label: "Office Chats", icon: "👥" },
  { href: "/documents", label: "Documents", icon: "📄" },
  { href: "/search", label: "Search", icon: "🔍" },
];

const NAV_SECONDARY = [
  { href: "/insights", label: "Insights", icon: "📊" },
  { href: "/trash", label: "Trash", icon: "🗑️" },
  { href: "/activity", label: "Activity log", icon: "📜" },
  { href: "/members", label: "Members", icon: "🧑‍🤝‍🧑" },
  { href: "/settings/workspace", label: "Workspace settings", icon: "⚙️" },
  { href: "/settings", label: "Account settings", icon: "🔧" },
  { href: "/help", label: "Help & FAQ", icon: "❓" },
];

const MIN_W = 220;
const MAX_W = 420;

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  width = 264,
  setWidth,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  width?: number;
  setWidth?: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const { workspace, workspaces, select, refresh } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null);

  // drag-to-resize (desktop)
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = width;
      const onMove = (ev: MouseEvent) => {
        const w = Math.min(MAX_W, Math.max(MIN_W, startW + ev.clientX - startX));
        setWidth?.(w);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        const w = Number(asideRef.current?.offsetWidth ?? startW);
        localStorage.setItem("askdocs_sidebar_width", String(w));
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [width, setWidth],
  );

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
    <>
      {/* mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <aside
        ref={asideRef}
        style={{ width: `min(${width}px, 85vw)` }}
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white transition-transform duration-200 md:relative md:z-auto md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="text-lg font-bold text-slate-900 hover:text-indigo-700"
            aria-label="AskDocs home"
            title="Go to Dashboard"
          >
            AskDocs
          </Link>
          <button
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            ✕
          </button>
        </div>
        <div className="border-b border-slate-100 p-4">
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
            className="mt-2 w-full rounded-lg border border-dashed border-slate-300 py-2.5 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
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

      <nav className="flex-1 overflow-y-auto p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onCloseMobile}
            className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
              pathname === item.href
                ? "bg-indigo-600 font-semibold text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          More
        </div>
        {NAV_SECONDARY.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onCloseMobile}
            className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs ${
              pathname === item.href
                ? "bg-indigo-100 font-semibold text-indigo-900"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="mt-4 -mx-3">
          <Colleagues />
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user?.name}</div>
            <div className="truncate text-xs text-slate-500">{user?.email}</div>
          </div>
          <NotificationBell />
        </div>
        <button
          onClick={() => {
            logout();
            onCloseMobile?.();
            router.replace("/login");
          }}
          className="mt-3 w-full rounded-lg border border-slate-300 py-2 text-xs text-slate-600 hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>

      {/* desktop drag-to-resize handle */}
      <div
        onMouseDown={startResize}
        role="separator"
        aria-label="Resize sidebar"
        title="Drag to resize sidebar"
        className="absolute inset-y-0 right-0 z-10 hidden w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-indigo-200 md:block"
      />
    </aside>
    </>
  );
}
