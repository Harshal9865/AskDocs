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
  LogOut,
  Pencil,
  X,
  ShieldCheck,
  Building2,
  Briefcase,
  ChevronRight,
  User,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { useAudienceMode } from "@/lib/audience-mode-context";
import AudienceModeSwitcherModal from "@/components/AudienceModeSwitcher";
import Colleagues from "@/components/Colleagues";
import FriendsQuickAccess from "@/components/FriendsQuickAccess";
import PlanBadge from "@/components/PlanBadge";
import Avatar from "@/components/Avatar";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";
import EditProfileModal from "@/components/EditProfileModal";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: Sparkles },
  { href: "/chats", label: "Chats", icon: MessagesSquare },
  { href: "/friends", label: "Friends", icon: UsersRound },
  { href: "/members", label: "Team Members", icon: UsersRound },
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
  { href: "/pricing", label: "Plans & Pricing", icon: Crown },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/activity", label: "Activity log", icon: History },
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
  const { user, logout, avatarSrc } = useAuth();
  const { workspace, workspaces } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const { mode, config: modeConfig } = useAudienceMode();
  const [showModeModal, setShowModeModal] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [docCount, setDocCount] = useState<number | null>(null);
  const [friendReqCount, setFriendReqCount] = useState<number>(0);
  const [sidebarBrandUrl, setSidebarBrandUrl] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { dark, toggle } = useTheme();

  const isCollapsed = collapsed && !mobileOpen;

  useEffect(() => {
    if (!workspace) {
      setSidebarBrandUrl(null);
      return;
    }
    if (workspace.brand_kind === "upload") {
      api
        .getBrandLogoUrl(workspace.id)
        .then((url) => setSidebarBrandUrl(url))
        .catch(() => setSidebarBrandUrl(null));
    } else {
      setSidebarBrandUrl(null);
    }
  }, [workspace]);

  const dynamicNav = NAV.map((item) =>
    item.href === "/chats" ? { ...item, label: modeConfig.chatLabel } : item
  );

  const filteredIntelligence = NAV_INTELLIGENCE.filter((item) => {
    const isContractTool = ["/contracts", "/contracts/compare"].includes(item.href);
    const isStudyTool = item.href === "/study-guide";

    if (modeConfig.id === "academic") return !isContractTool;
    if (modeConfig.id === "office") return !isContractTool && !isStudyTool;
    if (modeConfig.id === "personal") return !isContractTool;
    if (modeConfig.id === "legal") return !isStudyTool;
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
    [width, setWidth]
  );

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

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  useEffect(() => {
    if (!workspace) {
      setUnreadChatCount(0);
      return;
    }
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const chats = await api.listTeamChats(workspace.id);
        if (!cancelled)
          setUnreadChatCount(chats.reduce((n, c) => n + (c.unread_count > 0 ? 1 : 0), 0));
      } catch {
        /* ignore */
      }
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

  const ModeIcon =
    mode === "academic"
      ? GraduationCap
      : mode === "office"
      ? Building2
      : mode === "legal"
      ? Scale
      : Briefcase;

  return (
    <>
      {/* Mobile Drawer Overlay & Sheet (Rendered full height on mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden
          />

          {/* Dedicated Full-Height Mobile Navigation Drawer */}
          <aside className="relative flex w-[85vw] max-w-xs flex-col bg-white dark:bg-[#12131e] text-slate-900 dark:text-white shadow-2xl rounded-r-3xl overflow-hidden z-50 border-r border-slate-200 dark:border-white/10">
            {/* Mobile Drawer Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-white/5">
              <Link
                href="/dashboard"
                onClick={onCloseMobile}
                className="flex items-center gap-2.5 font-black text-base tracking-tight"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-white/10 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-day.svg" alt="AskDocs" className="h-5 w-5 dark:hidden" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-night.svg" alt="AskDocs" className="hidden h-5 w-5 dark:block" />
                </span>
                <span>AskDocs</span>
              </Link>
              <button
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-zinc-300 active:scale-95 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Active Workspace & Operational Mode Quick Switcher Card */}
            <div className="p-3 border-b border-slate-100 dark:border-white/10 space-y-2 bg-slate-50/30 dark:bg-black/20">
              <Link
                href="/workspaces"
                onClick={onCloseMobile}
                className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-500/20 bg-white dark:bg-[#181928] p-3 shadow-xs active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xs shadow-xs overflow-hidden">
                    {sidebarBrandUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sidebarBrandUrl} alt="WS" className="h-full w-full object-cover" />
                    ) : workspace?.brand_kind === "sticker" && workspace?.brand_value ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/stickers/${workspace.brand_value}.svg`} alt="WS" className="h-full w-full object-contain p-0.5" />
                    ) : (
                      (workspace?.name || "W").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="truncate text-xs font-black text-slate-900 dark:text-white">
                      {workspace?.name || "Select Workspace"}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} • Switch
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </Link>

              {/* Mode Button */}
              <button
                type="button"
                onClick={() => {
                  onCloseMobile?.();
                  setShowModeModal(true);
                }}
                className="w-full flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/30 p-2.5 text-xs font-bold text-purple-700 dark:text-purple-300 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <ModeIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Mode: {modeConfig.name}</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100">
                  Change
                </span>
              </button>
            </div>

            {/* Scrollable Mobile Nav Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Main Core Links */}
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Core Navigation
                </div>
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
                      className={`flex h-10 items-center justify-between rounded-xl px-3 text-sm font-semibold transition-all ${
                        active
                          ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md font-bold"
                          : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${active ? "text-purple-400 dark:text-purple-600" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {showCount && (
                        <span className="rounded-full bg-indigo-600 text-white px-2 py-0.5 text-xs font-black">
                          {count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Intelligence Section */}
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Intelligence Studios
                </div>
                {prioritizedIntelligence.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex h-10 items-center justify-between rounded-xl px-3 text-sm font-medium transition-all ${
                        active
                          ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md font-bold"
                          : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${active ? "text-purple-400 dark:text-purple-600" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Workspace Tools */}
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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
                      className={`flex h-10 items-center justify-between rounded-xl px-3 text-sm font-medium transition-all ${
                        active
                          ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md font-bold"
                          : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${active ? "text-purple-400 dark:text-purple-600" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile Drawer Bottom User Profile Footer */}
            <div className="border-t border-slate-100 dark:border-white/10 p-3.5 bg-slate-50 dark:bg-black/30 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={user?.name ?? "?"}
                    size={36}
                    src={avatarSrc}
                    stickerId={user?.avatar_kind === "sticker" ? user.avatar_value ?? null : null}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-slate-900 dark:text-white">
                      {user?.name}
                    </div>
                    <div className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <PlanBadge plan={user?.plan} size="xs" />
              </div>

              {/* Action Buttons: Edit Profile, Theme, Sign Out */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    onCloseMobile?.();
                    setEditProfileOpen(true);
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 active:scale-95"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Profile</span>
                </button>
                <div className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-1 text-xs">
                  <ThemeToggle dark={dark} onToggle={toggle} />
                </div>
                <button
                  onClick={() => {
                    onCloseMobile?.();
                    logout();
                    router.replace("/login");
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 py-2 text-xs font-bold text-red-600 dark:text-red-400 active:scale-95"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar (md+) */}
      <aside
        ref={asideRef}
        style={{ width: isCollapsed ? 68 : `min(${width}px, 85vw)` }}
        className={`hidden md:flex dark:border-slate-700/50 dark:bg-[#1a1a2e] sb-aside h-full h-[100dvh] top-0 z-30 shrink-0 flex-col border-r border-slate-200/90 bg-white transition-colors overflow-visible ${
          isCollapsed ? "sb-collapsed shadow-xl" : ""
        }`}
      >
        {/* Collapse arrow - desktop */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <svg
            className="sb-chevron transition-transform duration-200"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Top Header - Aligned with TopNavbar height (h-16) */}
        {!isCollapsed ? (
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 dark:border-slate-700/50 px-4 bg-white dark:bg-[#1a1a2e]">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-black text-slate-900 dark:text-white transition-transform hover:scale-105 active:scale-95"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-indigo-500/10 p-1 dark:bg-white/10 shadow-xs ring-1 ring-black/5 dark:ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-day.svg" alt="AskDocs" className="h-5 w-5 dark:hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-night.svg" alt="AskDocs" className="hidden h-5 w-5 dark:block" />
              </span>
              <span className="text-base font-black tracking-tight">AskDocs</span>
            </Link>
          </div>
        ) : (
          <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-200/90 dark:border-slate-700/50 bg-white dark:bg-[#1a1a2e]">
            <Link
              href="/dashboard"
              className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              aria-label="AskDocs home"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-indigo-500/10 p-1 dark:bg-white/10 shadow-xs ring-1 ring-black/5 dark:ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-day.svg" alt="AskDocs" className="h-5 w-5 dark:hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-night.svg" alt="AskDocs" className="hidden h-5 w-5 dark:block" />
              </span>
            </Link>
          </div>
        )}

        {/* Workspace Block */}
        {!isCollapsed ? (
          <div className="dark:border-slate-700/50 shrink-0 border-b border-slate-100 px-3 py-3 space-y-2">
            <Link
              href="/workspaces"
              title={`Active Workspace: ${workspace?.name || "None"}. Click to manage.`}
              className="w-full flex items-center justify-between gap-2.5 rounded-2xl border border-indigo-500/20 bg-slate-100/90 hover:bg-slate-200/80 dark:border-indigo-500/30 dark:bg-[#1c1c2b] dark:hover:bg-[#242438] p-2.5 transition-all duration-200 group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white font-black text-xs shadow-xs group-hover:scale-105 transition-transform overflow-hidden ring-1 ring-white/20">
                  {sidebarBrandUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sidebarBrandUrl} alt={workspace?.name || "WS"} className="h-full w-full object-cover" />
                  ) : workspace?.brand_kind === "sticker" && workspace?.brand_value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/stickers/${workspace.brand_value}.svg`} alt={workspace.name} className="h-full w-full object-contain p-0.5" />
                  ) : (
                    (workspace?.name || "W").slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left space-y-0.5 overflow-hidden">
                  <div className="truncate text-xs font-black text-slate-900 dark:text-white">
                    {workspace?.name || "Select Workspace"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="truncate">{workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}</span>
                    <span className="text-slate-400 dark:text-zinc-500 shrink-0">•</span>
                    <span className="group-hover:underline shrink-0 flex items-center gap-0.5">Manage ➔</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 pt-0.5">
              <Link
                href="/search"
                title="Search documents & chats"
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-[11px] font-bold transition-all ${
                  pathname === "/search"
                    ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 font-extrabold"
                    : "border-slate-200/80 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                }`}
              >
                <Search className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Search</span>
              </Link>
              <Link
                href="/discover"
                title="Discover public knowledge vaults"
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-[11px] font-bold transition-all ${
                  pathname === "/discover"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 font-extrabold"
                    : "border-slate-200/80 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                }`}
              >
                <Compass className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Discover</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Collapsed view header icon */
          <div className="shrink-0 border-b border-slate-100 p-2 py-3 flex flex-col items-center justify-center gap-2.5 dark:border-slate-700/50 w-full">
            <Link
              href="/workspaces"
              title={workspace ? `Workspace: ${workspace.name}` : "No workspace"}
              aria-label="Manage workspaces"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-xs font-black uppercase text-white overflow-hidden ring-1 ring-white/20"
            >
              {sidebarBrandUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sidebarBrandUrl} alt={workspace?.name || "WS"} className="h-full w-full object-cover" />
              ) : workspace?.brand_kind === "sticker" && workspace?.brand_value ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/stickers/${workspace.brand_value}.svg`} alt={workspace.name} className="h-full w-full object-contain p-0.5" />
              ) : (
                (workspace?.name ?? "W").slice(0, 1).toUpperCase()
              )}
            </Link>
          </div>
        )}

        {/* Desktop Nav Items */}
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
                title={item.label}
                aria-label={item.label}
                className={`group relative mb-0.5 flex h-8 items-center gap-2 rounded-xl px-2.5 text-[13px] font-medium transition-all duration-200 ${
                  isCollapsed ? "justify-center px-0" : ""
                } ${
                  active
                    ? "bg-slate-900 text-white shadow-xs dark:bg-[#1a2032] dark:text-white dark:border dark:border-purple-500/20 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-r-full bg-purple-500" aria-hidden />
                )}
                <Icon aria-hidden className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-purple-400 dark:text-purple-300" : "text-slate-400 dark:text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"}`} />
                {!isCollapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {showCount && (
                      <span className={`ml-auto rounded-full px-1.5 py-0.2 text-[10px] font-bold ${item.href === "/friends" ? "bg-red-500 text-white" : item.href === "/chats" ? "bg-[#1DB954] text-black" : "bg-slate-200 text-slate-700 dark:bg-white/15 dark:text-zinc-300"}`}>
                        {count}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}

          <div className="sb-label mb-1 mt-3 px-2.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
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
                title={item.label}
                aria-label={item.label}
                className={`group relative mb-0.5 flex h-8 items-center gap-2 rounded-xl px-2.5 text-[12.5px] font-medium transition-all duration-200 ${
                  isCollapsed ? "justify-center px-0" : ""
                } ${
                  active
                    ? "bg-slate-900 text-white shadow-xs dark:bg-[#1a2032] dark:text-white dark:border dark:border-purple-500/20 font-semibold"
                    : isFrontier
                    ? "border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#181236] to-slate-900 text-purple-200 hover:border-purple-400 hover:text-white font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-r-full bg-purple-500" aria-hidden />
                )}
                <Icon aria-hidden className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  active || isFrontier ? "text-purple-400 dark:text-purple-300" : "text-slate-400 dark:text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                }`} />
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">{item.label}</span>
                    {isFrontier && (
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[8.5px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
                        ADMIN
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}

          <div className="sb-label mb-1 mt-3 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Workspace
          </div>
          {NAV_SECONDARY.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={`group relative mb-0.5 flex h-8 items-center gap-2 rounded-xl px-2.5 text-[12.5px] font-medium transition-all duration-200 ${
                  isCollapsed ? "justify-center px-0" : ""
                } ${
                  active
                    ? "bg-slate-900 text-white shadow-xs dark:bg-[#1a2032] dark:text-white dark:border dark:border-purple-500/20 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-r-full bg-purple-500" aria-hidden />
                )}
                <Icon aria-hidden className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-purple-400 dark:text-purple-300" : "text-slate-400 dark:text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
          {!isCollapsed && (
            <div className="mt-4 -mx-2 space-y-0">
              <Colleagues />
              <FriendsQuickAccess />
            </div>
          )}
        </nav>

        {/* Desktop Profile Footer */}
        <div className="dark:border-slate-700/50 border-t border-slate-100 p-3.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              {!isCollapsed ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="dark:text-slate-200 truncate text-xs font-bold">{user?.name}</span>
                    <div>
                      <PlanBadge plan={user?.plan} size="xs" />
                    </div>
                  </div>
                  <div className="dark:text-slate-500 truncate text-[11px] text-slate-500">{user?.email}</div>
                </>
              ) : (
                <span
                  title={`${user?.name} (${user?.email})`}
                  className="flex mx-auto h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-700 dark:bg-white/10 dark:text-white"
                >
                  {(user?.name ?? "?").slice(0, 2)}
                </span>
              )}
            </div>
          </div>

          {!isCollapsed && (!user?.plan || user.plan.toLowerCase() === "free") && (
            <Link
              href="/pricing"
              className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-1.5 text-[11px] font-bold text-white shadow-xs hover:scale-[1.02] transition-all"
            >
              <Sparkles className="h-3 w-3" />
              <span>Upgrade Tier</span>
            </Link>
          )}
        </div>

        {/* Desktop drag resize handle */}
        <div
          onMouseDown={startResize}
          role="separator"
          aria-label="Resize sidebar"
          title="Drag to resize sidebar"
          className="absolute inset-y-0 right-0 z-10 hidden w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-indigo-200 md:block"
        />
      </aside>

      {/* Modals */}
      <AudienceModeSwitcherModal isOpen={showModeModal} onClose={() => setShowModeModal(false)} />
      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </>
  );
}