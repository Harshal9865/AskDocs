"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Users, Globe, Clock, CheckCircle2, XCircle, Loader2, Send, LogOut, X } from "lucide-react";
import { api } from "@/lib/api";
import { showToast } from "@/components/Toast";
import type { JoinRequest, Workspace } from "@/lib/types";

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [applyMsg, setApplyMsg] = useState<Record<string, string>>({});
  const [showMsgFor, setShowMsgFor] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (query?: string, reset = true) => {
    if (reset) {
      setLoading(true);
      offsetRef.current = 0;
    } else setLoadingMore(true);
    try {
      const limit = 20;
      const offset = reset ? 0 : offsetRef.current;
      const [list, mine] = await Promise.all([
        api.discoverWorkspaces(query, limit, offset) as Promise<Workspace[]>,
        api.myJoinRequests().catch(() => [] as JoinRequest[]),
      ]);
      if (reset) {
        setWorkspaces(list);
        offsetRef.current = list.length;
      } else {
        setWorkspaces((prev) => [...prev, ...list]);
        offsetRef.current += list.length;
      }
      setHasMore(list.length === limit);
      setMyRequests(mine);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(undefined, true);
  }, [load]);

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void load(q.trim() || undefined, false);
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, q, load]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void load(q.trim() || undefined, true);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length === 0 || q.trim().length >= 2) void load(q.trim() || undefined, true);
    }, 400);
    return () => clearTimeout(t);
  }, [q, load]);

  const pendingIds = new Set(myRequests.filter((r) => r.status === "pending").map((r) => r.workspace_id));

  async function apply(wsId: string) {
    setBusyId(wsId);
    setMsg(null);
    try {
      const message = applyMsg[wsId]?.trim() || "";
      await api.createJoinRequest(wsId, message);
      showToast("success", "Request sent — an admin will review it.");
      setShowMsgFor(null);
      await load(q.trim() || undefined, true);
    } catch (e) {
      const m = (e as Error).message;
      setMsg(m);
      showToast("error", m);
    } finally {
      setBusyId(null);
    }
  }

  async function withdraw(reqId: string) {
    if (!confirm("Withdraw this request?")) return;
    try {
      await api.withdrawJoinRequest(reqId);
      showToast("success", "Request withdrawn");
      setMyRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (e) {
      showToast("error", (e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2 text-xl font-bold dark:text-white">
        <Globe className="h-5 w-5 text-indigo-600 dark:text-[#1DB954]" /> Discover Workspaces
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Find public workspaces and request to join. Approved workspaces appear in your sidebar.</p>

      <form onSubmit={onSearch} className="mb-4 mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or slug…"
            aria-label="Search workspaces"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#181818] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-[#1DB954] dark:focus:ring-[#1DB954]/20"
          />
          {q && (
            <button type="button" onClick={() => { setQ(""); void load(undefined, true); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button type="submit" className="hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-[#1DB954] dark:text-black sm:block">
          Search
        </button>
      </form>

      {msg && <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200">{msg}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <Globe className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">No public workspaces found.</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-zinc-500">Ask an admin to make a workspace discoverable in <span className="font-medium">Workspace Settings → Visibility</span>.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {workspaces.map((ws) => {
              const isPending = pendingIds.has(ws.id);
              const isOpen = showMsgFor === ws.id;
              return (
                <li key={ws.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-[#121212] dark:hover:border-white/15">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-slate-900 dark:text-white">{ws.name}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Public</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/5 dark:text-zinc-400">
                          <Users className="h-3 w-3" /> {ws.member_count ?? "—"} members
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500">
                        <span>/{ws.slug}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(ws.created_at).toLocaleDateString()}</span>
                      </div>
                      {isOpen && (
                        <div className="mt-3">
                          <textarea
                            value={applyMsg[ws.id] || ""}
                            onChange={(e) => setApplyMsg((m) => ({ ...m, [ws.id]: e.target.value }))}
                            placeholder="Optional message to admins (why you want to join)…"
                            maxLength={500}
                            rows={2}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#181818] dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {ws.role ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Joined ({ws.role})
                        </span>
                      ) : !isPending ? (
                        <>
                          <button
                            onClick={() => (isOpen ? void apply(ws.id) : setShowMsgFor(ws.id))}
                            disabled={busyId === ws.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-[#1DB954] dark:text-black"
                          >
                            {busyId === ws.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            {isOpen ? "Send request" : "Apply to join"}
                          </button>
                          {isOpen && (
                            <button onClick={() => setShowMsgFor(null)} className="text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400">
                              Cancel
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Requested</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div ref={sentinelRef} className="h-6" />
          {loadingMore && <p className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading more…</p>}
          {!hasMore && workspaces.length > 0 && <p className="py-4 text-center text-xs text-slate-400">No more workspaces</p>}
        </>
      )}

      {myRequests.length > 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121212]">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-200">
            <Clock className="h-4 w-4 text-slate-400" /> My requests · {myRequests.length}
          </h2>
          <ul className="space-y-2">
            {myRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800 dark:text-zinc-200">{r.workspace_name || r.workspace_id}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500">
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    {r.message && <span>· “{r.message.slice(0, 40)}”</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : r.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"}`}>
                    {r.status === "pending" ? <><Clock className="mr-1 inline h-3 w-3" /> pending</> : r.status === "approved" ? <><CheckCircle2 className="mr-1 inline h-3 w-3" /> approved</> : <><XCircle className="mr-1 inline h-3 w-3" /> rejected</>}
                  </span>
                  {r.status === "pending" && (
                    <button onClick={() => void withdraw(r.id)} className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" title="Withdraw">
                      <LogOut className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
