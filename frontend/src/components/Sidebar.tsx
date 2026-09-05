"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CircleHelp,
  Compass,
  FileText,
  History,
  LayoutDashboard,
  MessagesSquare,
  Search,
  Sparkles,
  Trash2,
  Crown,
  UsersRound,
  Brain,
  FileSignature,
  Activity,
  FileSpreadsheet,
  LayoutGrid,
  Scale,
  Table,
  GraduationCap,
  Headphones,
  FileCode,
  Presentation,
  Rocket,
  ChevronDown,
  Building2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { useAudienceMode } from "@/lib/audience-mode-context";
import AudienceModeSwitcherModal from "@/components/AudienceModeSwitcher";
import Colleagues from "@/components/Colleagues";
import FriendsQuickAccess from "@/components/FriendsQuickAccess";
import PlanBadge from "@/components/PlanBadge";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: Sparkles },
  { href: "/chats", label: "Chats", icon: MessagesSquare },
  { href: "/friends", label: "Friends", icon: UsersRound },
  { href: "/documents", label: "Documents", icon: FileText },
];

const NAV_INTELLIGENCE = [
  { href: "/frontier", label: "✦ Frontier Labs", icon: Rocket, special: true },
  { href: "/hub", label: "Innovation Hub", icon: Compass },
  { href: "/extract", label: "Data Extractor", icon: Table },
  { href: "/convert", label: "Format & Redact", icon: FileCode },
  { href: "/slides", label: "Slide Decks", icon: Presentation },
  { href: "/study-guide", label: "Study Studio", icon: GraduationCap },
  { href: "/listen", label: "Audio Briefs", icon: Headphones },
  { href: "/contracts", label: "Contracts", icon: FileSignature },
  { href: "/contracts/compare", label: "Redline Diff", icon: Scale },
  { href: "/memory", label: "Memory Graph", icon: Brain },
  { href: "/health", label: "Doc Health", icon: Activity },
  { href: "/digest", label: "Weekly Digest", icon: FileSpreadsheet },
  { href: "/canvas", label: "Canvas", icon: LayoutGrid },
];

const NAV_SECONDARY = [
  { href: "/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/search", label: "Search", icon: Search },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/pricing", label: "Plans & Pricing", icon: Crown },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/activity", label: "Activity log", icon: History },
  { href: "/members", label: "Members", icon: UsersRound },
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
  const { user } = useAuth();
  const { workspace, workspaces } = useWorkspace();
  const pathname = usePathname();
  const { config: modeConfig } = useAudienceMode();
  const [showModeModal, setShowModeModal] = useState(false);
  const [docCount, setDocCount] = useState<number | null>(null);
  const [friendReqCount, setFriendReqCount] = useState<number>(0);
  const asideRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  // on mobile drawer open, always show labels regardless of desktop collapsed
  const isCollapsed = collapsed && !mobileOpen;

  // Dynamic NAV items with mode's chat nomenclature
  const dynamicNav = NAV.map((item) =>
    item.href === "/chats" ? { ...item, label: modeConfig.chatLabel } : item
  );

  // Filter & prioritize Intelligence studio items based on active mode
  const filteredIntelligence = NAV_INTELLIGENCE.filter((item) => {
    if (modeConfig.id === "academic") {
      // Student mode: hide legal/contract heavy tools
      return !["/contracts", "/contracts/compare"].includes(item.href);
    }
    if (modeConfig.id === "office") {
      // Corporate mode: hide purely student tools
      return item.href !== "/study-guide";
    }
    return true;
  });

  const prioritizedIntelligence = [...filteredIntelligence].sort((a, b) => {
    const idxA = modeConfig.priorityStudios.indexOf(a.href);
    const idxB = modeConfig.priorityStudios.indexOf(b.href);
    const orderA = idxA === -1 ? 99 : idxA;
    const orderB = idxB === -1 ? 99 : idxB;
    return orderA - orderB;
  });

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
          <Link
            href="/workspaces"
            onClick={onCloseMobile}
            title={`Active Workspace: ${workspace?.name || "None"}. Click to manage workspaces.`}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-2 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-xs">
                {(workspace?.name || "W").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {workspace?.name || "Select Workspace"}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} • Center
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors shrink-0" />
          </Link>
        </div>
        <div className="sb-collapsed-show shrink-0 border-b border-slate-100 p-2">
          <Link
            href="/workspaces"
            onClick={onCloseMobile}
            title={workspace ? `Workspace: ${workspace.name}` : "No workspace"}
            aria-label="Manage workspaces"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold uppercase text-white shadow-xs dark:bg-white dark:text-black"
          >
            {(workspace?.name ?? "W").slice(0, 1)}
          </Link>
        </div>

      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        {dynamicNav.map((item) => {
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

        <div className="sb-label mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Intelligence
        </div>
        {prioritizedIntelligence.map((item) => {
          const active = pathname === item.href || (item.href === "/contracts/compare" && pathname.startsWith("/contracts/compare"));
          const Icon = item.icon;
          const isFrontier = item.href === "/frontier";
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
                  : isFrontier
                  ? "border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#181236] to-slate-900 text-purple-200 hover:border-purple-400 hover:text-white shadow-xs shadow-purple-500/10 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-purple-500" aria-hidden />
              )}
              <Icon aria-hidden className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                active || isFrontier ? "text-purple-400 dark:text-purple-300" : "text-slate-400 dark:text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
              }`} />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {isFrontier && (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
                      ADMIN
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}

        <div className="sb-label mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Workspace
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
      </div>

      {/* desktop drag-to-resize handle */}
      <div
        onMouseDown={startResize}
        role="separator"
        aria-label="Resize sidebar"
        title="Drag to resize sidebar"
        className="absolute inset-y-0 right-0 z-10 hidden w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-indigo-200 md:block"
      />

      {/* Audience Mode Switcher Modal */}
      <AudienceModeSwitcherModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
      />
    </aside>
    </>
  );
}