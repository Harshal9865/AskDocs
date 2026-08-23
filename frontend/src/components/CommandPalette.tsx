"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  FileText,
  Search,
  BarChart3,
  Trash2,
  History,
  Users,
  Settings,
  HelpCircle,
  Compass,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { label: "AI Chat", href: "/chat", icon: Sparkles, keywords: "ask ai knowledge" },
  { label: "Office Chats", href: "/chats", icon: MessageSquare, keywords: "team chat dm group" },
  { label: "Discover Workspaces", href: "/discover", icon: Compass, keywords: "public join apply" },
  { label: "Documents", href: "/documents", icon: FileText, keywords: "files pdf upload" },
  { label: "Search", href: "/search", icon: Search, keywords: "find query" },
  { label: "Insights", href: "/insights", icon: BarChart3, keywords: "analytics gaps radar" },
  { label: "Trash", href: "/trash", icon: Trash2, keywords: "deleted restore" },
  { label: "Activity Log", href: "/activity", icon: History, keywords: "audit log history" },
  { label: "Members", href: "/members", icon: Users, keywords: "invite team" },
  { label: "Workspace Settings", href: "/settings/workspace", icon: Settings, keywords: "brand rename public" },
  { label: "Account Settings", href: "/settings", icon: Settings, keywords: "profile password avatar" },
  { label: "Notifications", href: "/notifications", icon: Bell, keywords: "invites pending" },
  { label: "Help & FAQ", href: "/help", icon: HelpCircle, keywords: "help faq" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "/" && !open && (e.target as HTMLElement)?.tagName !== "INPUT" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
        // optional quick open with /
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[20vh]" onClick={() => setOpen(false)}>
      <Command
        className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        loop
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-slate-200 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="ml-2 hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 sm:inline-block">ESC</kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>
          <Command.Group heading="Go to" className="px-2 py-1 text-xs font-semibold text-slate-400">
            {NAV_ITEMS.map((item) => (
              <Command.Item
                key={item.href}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 aria-selected:bg-slate-100 aria-selected:text-slate-900"
              >
                <item.icon className="h-4 w-4 shrink-0 text-slate-500" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400">
          Press <kbd className="rounded bg-white px-1 py-0.5 shadow">Ctrl</kbd> + <kbd className="rounded bg-white px-1 py-0.5 shadow">K</kbd> to toggle
        </div>
      </Command>
    </div>
  );
}
