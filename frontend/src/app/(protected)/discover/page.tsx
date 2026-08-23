"use client";

import { useEffect, useState } from "react";
import { Search, Users, Globe } from "lucide-react";
import { api } from "@/lib/api";
import type { JoinRequest, Workspace } from "@/lib/types";

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);

  const load = async (query?: string) => {
    setLoading(true);
    try {
      const [list, mine] = await Promise.all([api.discoverWorkspaces(query), api.myJoinRequests().catch(() => [] as JoinRequest[])]);
      setWorkspaces(list);
      setMyRequests(mine);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void load(q.trim() || undefined);
  };

  const pendingIds = new Set(myRequests.filter((r) => r.status === "pending").map((r) => r.workspace_id));

  async function apply(wsId: string) {
    setBusyId(wsId);
    setMsg(null);
    try {
      await api.createJoinRequest(wsId, "");
      setMsg("Request sent — an admin will review it.");
      await load(q.trim() || undefined);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 flex items-center gap-2 text-xl font-bold">
        <Globe className="h-5 w-5 text-indigo-600" /> Discover Workspaces
      </h1>
      <p className="mb-6 text-sm text-slate-500">Find public workspaces and request to join.</p>

      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Search
        </button>
      </form>

      {msg && <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{msg}</p>}

      {loading ? (
        <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
      ) : workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No public workspaces found. Ask an admin to make a workspace discoverable in <span className="font-medium">Workspace Settings → Visibility</span>.
        </div>
      ) : (
        <ul className="space-y-3">
          {workspaces.map((ws) => {
            const isPending = pendingIds.has(ws.id);
            return (
              <li key={ws.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-slate-900">{ws.name}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Public</span>
                  </div>
                  <div className="text-xs text-slate-500">/{ws.slug}</div>
                </div>
                <button
                  onClick={() => void apply(ws.id)}
                  disabled={busyId === ws.id || isPending}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    isPending ? "bg-slate-100 text-slate-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } disabled:opacity-50`}
                >
                  {isPending ? "Requested" : "Apply to join"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {myRequests.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">My requests</h2>
          <ul className="space-y-2">
            {myRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="truncate text-slate-700">{r.workspace_id}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "pending" ? "bg-amber-100 text-amber-700" : r.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
