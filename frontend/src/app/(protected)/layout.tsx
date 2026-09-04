"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { AudienceModeProvider } from "@/lib/audience-mode-context";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import CommandPalette from "@/components/CommandPalette";
import WelcomeModal from "@/components/WelcomeModal";
import Loading from "@/components/Loading";
import { Toaster } from "@/components/Toast";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [width, setWidth] = useState(264);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (!loading && user) {
      const isMissingRequired =
        !user.name?.trim() || !user.job_title?.trim() || !user.job_role?.trim();
      const myProfilePath = `/profile/${user.id}`;
      if (isMissingRequired && pathname !== myProfilePath) {
        router.replace(`${myProfilePath}?edit=true`);
      }
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    const saved = Number(localStorage.getItem("askdocs_sidebar_width"));
    if (saved >= 220 && saved <= 420) setWidth(saved);
  }, []);

  if (loading) return <Loading />;
  if (!user) return null;

  const isChatPage = pathname === "/chat" || pathname === "/chats";
  const isFrontier = pathname === "/frontier" || pathname.startsWith("/frontier/");

  if (isFrontier) {
    return (
      <WorkspaceProvider>
        <AudienceModeProvider>
          <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-50 dark:bg-[#07060f] text-slate-900 dark:text-white transition-colors">
            <Toaster />
            <main className="min-w-0 flex-1 min-h-0 overflow-y-auto">
              <WelcomeModal />
              <CommandPalette />
              {children}
            </main>
          </div>
        </AudienceModeProvider>
      </WorkspaceProvider>
    );
  }

  return (
    <WorkspaceProvider>
      <AudienceModeProvider>
        <div className="flex h-[100dvh] flex-col overflow-hidden">
          <TopNavbar onMenu={() => setDrawerOpen(true)} />
          <Toaster />
          <div className={`dark:bg-[#121212] flex flex-1 min-h-0 transition-colors ${isChatPage ? "overflow-hidden" : ""}`}>
            <Sidebar
              mobileOpen={drawerOpen}
              onCloseMobile={() => setDrawerOpen(false)}
              width={width}
              setWidth={setWidth}
            />
            <main
              className={`dark:bg-[#121212] min-w-0 flex-1 min-h-0 transition-colors ${
                isChatPage
                  ? "flex flex-col overflow-hidden p-4 md:p-6"
                  : "overflow-y-auto p-4 md:p-6"
              }`}
            >
              <WelcomeModal />
              <CommandPalette />
              {children}
            </main>
          </div>
        </div>
      </AudienceModeProvider>
    </WorkspaceProvider>
  );
}
