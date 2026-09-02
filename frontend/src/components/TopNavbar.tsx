"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Compass, Home, LayoutDashboard, MoreHorizontal, Search, Settings, LogOut, Sparkles, MessagesSquare, FileText, UsersRound, Pencil, User, CalendarClock, FileSpreadsheet, Activity, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import NotificationBell from "@/components/NotificationBell";
import Avatar from "@/components/Avatar";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";
import EditProfileModal from "@/components/EditProfileModal";

export default function TopNavbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, avatarSrc } = useAuth();
  const { workspace } = useWorkspace();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [brandSrc, setBrandSrc] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { dark, toggle } = useTheme();

  // resolve uploaded brand logo for the active workspace
  useEffect(() => {
    let cancelled = false;
    setBrandSrc(null);
    (async () => {
      if (!workspace || workspace.brand_kind !== "upload" || !workspace.brand_value) return;
      try {
        const url = await api.getBrandLogoUrl(workspace.id);
        if (!cancelled) setBrandSrc(url);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace]);

  // apply sticker brand when set
  const brandSticker =
    workspace?.brand_kind === "sticker" ? workspace.brand_value : null;

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
    <header className="dark:border-slate-700/50 dark:bg-[#181818] sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-1 border-b border-slate-200 bg-white px-2 transition-colors sm:gap-3 sm:px-5">
      {/* Left side cluster */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
            className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* brand */}
        <button
          onClick={() => router.push("/")}
          className="flex shrink-0 items-center gap-1.5"
          aria-label="AskDocs home"
        >
          <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center overflow-hidden rounded-lg">
            {brandSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brandSrc} alt="Brand" className="h-full w-full object-cover" />
            ) : brandSticker ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/stickers/${brandSticker}.svg`} alt="Brand" className="h-full w-full" />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-day.svg" alt="AskDocs" className="h-6 w-6 sm:h-7 sm:w-7 dark:hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-night.svg" alt="AskDocs" className="hidden h-6 w-6 sm:h-7 sm:w-7 dark:block" />
              </>
            )}
          </span>
          <span className="hidden sm:inline dark:text-white text-[15px] font-bold tracking-tight text-slate-900">
            AskDocs
          </span>
        </button>

        {/* Quick Nav Icons for small & tablet screens (<lg) */}
        <div className="flex items-center gap-0.5 lg:hidden">
          <Link
            href="/dashboard"
            title="Dashboard"
            aria-label="Dashboard"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/chat"
            title="AI Chat"
            aria-label="AI Chat"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              pathname === "/chat" || pathname.startsWith("/chat/")
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/chats"
            title="Office Chats"
            aria-label="Office Chats"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              pathname === "/chats" || pathname.startsWith("/chats/")
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
            }`}
          >
            <MessagesSquare className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/digest"
            title="Digest"
            aria-label="Digest"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              pathname === "/digest" || pathname.startsWith("/digest/")
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* desktop nav — fills the empty middle (collapses to More sheet <lg) */}
      <nav className="hidden items-center gap-1 lg:flex">
        {[
          { href: "/", label: "Home", Icon: Compass },
          { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
          { href: "/chat", label: "AI Chat", Icon: Sparkles },
          { href: "/chats", label: "Office Chats", Icon: MessagesSquare },
          { href: "/contracts", label: "Contracts", Icon: CalendarClock },
          { href: "/digest", label: "Digest", Icon: FileSpreadsheet },
          { href: "/canvas", label: "Canvas", Icon: LayoutGrid },
          { href: "/health", label: "Health", Icon: Activity },
          { href: "/documents", label: "Documents", Icon: FileText },
        ].map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white dark:bg-white dark:text-black"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
        {workspace && (
          <span
            title={`Workspace: ${workspace.name}`}
            className="ml-2 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="hidden max-w-[120px] truncate xl:inline">{workspace.name}</span>
            <span className="xl:hidden">{(workspace.name || "?").slice(0, 1).toUpperCase()}</span>
          </span>
        )}
      </nav>

      {/* compact More menu — hidden on phones (rail already shows icons), only for tablet gap md..lg */}
      <div className="relative hidden md:block lg:hidden">
        <button
          onClick={() => setMoreOpen((o) => !o)}
          aria-label="More pages"
          aria-expanded={moreOpen}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            moreOpen
              ? "bg-slate-900 text-white dark:bg-white dark:text-black"
              : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="dark:border-white/10 dark:bg-[#242424] absolute left-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              {[
                { href: "/", label: "Home", Icon: Compass },
                { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
                { href: "/chat", label: "AI Chat", Icon: Sparkles },
                { href: "/chats", label: "Office Chats", Icon: MessagesSquare },
                { href: "/friends", label: "Friends", Icon: UsersRound },
                { href: "/documents", label: "Documents", Icon: FileText },
              ].map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <button
                    key={href}
                    onClick={() => {
                      setMoreOpen(false);
                      router.push(href);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
              {workspace && (
                <div className="dark:border-white/10 mt-1 flex items-center gap-2 border-t border-slate-100 px-3 pb-1.5 pt-2 text-xs text-slate-500 dark:text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="truncate">{workspace.name}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Search — hidden on phones, icon navigates to /search to save space */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 2)
            router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative ml-auto mr-1 hidden sm:flex sm:mr-3 sm:w-64 lg:w-72 xl:w-80"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="dark:border-slate-600 dark:bg-[#242424] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-[#2a2a2a] w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
        />
      </form>

      {/* right side controls */}
      <div className="flex items-center gap-0.5 sm:gap-1.5 ml-auto sm:ml-0 shrink-0">
        <button
          onClick={() => router.push("/search")}
          aria-label="Search"
          title="Search"
          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 sm:hidden transition-colors"
        >
          <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>

        <Link
          href="/"
          title="Go to Homepage"
          aria-label="Go to Homepage"
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>

        <ThemeToggle dark={dark} onToggle={toggle} />
        <NotificationBell />

        {/* profile avatar menu */}
        <div className="relative ml-0.5" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open profile menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-0.5 sm:gap-1 rounded-full p-0.5 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <span className="sm:hidden">
              <Avatar
                name={user?.name ?? "?"}
                size={26}
                src={avatarSrc}
                stickerId={
                  user?.avatar_kind === "sticker" ? user.avatar_value ?? null : null
                }
              />
            </span>
            <span className="hidden sm:inline">
              <Avatar
                name={user?.name ?? "?"}
                size={30}
                src={avatarSrc}
                stickerId={
                  user?.avatar_kind === "sticker" ? user.avatar_value ?? null : null
                }
              />
            </span>
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
                      router.push("/settings/workspace");
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

