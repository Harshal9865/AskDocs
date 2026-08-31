"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";

const ACTION_LABELS: Record<string, string> = {
  "workspace.created": "created workspace",
  "member.invited": "invited",
  "member.joined": "joined as member",
  "document.uploaded": "uploaded",
  "document.trashed": "moved to trash",
  "document.restored": "restored",
  "document.purged": "permanently deleted",
};

export default function ActivityPage() {
  const { workspace } = useWorkspace();
  const [items, setItems] = useState<
    { id: string; actor: string; action: string; target: string; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspace) {
      setLoading(false);
      return;
    }
    try {
      setItems(await api.getActivity(workspace.id));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!workspace) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Select a workspace first.</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-800">
        {error.includes("403") || error.toLowerCase().includes("insufficient")
          ? "Only workspace admins can view the activity log."
          : error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold">Activity log</h1>
      <p className="mb-6 text-sm text-slate-500">Admin-only audit trail of everything happening in “{workspace.name}”.</p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading activity…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          No activity recorded yet.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-slate-200 pl-5">
          {items.map((it) => (
            <li key={it.id} className="relative">
              <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <p className="text-sm text-slate-700">
                <span className="font-semibold">{it.actor}</span>{" "}
                {ACTION_LABELS[it.action] ?? it.action}{" "}
                <span className="font-medium">“{it.target}”</span>
              </p>
              <p className="text-xs text-slate-400">
                {new Date(it.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
