"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Search, Settings, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import NotificationBell from "@/components/NotificationBell";
import Avatar from "@/components/Avatar";

export default function TopNavbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, avatarSrc } = useAuth();
  const { workspace } = useWorkspace();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [brandSrc, setBrandSrc] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
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
        onClick={() => router.push("/dashboard")}
        className="flex shrink-0 items-center gap-2"
        aria-label="AskDocs home"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-indigo-600 text-sm font-black text-white">
          {brandSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandSrc} alt="Brand" className="h-full w-full object-cover" />
          ) : brandSticker ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/stickers/${brandSticker}.svg`} alt="Brand" className="h-full w-full" />
          ) : (
            "A"
          )}
        </span>
        <span className="hidden text-[15px] font-bold tracking-tight text-slate-900 sm:block">
          AskDocs
        </span>
      </button>

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
          className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </form>

      {/* right side */}
      <div className="flex items-center gap-1 sm:gap-2">
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
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {user?.name}
                  </div>
                  <div className="truncate text-xs text-slate-500">{user?.email}</div>
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
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

