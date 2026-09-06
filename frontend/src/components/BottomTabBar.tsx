"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMobile } from "@/lib/hooks/useMobile";
import { useTheme } from "@/components/ThemeToggle";
import { useAudienceMode } from "@/lib/audience-mode-context";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UsersRound,
  Home as HomeIcon,
  Compass,
  GraduationCap,
  FileSignature,
  Scale,
  Rocket,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { dark: isDark } = useTheme();
  const { isMobile, isClient } = useMobile();
  const { mode } = useAudienceMode();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [manualCollapsed, setManualCollapsed] = useState(false);

  useEffect(() => setMounted(true), []);

  // Dynamic Mode Tool (Tab 5) based on active operational mode
  const getModeTab = () => {
    if (mode === "academic") {
      return { href: "/study-guide", label: "Study Studio", icon: GraduationCap };
    }
    if (mode === "office") {
      return { href: "/contracts", label: "Contracts", icon: FileSignature };
    }
    if (mode === "legal") {
      return { href: "/contracts/compare", label: "Redline Diff", icon: Scale };
    }
    return { href: "/frontier", label: "Frontier", icon: Rocket };
  };

  const modeTab = getModeTab();

  // Exactly 5 Tabs:
  // 1. Dashboard (Left 1)
  // 2. Friends (Left 2 - not in top navbar)
  // 3. Home / Workspace (Center anchor - /workspaces)
  // 4. Info Hub (Right 1 - /hub)
  // 5. Replaceable Dynamic Mode Tool (Right 2 - changes according to mode!)
  const tabs = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/friends", label: "Friends", icon: UsersRound },
    { href: "/workspaces", label: "Home", icon: HomeIcon, isCenter: true },
    { href: "/hub", label: "Info Hub", icon: Compass },
    modeTab,
  ];

  // Scroll listener: auto-hide when scrolling down, show when scrolling up
  useEffect(() => {
    if (!isMobile) return;
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentY = window.scrollY || document.documentElement.scrollTop;

      if (currentY > lastScrollY + 12 && currentY > 40) {
        // Scrolling down -> auto hide bottom bar
        setVisible(false);
      } else if (currentY < lastScrollY - 12) {
        // Scrolling up -> reveal bottom bar
        setVisible(true);
      }
      lastScrollY = Math.max(0, currentY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [isMobile]);

  if (!isClient || !isMobile || !mounted) return null;

  const isHidden = !visible || manualCollapsed;

  return (
    <>
      {/* Floating reveal button when bottom bar is hidden/collapsed */}
      {isHidden && (
        <button
          onClick={() => {
            setVisible(true);
            setManualCollapsed(false);
          }}
          aria-label="Show navigation bar"
          title="Show navigation"
          className="fixed bottom-3 right-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-lg border border-white/20 active:scale-95 transition-all"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}

      {/* Main Resized 5-Tab Compact Bottom Navigation Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isHidden ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
        role="navigation"
        aria-label="Primary navigation"
      >
        <div
          className="relative flex items-center justify-around h-[54px] px-1"
          style={{
            background: isDark ? "rgba(18, 19, 30, 0.96)" : "rgba(255, 255, 255, 0.96)",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            boxShadow: `0 -4px 16px ${isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.06)"}`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Top handle bar to manually hide/minimize navigation */}
          <button
            onClick={() => setManualCollapsed(true)}
            aria-label="Hide navigation bar"
            title="Tap to hide navigation bar for full screen"
            className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-3.5 w-12 items-center justify-center rounded-t-full bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-zinc-400 active:scale-95 transition-all"
          >
            <ChevronDown className="h-3 w-3" />
          </button>

          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href + "/"));
            const Icon = tab.icon;
            const isCenter = "isCenter" in tab && tab.isCenter;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-1 flex-col items-center justify-center py-0.5 transition-all duration-150 active:scale-95 ${
                  isActive ? "font-bold" : "font-medium"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.label}
              >
                <div
                  className={`flex items-center justify-center transition-all ${
                    isCenter
                      ? `h-8 w-11 rounded-xl shadow-xs ${
                          isActive
                            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black"
                            : "bg-indigo-500/20 text-indigo-600 dark:text-purple-400 border border-indigo-500/30"
                        }`
                      : `h-7 w-10 rounded-full ${
                          isActive
                            ? "bg-indigo-600/15 dark:bg-purple-500/20 text-indigo-600 dark:text-purple-400"
                            : "text-slate-500 dark:text-zinc-400"
                        }`
                  }`}
                >
                  <Icon className={isCenter ? "h-4.5 w-4.5" : "h-4 w-4"} />
                </div>

                <span
                  className={`text-[9.5px] tracking-tight transition-colors truncate max-w-[56px] text-center ${
                    isActive
                      ? "text-indigo-600 dark:text-purple-400 font-bold"
                      : "text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
