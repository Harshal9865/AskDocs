"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  MessagesSquare,
  Compass,
  FileText,
  GraduationCap,
  Building2,
  Scale,
  Briefcase,
} from "lucide-react";
import { useAudienceMode } from "@/lib/audience-mode-context";
import AudienceModeSwitcherModal from "@/components/AudienceModeSwitcher";

export default function MobileBottomDock() {
  const pathname = usePathname();
  const { mode, config: modeConfig } = useAudienceMode();
  const [modeModalOpen, setModeModalOpen] = useState(false);

  const ModeIcon =
    mode === "academic"
      ? GraduationCap
      : mode === "office"
      ? Building2
      : mode === "legal"
      ? Scale
      : Briefcase;

  const modeBorder =
    mode === "office"
      ? "border-amber-500/60 bg-amber-500/15 text-amber-500"
      : mode === "academic"
      ? "border-purple-500/60 bg-purple-500/15 text-purple-400"
      : mode === "legal"
      ? "border-rose-500/60 bg-rose-500/15 text-rose-400"
      : "border-cyan-500/60 bg-cyan-500/15 text-cyan-400";

  const navItems = [
    { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
    { href: "/chat", label: "AI", Icon: Sparkles },
    { href: "/chats", label: modeConfig.chatLabel, Icon: MessagesSquare },
    { href: "/hub", label: "Hub", Icon: Compass },
    { href: "/documents", label: "Docs", Icon: FileText },
  ];

  return (
    <>
      {/* Mobile Floating Glass Dock (< md) */}
      <div className="fixed bottom-3 left-3 right-3 z-40 flex items-center justify-between rounded-full border border-slate-200/80 bg-white/85 p-1.5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#12141c]/85 md:hidden transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex w-full items-center justify-around gap-1">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-90 ${
                  active
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 dark:bg-white dark:text-black font-extrabold scale-105"
                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {active && <span className="text-[11px] font-bold">{label}</span>}
              </Link>
            );
          })}

          {/* Mode Switcher Pill */}
          <button
            onClick={() => setModeModalOpen(true)}
            type="button"
            aria-label="Switch Persona Mode"
            title={`Mode: ${modeConfig.name}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-transform active:scale-90 cursor-pointer ${modeBorder}`}
          >
            <ModeIcon className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* Audience Mode Switcher Bottom Sheet / Modal */}
      <AudienceModeSwitcherModal isOpen={modeModalOpen} onClose={() => setModeModalOpen(false)} />
    </>
  );
}
