"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Search, Settings, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import NotificationBell from "@/components/NotificationBell";
import Avatar from "@/components/Avatar";

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      {/* brand */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex shrink-0 items-center gap-2"
        aria-label="AskDocs home"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
          A
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
        className={`relative w-40 sm:w-64 ${pathname === "/search" ? "ml-auto" : ""} ${
          pathname === "/search" ? "" : "ml-auto"
        }`}
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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
            <Avatar name={user?.name ?? "?"} size={32} />
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
