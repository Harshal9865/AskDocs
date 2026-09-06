"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMobile } from "@/lib/hooks/useMobile";
import { useTheme } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Layers,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: Sparkles },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/frontier", label: "Studios", icon: Layers },
  { href: "/settings", label: "Profile", icon: User },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();
  const { dark: isDark } = useTheme();
  const { isMobile, isClient } = useMobile();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [manualCollapsed, setManualCollapsed] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const getActiveTab = () => {
    for (const tab of TABS) {
      if (pathname === tab.href || pathname.startsWith(tab.href + "/")) {
        return tab;
      }
    }
    return TABS[0];
  };

  const activeTab = getActiveTab();
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

      {/* Main Resized Compact Bottom Tab Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isHidden ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
        role="navigation"
        aria-label="Primary navigation"
      >
        <div
          className="relative flex items-center justify-around h-[52px] px-1"
          style={{
            background: isDark ? "rgba(18, 19, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
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

          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 ${
                  isActive ? "font-bold" : "font-medium"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.label}
              >
                <div
                  className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? "bg-indigo-600/15 dark:bg-purple-500/20 text-indigo-600 dark:text-purple-400"
                      : "text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>

                <span
                  className={`text-[10px] tracking-tight transition-colors ${
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
