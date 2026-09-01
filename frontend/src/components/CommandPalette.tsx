"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useWorkspace } from "@/lib/workspace-context";
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
  Building2,
  UserCheck,
  PlusCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview analytics", category: "Navigation" },
  { label: "AI Document Chat", href: "/chat", icon: Sparkles, keywords: "ask ai knowledge rag citations", category: "Navigation" },
  { label: "Office Team Chats", href: "/chats", icon: MessageSquare, keywords: "team chat dm group colleague", category: "Navigation" },
  { label: "Friends & Network", href: "/friends", icon: UserCheck, keywords: "social contacts buddies friends", category: "Navigation" },
  { label: "Documents", href: "/documents", icon: FileText, keywords: "files pdf upload docs word", category: "Navigation" },
  { label: "Global Workspace Search", href: "/search", icon: Search, keywords: "find query lookup", category: "Navigation" },
  { label: "Discover Workspaces", href: "/discover", icon: Compass, keywords: "public join apply discover", category: "Navigation" },
  { label: "Knowledge Insights", href: "/insights", icon: BarChart3, keywords: "analytics gaps radar metrics", category: "Navigation" },
  { label: "Trash & Recovery", href: "/trash", icon: Trash2, keywords: "deleted restore purge bin", category: "Navigation" },
  { label: "Activity Audit Log", href: "/activity", icon: History, keywords: "audit log history timeline", category: "Navigation" },
  { label: "Workspace Members", href: "/members", icon: Users, keywords: "invite team colleagues roles", category: "Navigation" },
  { label: "Workspace Settings & Branding", href: "/settings/workspace", icon: Building2, keywords: "brand logo rename public emblem", category: "Navigation" },
  { label: "Personal Account Settings", href: "/settings", icon: Settings, keywords: "profile password avatar user", category: "Navigation" },
  { label: "Invitations & Notifications", href: "/notifications", icon: Bell, keywords: "invites pending alerts", category: "Navigation" },
  { label: "Help & FAQ", href: "/help", icon: HelpCircle, keywords: "help faq guide support", category: "Navigation" },
];

const QUICK_ACTIONS = [
  { label: "Ask AI a question", href: "/chat", icon: Sparkles, keywords: "prompt query ask ai" },
  { label: "Upload new document", href: "/documents", icon: PlusCircle, keywords: "add file upload pdf" },
  { label: "New office conversation", href: "/chats", icon: MessageSquare, keywords: "start direct message group chat" },
  { label: "Invite teammate to workspace", href: "/members", icon: Users, keywords: "add user member invite" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { workspace, workspaces, select } = useWorkspace();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Listen to custom event from top search bar if clicked
  useEffect(() => {
    const onTrigger = () => setOpen(true);
    window.addEventListener("open_command_palette", onTrigger);
    return () => window.removeEventListener("open_command_palette", onTrigger);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[15vh] backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#13111f]/95 animate-in zoom-in-95 duration-150"
        loop
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-slate-200/80 px-4 dark:border-white/10">
          <Search className="mr-3 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
          <Command.Input
            autoFocus
            placeholder="Type a command, search pages, or switch workspace…"
            className="flex-1 bg-transparent py-4 text-sm font-medium outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-500"
          />
          <kbd className="ml-2 hidden rounded-lg border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 sm:inline-block">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-96 overflow-y-auto p-2.5 scroll-touch space-y-1">
          <Command.Empty className="py-8 text-center text-xs font-medium text-slate-400 dark:text-zinc-500">
            No matching commands or pages found.
          </Command.Empty>

          {/* Quick Actions */}
          <Command.Group
            heading="Quick Actions"
            className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500"
          >
            {QUICK_ACTIONS.map((action) => (
              <Command.Item
                key={action.label}
                value={`${action.label} ${action.keywords}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(action.href);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all aria-selected:bg-gradient-to-r aria-selected:from-purple-50 aria-selected:to-indigo-50 aria-selected:text-purple-700 dark:text-zinc-200 dark:aria-selected:from-purple-950/40 dark:aria-selected:to-indigo-950/40 dark:aria-selected:text-purple-300"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <action.icon className="h-3.5 w-3.5" />
                </span>
                {action.label}
              </Command.Item>
            ))}
          </Command.Group>

          {/* Workspaces Switcher */}
          {workspaces.length > 0 && (
            <Command.Group
              heading="Switch Workspace"
              className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500"
            >
              {workspaces.map((ws) => {
                const isActive = workspace?.id === ws.id;
                return (
                  <Command.Item
                    key={ws.id}
                    value={`workspace ${ws.name} ${ws.slug}`}
                    onSelect={() => {
                      select(ws);
                      setOpen(false);
                      router.push("/dashboard");
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                        : "text-slate-700 aria-selected:bg-slate-100 dark:text-zinc-200 dark:aria-selected:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      {ws.name}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                        Active
                      </span>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}

          {/* Navigation Pages */}
          <Command.Group
            heading="Navigation"
            className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500"
          >
            {NAV_ITEMS.map((item) => (
              <Command.Item
                key={item.href}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-xs font-medium text-slate-700 transition-all aria-selected:bg-slate-100 aria-selected:font-bold aria-selected:text-slate-900 dark:text-zinc-300 dark:aria-selected:bg-white/5 dark:aria-selected:text-white"
              >
                <item.icon className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-400 backdrop-blur-md dark:border-white/5 dark:bg-white/[0.02] dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <span>Navigate with <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-2xs dark:bg-white/10">↑</kbd> <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-2xs dark:bg-white/10">↓</kbd></span>
            <span>·</span>
            <span>Select with <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-2xs dark:bg-white/10">Enter</kbd></span>
          </div>
          <div>
            Press <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-2xs dark:bg-white/10">Ctrl</kbd> + <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow-2xs dark:bg-white/10">K</kbd>
          </div>
        </div>
      </Command>
    </div>
  );
}
