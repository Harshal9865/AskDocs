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
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Onboarding guard: mandatory = bio, status, pronouns, job_title, job_role
  useEffect(() => {
    if (loading || !user) return;
    const onboarded = typeof window !== "undefined" ? localStorage.getItem("askdocs_onboarded") : "1";
    const hasProfile = !!(
      user.bio &&
      user.status &&
      user.pronouns &&
      (user as unknown as { job_title?: string | null }).job_title &&
      (user as unknown as { job_role?: string | null }).job_role
    );
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
      <div className="flex min-h-dvh flex-col">
        <TopNavbar onMenu={() => setDrawerOpen(true)} />
        <Toaster />
        <div className="dark:bg-[#121212] flex flex-1 min-h-0 transition-colors">
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
      </div>
    </WorkspaceProvider>
  );
}
