"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import CommandPalette from "@/components/CommandPalette";
import WelcomeModal from "@/components/WelcomeModal";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [width, setWidth] = useState(264);
  const hideSidebar = pathname === "/chat" || pathname.startsWith("/chat/");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // restore saved sidebar width
  useEffect(() => {
    const saved = Number(localStorage.getItem("askdocs_sidebar_width"));
    if (saved >= 220 && saved <= 420) setWidth(saved);
  }, []);

  if (loading) {
    return (
      <div className="dark:bg-[#121212] flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) return null;

  return (
    <WorkspaceProvider>
      <TopNavbar onMenu={hideSidebar ? undefined : () => setDrawerOpen(true)} />

      <div className="dark:bg-[#121212] flex min-h-[100dvh] pt-14 transition-colors">
        {!hideSidebar && (
          <Sidebar
            mobileOpen={drawerOpen}
            onCloseMobile={() => setDrawerOpen(false)}
            width={width}
            setWidth={setWidth}
          />
        )}
        <main className="dark:bg-[#121212] min-w-0 flex-1 overflow-y-auto overflow-x-clip p-4 transition-colors md:p-6">
          <WelcomeModal />
          <CommandPalette />
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
