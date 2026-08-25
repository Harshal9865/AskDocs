"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import CommandPalette from "@/components/CommandPalette";
import WelcomeModal from "@/components/WelcomeModal";
import Loading from "@/components/Loading";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [width, setWidth] = useState(264);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Onboarding guard: if profile incomplete and not skipped, force onboarding
  useEffect(() => {
    if (loading || !user) return;
    const onboarded = typeof window !== "undefined" ? localStorage.getItem("askdocs_onboarded") : "1";
    const hasProfile = !!(user.bio || user.phone || user.status || user.location || user.pronouns);
    if (!onboarded && !hasProfile && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [loading, user, pathname, router]);

  // restore saved sidebar width
  useEffect(() => {
    const saved = Number(localStorage.getItem("askdocs_sidebar_width"));
    if (saved >= 220 && saved <= 420) setWidth(saved);
  }, []);

  if (loading) {
    return <Loading />;
  }
  if (!user) return null;

  return (
    <WorkspaceProvider>
      <TopNavbar onMenu={() => setDrawerOpen(true)} />

      <div className="dark:bg-[#121212] flex min-h-[100dvh] pt-14 pl-[68px] transition-colors md:pl-0">
        <Sidebar
          mobileOpen={drawerOpen}
          onCloseMobile={() => setDrawerOpen(false)}
          width={width}
          setWidth={setWidth}
        />
        <main className="dark:bg-[#121212] min-w-0 flex-1 overflow-y-auto overflow-x-clip p-4 transition-colors md:p-6">
          <WelcomeModal />
          <CommandPalette />
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
