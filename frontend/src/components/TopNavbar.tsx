"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Compass, LayoutDashboard, MoreHorizontal, Search, Settings, LogOut, Sparkles, MessagesSquare, FileText, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import NotificationBell from "@/components/NotificationBell";
import Avatar from "@/components/Avatar";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";

export default function TopNavbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, avatarSrc } = useAuth();
  const { workspace } = useWorkspace();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [brandSrc, setBrandSrc] = useState<string | null>(null);
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
    <header className="dark:border-amber-500/10 dark:bg-[#121212] fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-3 shadow-[0_1px_0_0_rgba(251,191,36,0.08)] transition-colors dark:shadow-[0_1px_0_0_rgba(251,191,36,0.12)] sm:px-5">
      {/* mobile hamburger */}
      {onMenu && (
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
      {/* brand */}
      <button
        onClick={() => router.push("/")}
        className="flex shrink-0 items-center gap-2"
        aria-label="AskDocs home"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg">
          {brandSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandSrc} alt="Brand" className="h-full w-full object-cover" />
          ) : brandSticker ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/stickers/${brandSticker}.svg`} alt="Brand" className="h-full w-full" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-day.svg" alt="AskDocs" className="h-7 w-7 dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-night.svg" alt="AskDocs" className="hidden h-7 w-7 dark:block" />
            </>
          )}
        </span>
        <span className="dark:text-white text-[15px] font-bold tracking-tight text-slate-900">
          AskDocs
        </span>
      </button>

      {/* desktop nav — fills the empty middle (collapses to More sheet <lg) */}
      <nav className="hidden items-center gap-1 lg:flex">
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
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-amber-600 dark:text-amber-400" : ""}`} />
              {label}
            </Link>
          );
        })}
        {workspace && (
          <span
            title={`Workspace: ${workspace.name}`}
            className="ml-2 flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            <span className="hidden max-w-[120px] truncate xl:inline">{workspace.name}</span>
            <span className="xl:hidden">{(workspace.name || "?").slice(0, 1).toUpperCase()}</span>
          </span>
        )}
      </nav>

      {/* compact More menu — same links, never disappears */}
      <div className="relative lg:hidden">
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
                        ? "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-amber-600 dark:text-amber-400" : ""}`} />
                    {label}
                  </button>
                );
              })}
              {workspace && (
                <div className="dark:border-white/10 mt-1 flex items-center gap-2 border-t border-slate-100 px-3 pb-1.5 pt-2 text-xs text-slate-500 dark:text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="truncate">{workspace.name}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* global search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 2)
            router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative ml-auto mr-2 sm:mr-4 w-40 sm:w-64 lg:w-72 xl:w-80"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="dark:border-slate-600 dark:bg-[#242424] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-400 dark:focus:bg-[#2a2a2a] w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20"
        />
      </form>

      {/* right side */}
      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle dark={dark} onToggle={toggle} />
        <NotificationBell />

        {/* profile avatar menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open profile menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-slate-100"
          >
            <Avatar
              name={user?.name ?? "?"}
              size={32}
              src={avatarSrc}
              stickerId={
                user?.avatar_kind === "sticker" ? user.avatar_value ?? null : null
              }
            />
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
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

