"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }
  if (!user) return null;

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </WorkspaceProvider>
  );
}
