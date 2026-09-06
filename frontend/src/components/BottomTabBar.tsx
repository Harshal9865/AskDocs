"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMobile, usePrefersReducedMotion } from "@/lib/hooks/useMobile";
import { getModeColors, type Mode } from "@/lib/design-tokens";
import { useAudienceMode } from "@/lib/audience-mode-context";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Layers,
  User,
  CircleDot,
} from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, shortcut: "1" },
  { href: "/chat", label: "AI Chat", icon: Sparkles, shortcut: "2" },
  { href: "/documents", label: "Documents", icon: FileText, shortcut: "3" },
  { href: "/frontier", label: "Studios", icon: Layers, shortcut: "4" },
  { href: "/settings", label: "Profile", icon: User, shortcut: "5" },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();
  const { mode } = useAudienceMode();
  const { theme, resolvedTheme } = useTheme();
  const { isMobile, isClient } = useMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!isClient || !isMobile || !mounted) return null;

  const isDark = resolvedTheme === "dark";
  const colors = getModeColors(mode as Mode, isDark);

  const getActiveTab = () => {
    for (const tab of TABS) {
      if (pathname === tab.href || pathname.startsWith(tab.href + "/")) {
        return tab;
      }
    }
    return TABS[0];
  };

  const activeTab = getActiveTab();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      role="navigation"
      aria-label="Primary navigation"
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <div
        className="relative flex items-center justify-around h-16"
        style={{
          background: `var(--color-bg-elevated, ${isDark ? "#181824" : "#ffffff"})`,
          borderTop: `1px solid var(--color-border-primary, ${isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5"})`,
          boxShadow: `0 -4px 20px var(--shadow-sm, ${isDark ? "rgba(0,0,0,0.3)" : "rgba(15,23,42,0.05)"})`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Mode indicator dot */}
        <div
          className="absolute left-4 top-3"
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: colors.primary,
            boxShadow: `0 0 8px ${colors.primary}`,
            animation: prefersReducedMotion ? "none" : "pulse-ring 2s ease-out infinite",
          }}
          aria-label={`Current mode: ${mode}`}
        />

        {TABS.map((tab, index) => {
          const isActive = activeTab === tab;
          const Icon = tab.icon;
          const key = tab.shortcut;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted hover:text-secondary"
              }`}
              style={{
                color: isActive ? colors.primary : "var(--color-text-muted)",
                minWidth: "60px",
              }}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${tab.label}${isActive ? " (current)" : ""}`}
            >
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: isActive ? colors.light : "transparent",
                  transition: prefersReducedMotion
                    ? "none"
                    : "background 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <Icon
                  className={`h-5 w-5 transition-all duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                  style={{
                    color: isActive ? colors.primary : "inherit",
                  }}
                  aria-hidden="true"
                />

                {isActive && (
                  <span
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black"
                    style={{
                      background: colors.primary,
                      color: "var(--color-text-inverse)",
                    }}
                  >
                    {key}
                  </span>
                )}
              </div>

              <span
                className="text-[10px] font-semibold leading-none transition-opacity"
                style={{
                  opacity: isActive ? 1 : 0.7,
                  color: isActive ? colors.primary : "inherit",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* Animated indicator */}
        <div
          className="absolute bottom-full left-1/2 h-1 w-0 -translate-x-1/2 rounded-full"
          style={{
            background: colors.primary,
            transform: `translateX(-50%) translateX(${TABS.findIndex((t) => t === activeTab) * 20}%)`,
            transition: prefersReducedMotion
              ? "none"
              : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.2s ease",
            width: "40px",
          }}
          aria-hidden="true"
        />
      </div>

      <style jsx>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 var(--ring-color); }
          70% { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </nav>
  );
}
