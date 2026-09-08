"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, Home, Search, Settings, LogOut, Sparkles, MessagesSquare, FileText, Pencil, User, ShieldCheck, GraduationCap, Compass, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { useAudienceMode } from "@/lib/audience-mode-context";
import AudienceModeSwitcherModal from "@/components/AudienceModeSwitcher";
import NotificationBell from "@/components/NotificationBell";
import Avatar from "@/components/Avatar";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";
import EditProfileModal from "@/components/EditProfileModal";

export default function TopNavbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, avatarSrc } = useAuth();
  const { workspace } = useWorkspace();
  const { mode, config: modeConfig } = useAudienceMode();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { dark, toggle } = useTheme();

  const handleLogoClick = () => {
    const isStandaloneApp =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in window.navigator &&
          (window.navigator as unknown as { standalone?: boolean }).standalone));

    if (isStandaloneApp) {
      router.push("/workspaces");
    } else {
      router.push("/");
    }
  };

  // close avatar menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <>
    <header className="dark:border-white/10 dark:bg-[#0d0c17] sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-3 sm:px-6 transition-all shadow-xs pt-[env(safe-area-inset-top,0px)]">
      {/* Left side cluster */}
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        {/* mobile hamburger */}
        {onMenu && (
          <button
            onClick={onMenu}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onMenu();
              }
            }}
            aria-label="Open menu"
            aria-expanded={false}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 transition-transform duration-200">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* brand */}
        <button
          onClick={handleLogoClick}
          className="flex shrink-0 items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="AskDocs home"
        >
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-indigo-500/10 p-1 dark:bg-white/10 shadow-xs ring-1 ring-black/5 dark:ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-day.svg" alt="AskDocs" className="h-5 w-5 dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-night.svg" alt="AskDocs" className="hidden h-5 w-5 dark:block" />
          </span>
          <span className="hidden sm:inline dark:text-white text-base font-black tracking-tight text-slate-900">
            AskDocs
          </span>
        </button>

        {/* desktop nav — expands progressively based on available laptop & desktop width */}
        <nav className="hidden items-center gap-1 lg:flex ml-1 sm:ml-2">
          {[
            { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
            { href: "/workspaces", label: "Workspaces", Icon: Home },
            { href: "/chat", label: "AI Chat", Icon: Sparkles },
            { href: "/chats", label: modeConfig.chatLabel, Icon: MessagesSquare },
            { href: "/hub", label: "Innovation Hub", Icon: Compass },
            { href: "/documents", label: "Documents", Icon: FileText },
          ].map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className={active ? "inline" : "hidden xl:inline"}>{label}</span>
              </Link>
            );
          })}
          {workspace && (
            <Link
              href="/workspaces"
              title={`Workspace: ${workspace.name}. Click to view workspace settings.`}
              className="ml-1 flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-slate-100/90 hover:bg-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-800 dark:border-indigo-500/30 dark:bg-[#1f1f2e] dark:text-white dark:hover:bg-[#28283d] transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="hidden max-w-[110px] truncate xl:inline">{workspace.name}</span>
              <span className="xl:hidden">{(workspace.name || "?").slice(0, 1).toUpperCase()}</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Search — hidden on phones & compact tablets, icon navigates to /search to save space */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 2)
            router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative ml-auto mr-1 hidden md:flex md:mr-1.5 md:w-44 lg:w-56 xl:w-64"
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="dark:border-slate-600 dark:bg-[#242424] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-[#2a2a2a] w-full rounded-lg border border-slate-300 bg-white py-1 pl-8 pr-2.5 text-xs outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
        />
      </form>

      {/* right side controls — visible across all screens with spacious, comfortable gap */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 lg:gap-4 shrink-0">
        <button
          onClick={() => router.push("/search")}
          aria-label="Search"
          title="Search"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden transition-all active:scale-95"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Audience Mode Switcher Pill Button */}
        <button
          onClick={() => setModeModalOpen(true)}
          type="button"
          aria-label="Switch Operational Mode"
          title={`Active Operational Mode: ${modeConfig.name}. Click to change mode.`}
          className={`flex h-8 items-center justify-center gap-1.5 rounded-full px-2.5 sm:px-3 text-xs font-black tracking-wider transition-all cursor-pointer border shadow-xs ${
            mode === "office"
              ? "border-[#d97706]/70 bg-[#d97706]/15 text-[#fbbf24] shadow-amber-500/10 hover:bg-[#d97706]/25 hover:border-[#fbbf24]"
              : mode === "academic"
              ? "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-purple-500/10 hover:bg-purple-500/25 hover:border-purple-400"
              : mode === "legal"
              ? "border-rose-500/50 bg-rose-500/15 text-rose-300 shadow-rose-500/10 hover:bg-rose-500/25 hover:border-rose-400"
              : "border-slate-400/40 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20"
          }`}
        >
          {mode === "office" ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-[#fbbf24] animate-pulse shrink-0" />
              <span className="hidden xl:inline font-mono uppercase text-[10px] sm:text-[11px] font-bold">ENTERPRISE NDA</span>
            </>
          ) : mode === "academic" ? (
            <>
              <GraduationCap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="hidden xl:inline font-mono uppercase text-[10px] sm:text-[11px] font-bold">STUDY MODE</span>
            </>
          ) : mode === "legal" ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="hidden xl:inline font-mono uppercase text-[10px] sm:text-[11px] font-bold">LEGAL VAULT</span>
            </>
          ) : (
            <>
              <span className="text-[11px]">💼</span>
              <span className="hidden xl:inline font-mono uppercase text-[10px] sm:text-[11px] font-bold">SOLO STUDIO</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            const isIOS = typeof window !== "undefined" && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
            if (isIOS) {
              alert("To install AskDocs on iOS: Tap Share -> Add to Home Screen");
            } else {
              const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
              if (isStandalone) {
                alert("AskDocs App is already installed and running!");
              } else {
                alert("To install AskDocs App: Tap the browser menu and select 'Install app' or 'Add to Home screen'");
              }
            }
          }}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        <ThemeToggle dark={dark} onToggle={toggle} />
        <NotificationBell />

        {/* Profile Avatar Menu — Compact & Proportionate on Mobile */}
        <div className="relative pl-0.5" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open profile menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1 rounded-full p-0.5 sm:p-1 transition-all hover:bg-slate-100 dark:hover:bg-white/10 ring-1 ring-slate-200/80 dark:ring-white/15 hover:ring-purple-400/50 active:scale-95 cursor-pointer"
          >
            <Avatar
              name={user?.name ?? "?"}
              size={24}
              src={avatarSrc}
              stickerId={
                user?.avatar_kind === "sticker" ? user.avatar_value ?? null : null
              }
            />
            <ChevronDown
              className={`hidden h-3.5 w-3.5 text-slate-400 transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="dark:border-slate-700/50 dark:bg-[#242424] absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                <div className="dark:border-slate-700/50 border-b border-slate-100 px-3 py-2.5">
                  <div className="dark:text-white truncate text-sm font-semibold text-slate-900">
                    {user?.name}
                  </div>
                  <div className="dark:text-slate-400 truncate text-xs text-slate-500">{user?.email}</div>
                </div>
                <div className="p-1">
                  <MenuItem
                    icon={<User className="h-4 w-4" />}
                    label="View my profile"
                    onClick={() => {
                      setMenuOpen(false);
                      if (user?.id) router.push(`/profile/${user.id}`);
                    }}
                  />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEditProfileOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors dark:text-slate-300 dark:hover:bg-slate-700/50 text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </button>
                  <MenuItem
                    icon={<Settings className="h-4 w-4" />}
                    label="Account settings"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/settings");
                    }}
                  />
                  <MenuItem
                    icon={<Settings className="h-4 w-4" />}
                    label="Workspace settings"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/workspaces?tab=settings");
                    }}
                  />
                </div>
                <div className="border-t border-slate-100 p-1">
                  <MenuItem
                    icon={<LogOut className="h-4 w-4" />}
                    label="Sign out"
                    danger
                    onClick={() => {
                      logout();
                      router.replace("/login");
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    <AudienceModeSwitcherModal isOpen={modeModalOpen} onClose={() => setModeModalOpen(false)} />
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          : "dark:text-slate-300 dark:hover:bg-slate-700/50 text-slate-700 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
