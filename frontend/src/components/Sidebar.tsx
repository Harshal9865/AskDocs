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
  collapsed = false,
  onToggleCollapsed,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  width?: number;
  setWidth?: (w: number) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
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
        style={{ width: collapsed ? 68 : `min(${width}px, 85vw)` }}
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white transition-all duration-200 md:relative md:z-auto md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* header: logo + collapse chevron */}
        <div
          className={`flex min-h-[57px] items-center justify-between border-b border-slate-100 p-3 ${
            collapsed ? "flex-col gap-1" : ""
          }`}
        >
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            aria-label="AskDocs home"
            title="Go to Dashboard"
            className={
              collapsed
                ? "flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-black text-white"
                : "pl-1 text-lg font-bold text-slate-900 transition-colors hover:text-indigo-700"
            }
          >
            {collapsed ? "A" : "AskDocs"}
          </Link>
          <div className="flex items-center">
            <button
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 md:block"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              ✕
            </button>
          </div>
        </div>

        {/* workspace section */}
        <div className={`border-b border-slate-100 p-3 ${collapsed ? "px-2" : ""}`}>
          {collapsed ? (
            <button
              onClick={onToggleCollapsed}
              title={workspace ? `Workspace: ${workspace.name} (click to expand)` : "No workspace"}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold uppercase text-white shadow-sm"
              aria-label="Expand sidebar to switch workspace"
            >
              {(workspace?.name ?? "?").slice(0, 1)}
            </button>
          ) : (
            <>
              <div className="mt-1 flex items-center gap-1.5">
                <select
                  value={workspace?.id ?? ""}
                  onChange={(e) => {
                    const ws = workspaces.find((w) => w.id === e.target.value);
                    if (ws) select(ws);
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
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
                    className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    🗑
                  </button>
                )}
              </div>
              {!creating ? (
                <button
                  onClick={() => setCreating(true)}
                  className="mt-2 w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
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
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    aria-label="Cancel creating workspace"
                    className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                  >
                    ✕
                  </button>
                </form>
              )}
            </>
          )}
        </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={`relative mb-1 flex items-center gap-2.5 rounded-lg text-sm transition-colors ${
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
              } ${
                active
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className={`absolute rounded-full bg-indigo-600 ${
                    collapsed ? "left-1 top-1/2 h-5 w-0.5 -translate-y-1/2" : "left-0 top-1/2 h-6 w-[3px] -translate-y-1/2"
                  }`}
                />
              )}
              <span aria-hidden className={active ? "" : "opacity-80"}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {collapsed ? (
          <div aria-hidden className="mx-auto my-3 h-px w-8 bg-slate-200" />
        ) : (
          <div className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            More
          </div>
        )}
        {NAV_SECONDARY.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center rounded-lg text-xs transition-colors ${
                collapsed ? "justify-center py-2.5" : "gap-2.5 px-3 py-2"
              } ${
                active
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {active && !collapsed && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-indigo-500"
                />
              )}
              <span aria-hidden>{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
        {!collapsed && (
          <div className="mt-4 -mx-2">
            <Colleagues />
          </div>
        )}
      </nav>

      <div className={`border-t border-slate-100 ${collapsed ? "p-2" : "p-4"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 pb-14">
            <span
              title={`${user?.name} (${user?.email})`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold uppercase text-slate-700"
            >
              {(user?.name ?? "?").slice(0, 2)}
            </span>
            <NotificationBell />
            <button
              onClick={() => {
                logout();
                onCloseMobile?.();
                router.replace("/login");
              }}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              ⏻
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* desktop drag-to-resize handle */}
      <div
        onMouseDown={startResize}
        role="separator"
        aria-label="Resize sidebar"
        title="Drag to resize sidebar"
        className={`absolute inset-y-0 right-0 z-10 w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-indigo-200 md:block ${
          collapsed ? "hidden" : ""
        }`}
      />
    </aside>
    </>
  );
}
