"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import type { Invitation } from "@/lib/types";

function Badge({ status }: { status: string }) {
  if (status === "accepted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Accepted
      </span>
    );
  if (status === "declined")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <XCircle className="h-3 w-3" /> Declined
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function NotificationsPage() {
  const { workspace } = useWorkspace();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      const list = await api.myInvitationHistory();
      setInvites(list as Invitation[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      if (action === "accept") await api.acceptInvitation(id);
      else await api.declineInvitation(id);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const filtered =
    filter === "all" ? invites : invites.filter((i) => i.status === filter);

  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        Select a workspace to see your invitation history.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-bold">Notifications</h1>
      <p className="mb-6 text-sm text-slate-500">Your invitation history and pending requests.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "pending", "accepted", "declined"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No {filter !== "all" ? filter : ""} invitations.
            {filter !== "all" && (
              <button onClick={() => setFilter("all")} className="ml-1 font-medium text-indigo-600 hover:underline">
                Show all
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{inv.email}</div>
                  <div className="text-xs text-slate-500">
                    Role: {inv.role} · {new Date(inv.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge status={inv.status} />
                  {inv.status === "pending" && !isExpired(inv.expires_at ?? null) && (
                    <>
                      <button
                        onClick={() => void respond(inv.id, "accept")}
                        disabled={busyId === inv.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => void respond(inv.id, "decline")}
                        disabled={busyId === inv.id}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
