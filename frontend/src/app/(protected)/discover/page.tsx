"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiscoverPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workspaces?tab=discover");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        <p className="text-xs font-semibold">Opening Workspace Discovery…</p>
      </div>
    </div>
  );
}

