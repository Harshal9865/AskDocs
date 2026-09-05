"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkspaceSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workspaces?tab=settings");
  }, [router]);

  return null;
}
