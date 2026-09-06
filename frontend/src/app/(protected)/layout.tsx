"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { AudienceModeProvider } from "@/lib/audience-mode-context";
import Sidebar from "@/components/Sidebar";
import SidebarRail from "@/components/SidebarRail";
import TopNavbar from "@/components/TopNavbar";
import CommandPalette from "@/components/CommandPalette";
import WelcomeModal from "@/components/WelcomeModal";
import Loading from "@/components/Loading";
import { Toaster } from "@/components/Toast";
import BottomTabBar from "@/components/BottomTabBar";
import { useMobile } from "@/lib/hooks/useMobile";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(264);
  const [railMobileOpen, setRailMobileOpen] = useState(false);
  const { isMobile, isClient } = useMobile();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (!loading && user) {
      const isMissingRequired =
        !user.name?.trim() || !user.job_title?.trim() || !user.job_role?.trim();
      const isOnboarded = typeof window !== "undefined" && localStorage.getItem("askdocs_onboarded") === "1";
      if ((isMissingRequired || !isOnboarded) && pathname !== "/onboarding") {
        router.replace("/onboarding");
      }
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    const saved = Number(localStorage.getItem("askdocs_sidebar_width"));
    if (saved >= 220 && saved <= 420) setSidebarWidth(saved);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("askdocs_sb_collapsed") === "1";
    setSidebarCollapsed(saved);
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((c) => {
      localStorage.setItem("askdocs_sb_collapsed", c ? "0" : "1");
      return !c;
    });
  };

  const handleResize = (w: number) => {
    setSidebarWidth(w);
    localStorage.setItem("askdocs_sidebar_width", String(w));
  };

  if (loading) return <Loading />;
  if (!user) return null;

  const isChatPage = pathname === "/chat" || pathname === "/chats";
  const isFrontier = pathname === "/frontier" || pathname.startsWith("/frontier/");

  // On mobile, we use the rail (which can be toggled) + bottom tabs
  // On desktop, we use full sidebar + rail for collapsed state
  const showFullSidebar = isClient && !isMobile;

  if (isFrontier) {
    return (
      <WorkspaceProvider>
        <AudienceModeProvider>
          <div className="flex h-[100dvh] flex-col overflow-hidden transition-colors" style={{ background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}>
            <Toaster />
            <main className="min-w-0 flex-1 min-h-0 overflow-y-auto">
              <WelcomeModal />
              <CommandPalette />
              {children}
            </main>
            <BottomTabBar />
          </div>
        </AudienceModeProvider>
      </WorkspaceProvider>
    );
  }

  return (
    <WorkspaceProvider>
      <AudienceModeProvider>
        <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}>
          <Toaster />

          {/* Desktop: Full sidebar when expanded, rail when collapsed */}
          {showFullSidebar && (
            <>
              <Sidebar
                mobileOpen={railMobileOpen}
                onCloseMobile={() => setRailMobileOpen(false)}
                width={sidebarWidth}
                setWidth={handleResize}
              />
              <SidebarRail
                collapsed={sidebarCollapsed}
                onToggleCollapse={handleToggleCollapse}
                mobileOpen={railMobileOpen}
                onCloseMobile={() => setRailMobileOpen(false)}
              />
            </>
          )}

          {/* Mobile: Only rail (toggled) + bottom tabs always visible */}
          {!showFullSidebar && (
            <SidebarRail
              collapsed={false}
              onToggleCollapse={handleToggleCollapse}
              mobileOpen={railMobileOpen}
              onCloseMobile={() => setRailMobileOpen(false)}
            />
          )}

          {/* Main Content Area (TopNavbar + Content) */}
          <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
            <TopNavbar onMenu={() => setRailMobileOpen(true)} />
            <main
              className={`min-w-0 max-w-full flex-1 transition-colors ${
                isChatPage
                  ? "flex flex-col overflow-hidden p-3 pb-20 md:p-6"
                  : "overflow-y-auto p-4 pb-20 md:p-6"
              }`}
            >
              <WelcomeModal />
              <CommandPalette />
              {children}
            </main>
          </div>

          <BottomTabBar />
        </div>
      </AudienceModeProvider>
    </WorkspaceProvider>
  );
}
