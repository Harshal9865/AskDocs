"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import { showToast } from "@/components/Toast";
import { Search, UserPlus, UsersRound, Check, X, Shield, Trash2, Loader2, UserSearch, Inbox, HeartHandshake, Ban } from "lucide-react";
import type { Member } from "@/lib/types";

type Tab = "suggested" | "requests" | "friends" | "blocked";

function FriendCard({
  member,
  action,
}: {
  member: Member;
  action: React.ReactNode;
}) {
  const { src, stickerId } = useUserAvatar(member.user_id, member.avatar_kind, member.avatar_value);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-[#121212] dark:hover:border-white/15">
      <Avatar name={member.name || member.email} size={52} src={src} stickerId={stickerId} showPresence online={member.online} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate text-sm font-semibold dark:text-white">
          <span className="truncate">{member.name || member.email}</span>
          {member.pronouns && <span className="shrink-0 text-xs font-normal text-slate-500">({member.pronouns})</span>}
          {member.online && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
        </div>
        <div className="truncate text-xs text-slate-500 dark:text-zinc-400">
          {member.status || member.bio?.slice(0, 44) || member.email}
          {member.online ? <span className="ml-1.5 text-emerald-600 font-medium">· Online</span> : null}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 dark:border-white/5 dark:bg-[#121212]">
      <div className="h-[52px] w-[52px] rounded-full bg-slate-200 dark:bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-white/5" />
      </div>
      <div className="h-7 w-16 rounded-full bg-slate-100 dark:bg-white/5" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint, action }: { icon: typeof UsersRound; title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <Icon className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-zinc-600" />
      <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-500">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default function FriendsPage() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Member[]>([]);
  const [requests, setRequests] = useState<Member[]>([]);
  const [suggested, setSuggested] = useState<Member[]>([]);
  const [blocked, setBlocked] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [f, r, s, b] = await Promise.all([
        api.listFriends().catch(() => [] as Member[]),
        api.listFriendRequests().catch(() => [] as Member[]),
        workspace ? api.friendSuggestions(workspace.id).catch(() => [] as Member[]) : Promise.resolve([] as Member[]),
        api.listBlocked?.().catch(() => [] as Member[]) ?? Promise.resolve([] as Member[]),
      ]);
      setFriends(f as unknown as Member[]);
      setRequests(r as unknown as Member[]);
      setSuggested(s as unknown as Member[]);
      setBlocked(b as unknown as Member[]);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // refresh online status every 30s
  useEffect(() => {
    const t = setInterval(() => void loadAll(), 30000);
    return () => clearInterval(t);
  }, [loadAll]);

  // Global user search across any workspace (fires when query >= 2 chars)
  const [globalResults, setGlobalResults] = useState<Member[]>([]);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGlobalResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const t = setTimeout(() => {
      api
        .searchUsers(q)
        .then((res) => {
          if (!cancelled) {
            setGlobalResults(res);
            setSearchLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setGlobalResults([]);
            setSearchLoading(false);
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  async function act(id: string, fn: () => Promise<unknown>, successMsg?: string) {
    setBusy(id);
    try {
      await fn();
      if (successMsg) showToast("success", successMsg);
      await loadAll();
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const filterByQuery = (list: Member[]) => {
    const q = query.toLowerCase();
    if (!q) return list;
    return list.filter((m) => (m.name || "").toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "friends", label: "Friends", count: friends.length },
    { key: "requests", label: "Requests", count: requests.length },
    { key: "suggested", label: "Suggested", count: suggested.length },
    { key: "blocked", label: "Blocked", count: blocked.length },
  ];

  // dedup global results vs existing edges
  const existingIds = new Set<string>([
    ...friends.map((f) => f.user_id),
    ...requests.map((r) => r.user_id),
    ...suggested.map((s) => s.user_id),
    ...blocked.map((b) => b.user_id),
  ]);
  const dedupedGlobal = globalResults.filter((g) => !existingIds.has(g.user_id));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2 text-xl font-bold dark:text-white">
        <UsersRound className="h-5 w-5 text-indigo-600 dark:text-[#1DB954]" /> Friends
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Add people from any workspace. Requests notify instantly — no invite needed.
      </p>

      <div role="tablist" aria-label="Friends sections" className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
            }`}
          >
            {t.label} {t.count !== undefined && t.count > 0 && <span className="ml-1 opacity-60">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search friends"
          className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#181818] dark:text-white dark:focus:border-[#1DB954] dark:focus:ring-[#1DB954]/20"
        />
        {searchLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>

      <div className="mt-6 space-y-3">
        {tab === "suggested" && (
          <>
            {/* Global search results (any workspace) when searching */}
            {query.trim().length >= 2 && (
              <>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <UserSearch className="h-3.5 w-3.5" /> Global results
                </h2>
                {searchLoading ? (
                  <div className="mb-6 space-y-3">
                    <SkeletonCard /><SkeletonCard />
                  </div>
                ) : dedupedGlobal.length === 0 ? (
                  <p className="mb-6 rounded-xl border border-dashed p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-zinc-400">
                    No new users found for “{query.trim()}”.
                  </p>
                ) : (
                  <div className="mb-6 space-y-3">
                    {dedupedGlobal.map((g) => (
                        <FriendCard
                          key={g.user_id}
                          member={g}
                          action={
                            <button
                              disabled={busy === g.user_id}
                              onClick={() => act(g.user_id, () => api.sendFriendRequest(g.user_id), "Request sent")}
                              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
                            >
                              {busy === g.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Add
                            </button>
                          }
                        />
                      ))}
                  </div>
                )}
              </>
            )}
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">From your workspaces</h2>
            {loading ? (
              <div className="space-y-3">
                <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            ) : filterByQuery(suggested).length === 0 ? (
              <EmptyState icon={UserSearch} title={query ? `No match for “${query}”` : "No suggestions yet"} hint="Join more workspaces or invite colleagues from Members — they'll appear here." />
            ) : (
              filterByQuery(suggested).map((m) => (
                <FriendCard
                  key={m.user_id}
                  member={m}
                  action={
                    <button
                      disabled={busy === m.user_id}
                      onClick={() => act(m.user_id, () => api.sendFriendRequest(m.user_id), "Request sent")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
                    >
                      {busy === m.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Add
                    </button>
                  }
                />
              ))
            )}
          </>
        )}
        {tab === "requests" && (
          <>
            {loading ? (
              <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
            ) : filterByQuery(requests).length === 0 ? (
              <EmptyState icon={Inbox} title="No pending requests" hint="When someone adds you, you'll see it here and in the sidebar badge." />
            ) : (
              filterByQuery(requests).map((m: unknown) => {
                const mem = m as Member & { id?: string };
                const fid = (mem as unknown as { id: string }).id || mem.user_id;
                return (
                  <FriendCard
                    key={mem.user_id}
                    member={mem}
                    action={
                      <span className="flex gap-1.5">
                        <button
                          disabled={busy === fid}
                          onClick={() => act(fid, () => api.acceptFriend(fid), "You are now friends")}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busy === fid ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Accept
                        </button>
                        <button
                          disabled={busy === fid}
                          onClick={() => {
                            if (!confirm(`Decline request from ${mem.name || mem.email}?`)) return;
                            void act(fid, () => api.declineFriend(fid), "Declined");
                          }}
                          className="rounded-full border border-slate-200 bg-white p-1.5 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                          aria-label="Decline"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    }
                  />
                );
              })
            )}
          </>
        )}
        {tab === "friends" && (
          <>
            {loading ? (
              <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
            ) : filterByQuery(friends).length === 0 ? (
              <EmptyState
                icon={HeartHandshake}
                title="No friends yet"
                hint="Your accepted friends appear here. Discover people in Suggested below."
                action={
                  <button onClick={() => setTab("suggested")} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-[#1DB954] dark:text-black">
                    Browse Suggested →
                  </button>
                }
              />
            ) : (
              filterByQuery(friends).map((m) => {
                const fid = (m as unknown as { id: string }).id || m.user_id;
                return (
                  <FriendCard
                    key={m.user_id}
                    member={m}
                    action={
                      <span className="flex gap-1">
                        <button
                          onClick={() => router.push(`/profile/${m.user_id}`)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                          View
                        </button>
                        <button
                          disabled={busy === fid}
                          onClick={() => {
                            if (!confirm(`Remove ${m.name || m.email} from friends?`)) return;
                            void act(fid, () => api.unfriend(fid), "Removed");
                          }}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                          title="Remove friend"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          disabled={busy === fid}
                          onClick={() => {
                            if (!confirm(`Block ${m.name || m.email}? They won't be able to add you again.`)) return;
                            void act(fid, () => api.blockFriend(fid), "Blocked");
                          }}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10"
                          title="Block"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      </span>
                    }
                  />
                );
              })
            )}
          </>
        )}
        {tab === "blocked" && (
          <>
            {loading ? (
              <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
            ) : filterByQuery(blocked).length === 0 ? (
              <EmptyState icon={Ban} title="No blocked users" hint="Blocked people are hidden from search and cannot send you requests." />
            ) : (
              filterByQuery(blocked).map((m) => {
                const fid = (m as unknown as { id: string }).id || m.user_id;
                return (
                  <FriendCard
                    key={m.user_id}
                    member={m}
                    action={
                      <button
                        disabled={busy === fid}
                        onClick={() => act(fid, () => api.unblockFriend(fid).catch(() => api.unfriend(fid)), "Unblocked")}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5"
                      >
                        Unblock
                      </button>
                    }
                  />
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
