"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  MessagesSquare,
  FileText,
  Search,
  BarChart3,
  History,
  UsersRound,
  Settings,
  Trash2,
  CircleHelp,
  Bell,
  LogOut,
} from "lucide-react";
import { Command } from "cmdk";

type Item = { label: string; icon: React.ElementType; action: () => void; keywords?: string };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Ctrl+K / Cmd+K toggle, Esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const items: Item[] = [
    { label: "Dashboard", icon: LayoutDashboard, action: () => go("/dashboard"), keywords: "home overview" },
    { label: "AI Chat", icon: Sparkles, action: () => go("/chat"), keywords: "ask ai" },
    { label: "Office Chats", icon: MessagesSquare, action: () => go("/chats"), keywords: "team chat" },
    { label: "Documents", icon: FileText, action: () => go("/documents"), keywords: "files upload" },
    { label: "Search", icon: Search, action: () => go("/search"), keywords: "find" },
    { label: "Insights", icon: BarChart3, action: () => go("/insights"), keywords: "gaps analytics" },
    { label: "Trash", icon: Trash2, action: () => go("/trash"), keywords: "deleted" },
    { label: "Activity log", icon: History, action: () => go("/activity"), keywords: "audit history" },
    { label: "Members", icon: UsersRound, action: () => go("/members"), keywords: "invite people" },
    { label: "Workspace settings", icon: Settings, action: () => go("/settings/workspace"), keywords: "rename brand" },
    { label: "Account settings", icon: Settings, action: () => go("/settings"), keywords: "profile password avatar" },
    { label: "Notifications", icon: Bell, action: () => go("/notifications"), keywords: "invites bell" },
    { label: "Help & FAQ", icon: CircleHelp, action: () => go("/help"), keywords: "help faq" },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/50 p-4 pt-[18vh]" onClick={() => setOpen(false)}>
      <Command
        className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        loop
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <Command.Input
            autoFocus
            placeholder="Search pages, documents… (type to filter)"
            className="flex-1 py-3 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:block">ESC</kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-slate-500">No results.</Command.Empty>
          <Command.Group heading="Navigation" className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {items.map((it) => (
              <Command.Item
                key={it.label}
                value={`${it.label} ${it.keywords ?? ""}`}
                onSelect={() => it.action()}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
              >
                <it.icon className="h-4 w-4 shrink-0 text-slate-400 data-[selected=true]:text-indigo-600" />
                {it.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
          <span className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono">↑↓</span> navigate · <span className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono">↵</span> select · <span className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono">Ctrl K</span> toggle
        </div>
      </Command>
    </div>
  );
}
