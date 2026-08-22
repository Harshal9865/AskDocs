"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [width, setWidth] = useState(264);

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
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) return null;

  return (
    <WorkspaceProvider>
      {/* mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-lg font-bold text-slate-900">AskDocs</span>
      </header>

      <div className="flex min-h-screen">
        <Sidebar
          mobileOpen={drawerOpen}
          onCloseMobile={() => setDrawerOpen(false)}
          width={width}
          setWidth={setWidth}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-16 pt-16 md:p-6 md:pb-6 md:pt-6">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
