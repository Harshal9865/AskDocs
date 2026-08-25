"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CircleHelp,
  Compass,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserCog,
  UsersRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import Colleagues from "@/components/Colleagues";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: Sparkles },
  { href: "/chats", label: "Office Chats", icon: MessagesSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/discover", label: "Discover", icon: Compass },
];

const NAV_SECONDARY = [
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/activity", label: "Activity log", icon: History },
  { href: "/members", label: "Members", icon: UsersRound },
  { href: "/settings/workspace", label: "Workspace settings", icon: Settings },
  { href: "/settings", label: "Account settings", icon: UserCog },
  { href: "/help", label: "Help & FAQ", icon: CircleHelp },
  { href: "/trash", label: "Trash", icon: Trash2 },
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("askdocs_sb_collapsed") === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem("askdocs_sb_collapsed", c ? "0" : "1");
      return !c;
    });
  }

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
        className={`dark:border-slate-700/50 dark:bg-[#1a1a2e] sb-aside fixed left-0 top-14 bottom-0 z-40 flex shrink-0 flex-col border-r border-slate-200 bg-white transition-colors md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:z-auto md:translate-x-0 md:overflow-visible ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "translate-x-0 sb-mobile-rail"
        } ${collapsed ? "sb-collapsed shadow-xl" : ""}`}
      >
        {/* collapse arrow - floats on the right edge */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-14 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 md:flex"
        >
          <svg className="sb-chevron transition-transform duration-200" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {mobileOpen && (
          <div className="flex items-center justify-between border-b border-slate-100 p-3 dark:border-slate-700/50 md:hidden">
            <span className="flex items-center gap-2 text-sm font-bold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-day.svg" alt="AskDocs" className="h-6 w-6 dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-night.svg" alt="AskDocs" className="hidden h-6 w-6 dark:block" />
              AskDocs
            </span>
            <button
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        )}
        <div className="sb-hide dark:border-slate-700/50 shrink-0 border-b border-slate-100 p-4">
          <div className="mt-3 flex items-center gap-1.5">
          <select
            value={workspace?.id ?? ""}
            onChange={(e) => {
              const ws = workspaces.find((w) => w.id === e.target.value);
              if (ws) select(ws);
            }}
            className="dark:border-slate-600 dark:bg-[#242424] dark:text-white min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
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
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="sb-collapsed-show shrink-0 border-b border-slate-100 p-2">
          <button
            onClick={toggleCollapsed}
            title={workspace ? `Workspace: ${workspace.name}` : "No workspace"}
            aria-label="Expand sidebar"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-slate-800 text-sm font-semibold uppercase text-white"
          >
            {(workspace?.name ?? "?").slice(0, 1)}
          </button>
        </div>
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            aria-label="New workspace"
            className="dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400 mt-2 w-full rounded-lg border border-dashed border-slate-300 py-2.5 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
          >
            + New workspace
          </button>
        ) : (
          <form onSubmit={createWorkspace} className="sb-hide mt-2 flex gap-1">
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

      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={item.label}
              aria-label={item.label}
              className={`mb-0.5 flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "dark:bg-slate-800 dark:text-indigo-400 bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5"
                  : "dark:text-slate-400 dark:hover:bg-slate-800/50 text-slate-600 hover:bg-slate-900/5"
              }`}
            >
              <Icon
                aria-hidden
                className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-slate-500"}`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        <div className="sb-label mb-1 mt-5 px-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          More
        </div>
        {NAV_SECONDARY.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={item.label}
              aria-label={item.label}
              className={`mb-0.5 flex h-7 items-center gap-2 rounded-md px-2 text-[13px] transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "dark:bg-slate-800 dark:text-indigo-400 bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5"
                  : "dark:text-slate-400 dark:hover:bg-slate-800/50 text-slate-600 hover:bg-slate-900/5"
              }`}
            >
              <Icon
                aria-hidden
                className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-slate-500"}`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
        <div className="sb-hide mt-4 -mx-2">
          <Colleagues />
        </div>
      </nav>

      <div className="dark:border-slate-700/50 border-t border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="sb-label dark:text-slate-300 truncate text-sm font-medium">{user?.name}</div>
            <div className="sb-label dark:text-slate-500 truncate text-xs text-slate-500">{user?.email}</div>
            <span
              title={`${user?.name} (${user?.email})`}
              className="sb-collapsed-show sb-center mx-auto h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-700"
            >
              {(user?.name ?? "?").slice(0, 2)}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            onCloseMobile?.();
            router.replace("/login");
          }}
          aria-label="Sign out"
          title="Sign out"
          className="dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 mt-3 w-full rounded-lg border border-slate-300 py-2 text-xs text-slate-600 hover:bg-slate-50"
        >
          <span className="sb-label">Sign out</span>
          <span className="sb-collapsed-show sb-center">
            <LogOut className="h-4 w-4" />
          </span>
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



