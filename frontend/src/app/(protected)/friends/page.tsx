"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import { Search, UserPlus, UsersRound, Check, X, Shield, Trash2 } from "lucide-react";
import type { Member } from "@/lib/types";

type Tab = "suggested" | "requests" | "friends";

function FriendCard({
  member,
  action,
}: {
  member: Member;
  action: React.ReactNode;
}) {
  const { src, stickerId } = useUserAvatar(member.user_id, member.avatar_kind, member.avatar_value);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#121212]">
      <Avatar name={member.name || member.email} size={56} src={src} stickerId={stickerId} showPresence online={member.online} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold dark:text-white">
          {member.name || member.email}{" "}
          {member.pronouns && <span className="text-xs font-normal text-slate-500">({member.pronouns})</span>}
        </div>
        <div className="truncate text-xs text-slate-500 dark:text-zinc-400">
          {member.status || member.bio?.slice(0, 40) || member.email}
          {member.online ? (
            <span className="ml-1 inline-flex items-center gap-1 text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
            </span>
          ) : null}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export default function FriendsPage() {
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState<Tab>("suggested");
  const [friends, setFriends] = useState<Member[]>([]);
  const [requests, setRequests] = useState<Member[]>([]);
  const [suggested, setSuggested] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [f, r, s] = await Promise.all([
        api.listFriends().catch(() => [] as Member[]),
        api.listFriendRequests().catch(() => [] as Member[]),
        workspace ? api.friendSuggestions(workspace.id).catch(() => [] as Member[]) : Promise.resolve([] as Member[]),
      ]);
      setFriends(f as unknown as Member[]);
      setRequests(r as unknown as Member[]);
      setSuggested(s as unknown as Member[]);
    } catch {}
  }, [workspace]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Global user search across any workspace (fires when query >= 2 chars)
  const [globalResults, setGlobalResults] = useState<Member[]>([]);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGlobalResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .searchUsers(q)
        .then((res) => {
          if (!cancelled) setGlobalResults(res);
        })
        .catch(() => {
          if (!cancelled) setGlobalResults([]);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    try {
      await fn();
      await loadAll();
    } catch (err) {
      alert((err as Error).message);
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
    { key: "suggested", label: "Suggested", count: suggested.length },
    { key: "requests", label: "Requests", count: requests.length },
    { key: "friends", label: "Friends", count: friends.length },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <UsersRound className="h-5 w-5 text-indigo-600" /> Friends
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Add friends from any workspace, manage requests, and view their profiles.
      </p>

      <div className="mt-4 flex gap-1.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-400"
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
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
        />
      </div>

      <div className="mt-6 space-y-3">
        {tab === "suggested" && (
          <>
            {/* Global search results (any workspace) when searching */}
            {query.trim().length >= 2 && (
              <>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Global results
                </h2>
                {globalResults.length === 0 ? (
                  <p className="mb-6 rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
                    No users found for “{query.trim()}”.
                  </p>
                ) : (
                  <div className="mb-8 space-y-3">
                    {globalResults
                      .filter((g) => !suggested.some((s) => s.user_id === g.user_id))
                      .map((g) => (
                        <FriendCard
                          key={g.user_id}
                          member={g}
                          action={
                            <button
                              disabled={busy === g.user_id}
                              onClick={() => act(g.user_id, () => api.sendFriendRequest(g.user_id))}
                              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Add
                            </button>
                          }
                        />
                      ))}
                  </div>
                )}
              </>
            )}
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              From your workspaces
            </h2>
            {filterByQuery(suggested).length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5">
                No suggestions — invite colleagues from Members.
              </p>
            ) : (
              filterByQuery(suggested).map((m) => (
                <FriendCard
                  key={m.user_id}
                  member={m}
                  action={
                    <button
                      disabled={busy === m.user_id}
                      onClick={() => act(m.user_id, () => api.sendFriendRequest(m.user_id))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Add
                    </button>
                  }
                />
              ))
            )}
          </>
        )}
        {tab === "requests" && (
          <>
            {filterByQuery(requests).length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No pending requests.</p>
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
                          onClick={() => act(fid, () => api.acceptFriend(fid))}
                          className="rounded-full bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          disabled={busy === fid}
                          onClick={() => act(fid, () => api.declineFriend(fid))}
                          className="rounded-full border border-slate-200 bg-white p-1.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5"
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
            {filterByQuery(friends).length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No friends yet — add from Suggested.</p>
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
                          onClick={() => (window.location.href = `/profile/${m.user_id}`)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-white/10 dark:bg-white/5"
                        >
                          View
                        </button>
                        <button
                          disabled={busy === fid}
                          onClick={() => act(fid, () => api.unfriend(fid))}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          title="Remove friend"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          disabled={busy === fid}
                          onClick={() => act(fid, () => api.blockFriend(fid))}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
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
      </div>
    </div>
  );
}
