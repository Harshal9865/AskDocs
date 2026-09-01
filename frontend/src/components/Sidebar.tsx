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
  Crown,
  UsersRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import Colleagues from "@/components/Colleagues";
import FriendsQuickAccess from "@/components/FriendsQuickAccess";
import PlanBadge from "@/components/PlanBadge";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: Sparkles },
  { href: "/chats", label: "Office Chats", icon: MessagesSquare },
  { href: "/friends", label: "Friends", icon: UsersRound },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/discover", label: "Discover", icon: Compass },
];

const NAV_SECONDARY = [
  { href: "/pricing", label: "Plans & Pricing", icon: Crown },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/activity", label: "Activity log", icon: History },
  { href: "/members", label: "Members", icon: UsersRound },
  { href: "/settings/workspace", label: "Workspace settings", icon: Settings },
  { href: "/settings", label: "Account settings", icon: Settings },
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
  const [docCount, setDocCount] = useState<number | null>(null);
  const [friendReqCount, setFriendReqCount] = useState<number>(0);
  const asideRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const planBadge = user?.plan === "pro" ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white" : user?.plan === "enterprise" ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400";
  // on mobile drawer open, always show labels regardless of desktop collapsed
  const isCollapsed = collapsed && !mobileOpen;

  useEffect(() => {
    setCollapsed(localStorage.getItem("askdocs_sb_collapsed") === "1");
  }, []);

  // close drawer when a chat is opened on mobile (WhatsApp slide)
  useEffect(() => {
    const onClose = () => onCloseMobile?.();
    window.addEventListener("closeSidebar", onClose);
    return () => window.removeEventListener("closeSidebar", onClose);
  }, [onCloseMobile]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem("askdocs_sb_collapsed", c ? "0" : "1");
      return !c;
    });
  }

  // drag-to-resize (desktop only)
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

  // fetch document count for badge (use count endpoint, fallback to list length if 422/old deploy)
  useEffect(() => {
    if (!workspace) {
      setDocCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { count } = await api.documentCount(workspace.id);
        if (!cancelled) setDocCount(count);
      } catch {
        try {
          const docs = await api.listDocuments(workspace.id);
          if (!cancelled) setDocCount(docs.length);
        } catch {
          if (!cancelled) setDocCount(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace]);

  // friend requests badge — polling 30s
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fetchReq = async () => {
      try {
        const reqs = await api.listFriendRequests();
        if (!cancelled) setFriendReqCount(reqs.length);
      } catch {
        /* ignore */
      }
    };
    void fetchReq();
    const t = setInterval(() => void fetchReq(), 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [user]);

  // unread office chats badge — polling 10s + instant event listener
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  useEffect(() => {
    if (!workspace) { setUnreadChatCount(0); return; }
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const chats = await api.listTeamChats(workspace.id);
        if (!cancelled) setUnreadChatCount(chats.reduce((n, c) => n + (c.unread_count > 0 ? 1 : 0), 0));
      } catch { /* ignore */ }
    };
    void fetchUnread();
    const t = setInterval(() => void fetchUnread(), 10000);

    const onChatRead = () => {
      setUnreadChatCount((prev) => Math.max(0, prev - 1));
      void fetchUnread();
    };
    window.addEventListener("askdocs_chat_read", onChatRead);

    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener("askdocs_chat_read", onChatRead);
    };
  }, [workspace]);

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
        style={{ width: isCollapsed ? 68 : `min(${width}px, 85vw)` }}
        className={`dark:border-slate-700/50 dark:bg-[#1a1a2e] sb-aside fixed left-0 top-14 bottom-0 z-40 flex shrink-0 flex-col border-r border-slate-200 bg-white transition-colors md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:z-auto md:translate-x-0 md:overflow-visible ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"} ${isCollapsed ? "sb-collapsed shadow-xl" : ""}`}
      >
        {/* collapse arrow - only on desktop */}
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
            <Link href="/" onClick={onCloseMobile} className="flex items-center gap-2 text-sm font-bold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-day.svg" alt="AskDocs" className="h-6 w-6 dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-night.svg" alt="AskDocs" className="hidden h-6 w-6 dark:block" />
              AskDocs
            </Link>
            <button
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        )}
        <div className="sb-hide dark:border-slate-700/50 shrink-0 border-b border-slate-100 px-3 py-3">
          <div className="flex items-center gap-1.5">
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
          const active = pathname === item.href || (item.href === "/friends" && pathname.startsWith("/friends")) || (item.href === "/documents" && pathname.startsWith("/documents"));
          const Icon = item.icon;
          const showCount = (item.href === "/friends" && friendReqCount > 0) || (item.href === "/documents" && docCount !== null && docCount > 0) || (item.href === "/chats" && unreadChatCount > 0);
          const count = item.href === "/friends" ? friendReqCount : item.href === "/documents" ? docCount : unreadChatCount;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={item.label}
              aria-label={item.label}
              className={`group relative mb-1 flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13.5px] font-medium transition-all duration-200 ${isCollapsed ? "justify-center px-0" : ""} ${
                active 
                  ? "bg-slate-900 text-white shadow-xs dark:bg-[#1a2032] dark:text-white dark:border dark:border-purple-500/20 dark:shadow-md dark:shadow-purple-500/5 font-semibold" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-purple-500" aria-hidden />
              )}
              <Icon aria-hidden className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-purple-400 dark:text-purple-300" : "text-slate-400 dark:text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"}`} />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {showCount && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${item.href === "/friends" ? "bg-red-500 text-white" : item.href === "/chats" ? "bg-[#1DB954] text-black" : "bg-slate-200 text-slate-700 dark:bg-white/15 dark:text-zinc-300"}`}>
                      {count}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        <div className="sb-label mb-1.5 mt-5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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
              className={`group relative mb-1 flex h-8.5 items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium transition-all duration-200 ${isCollapsed ? "justify-center px-0" : ""} ${
                active 
                  ? "bg-slate-900 text-white shadow-xs dark:bg-[#1a2032] dark:text-white dark:border dark:border-purple-500/20 dark:shadow-md dark:shadow-purple-500/5 font-semibold" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-purple-500" aria-hidden />
              )}
              <Icon aria-hidden className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-purple-400 dark:text-purple-300" : "text-slate-400 dark:text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
        <div className="sb-hide mt-4 -mx-2 space-y-0">
          <Colleagues />
          <FriendsQuickAccess />
        </div>
      </nav>

      <div className="dark:border-slate-700/50 border-t border-slate-100 p-3.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="sb-label dark:text-slate-200 truncate text-xs font-bold">{user?.name}</span>
              <div className="sb-label">
                <PlanBadge plan={user?.plan} size="xs" />
              </div>
            </div>
            <div className="sb-label dark:text-slate-500 truncate text-[11px] text-slate-500">{user?.email}</div>
            <span
              title={`${user?.name} (${user?.email})`}
              className="sb-collapsed-show sb-center mx-auto h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-700"
            >
              {(user?.name ?? "?").slice(0, 2)}
            </span>
          </div>
        </div>

        {(!user?.plan || user.plan.toLowerCase() === "free") && (
          <Link
            href="/pricing"
            className="sb-label mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-1.5 text-[11px] font-bold text-white shadow-xs hover:scale-[1.02] transition-all"
          >
            <Sparkles className="h-3 w-3" />
            <span>Upgrade Tier</span>
          </Link>
        )}
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