"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, X, CircleDot } from "lucide-react";
import { useMobile, usePrefersReducedMotion } from "@/lib/hooks/useMobile";
import { getModeColors, type Mode } from "@/lib/design-tokens";
import { useAudienceMode } from "@/lib/audience-mode-context";
import { useTheme } from "next-themes";
import { useEffect } from "react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg> },
  { href: "/chat", label: "AI Chat", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" /><line x1="12" y1="22" x2="12" y2="15.5" /></svg> },
  { href: "/documents", label: "Documents", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
  { href: "/frontier", label: "Frontier Labs", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>, special: true },
];

const NAV_INTELLIGENCE = [
  { href: "/hub", label: "Innovation Hub", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg> },
  { href: "/extract", label: "Data Extractor", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg> },
  { href: "/convert", label: "Format & Redact", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
  { href: "/slides", label: "Slide Decks", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg> },
  { href: "/study-guide", label: "Study Studio", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10" /><path d="M6 6h.01" /><path d="M10 6h.01" /><path d="M14 6h.01" /><path d="M18 6h.01" /></svg> },
  { href: "/listen", label: "Audio Briefs", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg> },
  { href: "/contracts", label: "Contracts", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
  { href: "/contracts/compare", label: "Redline Diff", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="5" x2="19" y2="19" /><polyline points="5 19 14 19 14 5" /><polyline points="5 5 5 19 19 19" /></svg> },
  { href: "/memory", label: "Memory Graph", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><circle cx="19" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><line x1="13.5" y1="13.5" x2="17" y2="17" /><line x1="6.5" y1="17.5" x2="10" y2="21" /></svg> },
  { href: "/health", label: "Doc Health", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
  { href: "/digest", label: "Weekly Digest", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
  { href: "/canvas", label: "Canvas", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M12 2v20" /><path d="M2 12h20" /></svg> },
];

const NAV_SECONDARY = [
  { href: "/pricing", label: "Plans & Pricing", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> },
  { href: "/insights", label: "Insights", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
  { href: "/activity", label: "Activity log", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
  { href: "/help", label: "Help & FAQ", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> },
  { href: "/trash", label: "Trash", icon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> },
];

interface SidebarRailProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function SidebarRail({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarRailProps) {
  const { mode, config: modeConfig } = useAudienceMode();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { isMobile, isClient } = useMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!isClient || !mounted) return null;

  const isDark = resolvedTheme === "dark";
  const colors = getModeColors(mode as Mode, isDark);

  const filteredIntelligence = NAV_INTELLIGENCE.filter((item) => {
    const isContractTool = ["/contracts", "/contracts/compare"].includes(item.href);
    const isStudyTool = item.href === "/study-guide";
    if (modeConfig.id === "academic") return !isContractTool;
    if (modeConfig.id === "office") return !isContractTool && !isStudyTool;
    if (modeConfig.id === "personal") return !isContractTool;
    if (modeConfig.id === "legal") return !isStudyTool;
    return true;
  });

  const prioritizedIntelligence = [...filteredIntelligence].sort((a, b) => {
    const idxA = modeConfig.priorityStudios.indexOf(a.href);
    const idxB = modeConfig.priorityStudios.indexOf(b.href);
    const orderA = idxA === -1 ? 99 : idxA;
    const orderB = idxB === -1 ? 99 : idxB;
    return orderA - orderB;
  });

  const dynamicNav = NAV_MAIN.map((item) =>
    item.href === "/chat" ? { ...item, label: modeConfig.chatLabel } : item
  );

  if (isMobile && !mobileOpen) return null;

  const railWidth = collapsed ? 68 : 240;

  return (
    <aside
      className="fixed top-0 left-0 z-40 flex flex-col h-full transition-all duration-300"
      style={{
        width: railWidth,
        background: `var(--color-bg-elevated, ${isDark ? "#12121a" : "#ffffff"})`,
        borderRight: `1px solid var(--color-border-primary, ${isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5"})`,
        boxShadow: `4px 0 20px var(--shadow-sm, ${isDark ? "rgba(0,0,0,0.3)" : "rgba(15,23,42,0.05)"})`,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        willChange: "transform",
      }}
      aria-label="Sidebar navigation"
    >
      {/* Collapse/Expand button - desktop only */}
      {!isMobile && (
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-2 top-14 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all"
          style={{
            borderColor: `var(--color-border-primary)`,
            background: `var(--color-bg-elevated)`,
            boxShadow: `var(--shadow-md)`,
          }}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
          ) : (
            <ChevronLeft className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
          )}
        </button>
      )}

      {/* Mobile close button */}
      {isMobile && mobileOpen && (
        <button
          onClick={onCloseMobile}
          className="absolute -right-10 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <X className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Backdrop for mobile */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col h-full overflow-hidden">
        {/* Header / Workspace */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--color-border-primary)" }}>
          {!collapsed && (
            <Link
              href="/workspaces"
              className="flex-1 min-w-0 flex items-center gap-3"
              onClick={onCloseMobile}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm" style={{ background: modeConfig.themeColor }}>
                {modeConfig.id === "academic" ? "🎓" : modeConfig.id === "office" ? "🏢" : modeConfig.id === "legal" ? "⚖️" : "💼"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                  {modeConfig.badge}
                </p>
                <p className="text-[10px] font-medium truncate" style={{ color: "var(--color-text-muted)" }}>
                  {modeConfig.tagline}
                </p>
              </div>
            </Link>
          )}

          {collapsed && (
            <Link href="/workspaces" className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm" style={{ background: modeConfig.themeColor }} title={modeConfig.name} onClick={onCloseMobile}>
              {modeConfig.id === "academic" ? "🎓" : modeConfig.id === "office" ? "🏢" : modeConfig.id === "legal" ? "⚖️" : "💼"}
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4" style={{ scrollbarWidth: "none" }}>
          {/* Main Navigation */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Core
              </p>
            )}
            {dynamicNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    active
                      ? "bg-primary/10"
                      : "hover:bg-secondary"
                  }`}
                  style={{
                    color: active ? colors.primary : "var(--color-text-secondary)",
                    background: active ? colors.light : "transparent",
                  }}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} style={{ color: active ? colors.primary : "inherit" }} aria-hidden="true" />
                  {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Intelligence Studios */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                Studios
              </p>
            )}
            {prioritizedIntelligence.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              const isFrontier = item.href === "/frontier";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    active
                      ? "bg-primary/10"
                      : isFrontier
                      ? "border"
                      : "hover:bg-secondary"
                  }`}
                  style={{
                    color: active || isFrontier ? colors.primary : "var(--color-text-secondary)",
                    background: active ? colors.light : "transparent",
                    borderColor: isFrontier ? colors.primary : "transparent",
                  }}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active || isFrontier ? "text-primary" : ""}`} style={{ color: active || isFrontier ? colors.primary : "inherit" }} aria-hidden="true" />
                  {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                  {isFrontier && !collapsed && (
                    <span className="ml-auto text-[8px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${colors.primary}20`, color: colors.primary, border: `1px solid ${colors.primary}40` }}>
                      ADMIN
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Workspace Tools */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Workspace
              </p>
            )}
            {NAV_SECONDARY.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    active ? "bg-primary/10" : "hover:bg-secondary"
                  }`}
                  style={{
                    color: active ? colors.primary : "var(--color-text-secondary)",
                    background: active ? colors.light : "transparent",
                  }}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} style={{ color: active ? colors.primary : "inherit" }} aria-hidden="true" />
                  {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer - Profile */}
        <div className="p-3 border-t" style={{ borderColor: "var(--color-border-primary)" }}>
          {!collapsed ? (
            <Link href="/settings" onClick={onCloseMobile} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--color-accent-primary-light)" }}>
                <CircleDot className="h-5 w-5" style={{ color: "var(--color-accent-primary)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate" style={{ color: "var(--color-text-primary)" }}>Profile</p>
                <p className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>Settings & preferences</p>
              </div>
            </Link>
          ) : (
            <Link href="/settings" onClick={onCloseMobile} className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl" style={{ background: "var(--color-accent-primary-light)" }} title="Profile">
              <CircleDot className="h-5 w-5" style={{ color: "var(--color-accent-primary)" }} />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
