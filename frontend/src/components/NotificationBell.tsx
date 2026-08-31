"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, UserPlus, Building, Bell } from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import type { Invitation, JoinRequest, Member } from "@/lib/types";

export default function NotificationBell() {
  const { workspace, refresh } = useWorkspace();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [joinReqs, setJoinReqs] = useState<JoinRequest[]>([]);
  const [friendReqs, setFriendReqs] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<Record<string, { workspace_name: string; inviter_email: string; role: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!workspace || !user) return;
    api.listMembers(workspace.id).then((members) => {
      const me = members.find((m) => m.user_id === user.id);
      setIsAdmin(me?.role === "admin");
    }).catch(() => {});
  }, [workspace, user]);

  const previewsRef = useRef(previews);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  const load = useCallback(async () => {
    try {
      const [list, reqs, fReqs] = await Promise.all([
        api.myInvitations().catch(() => []),
        isAdmin && workspace ? api.listJoinRequests(workspace.id).catch(() => []) : Promise.resolve([]),
        api.listFriendRequests().catch(() => []),
      ]);
      setInvites(list);
      setJoinReqs(reqs.filter((r: JoinRequest) => r.status === "pending"));
      setFriendReqs(fReqs || []);

      for (const inv of list) {
        if (!previewsRef.current[inv.id]) {
          try {
            const p = await api.invitationPreview(inv.id);
            setPreviews((prev) => ({ ...prev, [inv.id]: p }));
          } catch {
            /* ignore preview failure */
          }
        }
      }
    } catch {
      /* not signed in yet */
    }
  }, [isAdmin, workspace]);

  useEffect(() => {
    void load();
    pollRef.current = setInterval(() => void load(), 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  async function respondInvite(inv: Invitation, accept: boolean) {
    setBusyId(inv.id);
    try {
      if (accept) {
        await api.acceptInvitation(inv.id);
        await refresh();
        router.refresh();
      } else {
        await api.declineInvitation(inv.id);
      }
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (err) {
      alert((err as Error).message);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function respondFriend(f: Member, accept: boolean) {
    setBusyId(f.user_id);
    try {
      if (accept) {
        await api.acceptFriend(f.user_id);
      } else {
        await api.declineFriend(f.user_id);
      }
      setFriendReqs((prev) => prev.filter((item) => item.user_id !== f.user_id));
    } catch (err) {
      alert((err as Error).message);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const totalNotifs = invites.length + joinReqs.length + friendReqs.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${totalNotifs ? `, ${totalNotifs} pending notifications` : ""}`}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {totalNotifs > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0B0B0F]">
            {totalNotifs > 9 ? "9+" : totalNotifs}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />

          {/* dropdown */}
          <div
            role="dialog"
            aria-label="Notifications"
            className="
              fixed inset-x-2 top-[4.25rem] z-50
              rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121214]
              sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-88 sm:shadow-2xl
              overflow-hidden
            "
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                {totalNotifs > 0 && (
                  <span className="rounded-full bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {totalNotifs}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {totalNotifs === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-500">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">All caught up!</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">No pending notifications right now.</p>
              </div>
            ) : (
              <ul className="max-h-[65vh] overflow-y-auto p-2 space-y-1.5 sm:max-h-84 divide-y divide-slate-100/50 dark:divide-white/[0.04]">
                {/* Friend Requests */}
                {friendReqs.map((f) => (
                  <li key={f.user_id} className="rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04] bg-transparent">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
                        <UserPlus className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {f.name || f.email}
                        </p>
                        <p className="mb-2.5 text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          Sent you a friend request
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => void respondFriend(f, true)}
                            disabled={busyId === f.user_id}
                            className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => void respondFriend(f, false)}
                            disabled={busyId === f.user_id}
                            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}

                {/* Workspace Invitations */}
                {invites.map((inv) => {
                  const p = previews[inv.id];
                  return (
                    <li key={inv.id} className="rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04] bg-transparent">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                          <Building className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {p?.workspace_name ?? "Workspace Invitation"}
                          </p>
                          <p className="mb-2.5 text-[11px] text-slate-500 dark:text-zinc-400">
                            {p ? `${p.inviter_email} invited you as ${p.role}` : "Loading invite details…"}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => void respondInvite(inv, true)}
                              disabled={busyId === inv.id}
                              className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => void respondInvite(inv, false)}
                              disabled={busyId === inv.id}
                              className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}

                {/* Workspace Join Requests */}
                {joinReqs.map((req) => (
                  <li key={req.id} className="rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04] bg-transparent">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <UserPlus className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {req.user_name || req.user_email} wants to join
                        </p>
                        <p className="mb-2.5 text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {req.user_email}
                          {req.message && ` — "${req.message}"`}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setOpen(false);
                              router.push("/members");
                            }}
                            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                          >
                            Review in Members
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
