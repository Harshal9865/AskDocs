"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  X,
  UserPlus,
  Building,
  Bell,
  MessagesSquare,
  Volume2,
  VolumeX,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import type { Invitation, JoinRequest, Member, TeamChat } from "@/lib/types";
import { playMessageChime } from "@/lib/utils";
import Avatar from "./Avatar";

export interface UnifiedNotification {
  id: string;
  type: "chat" | "friend" | "invite" | "join";
  title: string;
  subtitle: string;
  timestamp: string;
  unreadCount?: number;
  avatarUser?: Member;
  chatId?: string;
  inviteId?: string;
  friendUser?: Member;
  joinReq?: JoinRequest;
}

export default function NotificationBell() {
  const { workspace, refresh } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [invites, setInvites] = useState<Invitation[]>([]);
  const [joinReqs, setJoinReqs] = useState<JoinRequest[]>([]);
  const [friendReqs, setFriendReqs] = useState<Member[]>([]);
  const [unreadChats, setUnreadChats] = useState<TeamChat[]>([]);
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<Record<string, { workspace_name: string; inviter_email: string; role: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const prevTotalCountRef = useRef<number | null>(null);
  const previewsRef = useRef(previews);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Load sound setting from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("askdocs_notif_sound");
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("askdocs_notif_sound", String(next));
      if (next) playMessageChime();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!workspace || !user) return;
    api.listMembers(workspace.id).then((members) => {
      const me = members.find((m) => m.user_id === user.id);
      setIsAdmin(me?.role === "admin");
    }).catch(() => {});
  }, [workspace, user]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [list, reqs, fReqs, chatsList] = await Promise.all([
        api.myInvitations().catch(() => []),
        isAdmin && workspace ? api.listJoinRequests(workspace.id).catch(() => []) : Promise.resolve([]),
        api.listFriendRequests().catch(() => []),
        api.listTeamChats().catch(() => []),
      ]);

      setInvites(list);
      setJoinReqs(reqs.filter((r: JoinRequest) => r.status === "pending"));
      setFriendReqs(fReqs || []);

      // Filter unread chats
      const activeUnread = (chatsList || []).filter((c: TeamChat) => c.unread_count > 0);
      setUnreadChats(activeUnread);

      // Sound chime trigger on new notification increase
      const currentTotal = list.length + (fReqs || []).length + reqs.length + activeUnread.reduce((acc: number, c: TeamChat) => acc + c.unread_count, 0);
      if (prevTotalCountRef.current !== null && currentTotal > prevTotalCountRef.current) {
        // If user is currently on /chats, the chat page handles its own chime; otherwise play global chime
        if (soundEnabled && pathname !== "/chats") {
          playMessageChime();
        }
      }
      prevTotalCountRef.current = currentTotal;

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
  }, [isAdmin, soundEnabled, user, workspace, pathname]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 6000);
    return () => clearInterval(interval);
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

  // Compile unified list
  const notifications: UnifiedNotification[] = [];

  // 1. Unread Office Chats
  unreadChats.forEach((chat) => {
    const other = chat.participants.find((p) => p.user_id !== user?.id && p.email !== user?.email);
    const title = chat.type === "group" ? (chat.title || "Group Chat") : (other?.name || other?.email || "Teammate");
    notifications.push({
      id: `chat-${chat.id}`,
      type: "chat",
      title,
      subtitle: chat.last_message_preview || "New message in chat",
      timestamp: chat.last_message_at || chat.created_at,
      unreadCount: chat.unread_count,
      chatId: chat.id,
      avatarUser: other as Member,
    });
  });

  // 2. Friend Requests
  friendReqs.forEach((f) => {
    notifications.push({
      id: `friend-${f.user_id}`,
      type: "friend",
      title: f.name || f.email || "Friend Request",
      subtitle: "Sent you a friend request",
      timestamp: new Date().toISOString(),
      friendUser: f,
    });
  });

  // 3. Workspace Invitations
  invites.forEach((inv) => {
    const p = previews[inv.id];
    notifications.push({
      id: `invite-${inv.id}`,
      type: "invite",
      title: p?.workspace_name || "Workspace Invitation",
      subtitle: p ? `${p.inviter_email} invited you as ${p.role}` : "You have an invite",
      timestamp: inv.created_at,
      inviteId: inv.id,
    });
  });

  // 4. Join Requests
  joinReqs.forEach((req) => {
    notifications.push({
      id: `join-${req.id}`,
      type: "join",
      title: `${req.user_name || req.user_email} wants to join`,
      subtitle: req.message || `Request to join workspace`,
      timestamp: req.created_at,
      joinReq: req,
    });
  });

  // Sort newest first
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalNotifs = notifications.length;
  // SMART 3-NOTIFICATION LIMIT for dropdown
  const displayedNotifications = notifications.slice(0, 3);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${totalNotifs ? `, ${totalNotifs} new notifications` : ""}`}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white transition-all cursor-pointer"
      >
        <Bell className="h-5 w-5" />
        {totalNotifs > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-extrabold text-white shadow-md ring-2 ring-white dark:ring-[#0B0B0F] animate-pulse">
            {totalNotifs > 9 ? "9+" : totalNotifs}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />

          {/* Dropdown Card */}
          <div
            role="dialog"
            aria-label="Notifications"
            className="
              fixed inset-x-3 top-[4.25rem] z-50
              rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-white/10 dark:bg-[#13131a]/95
              sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96 sm:shadow-2xl
              overflow-hidden animate-in fade-in zoom-in-95 duration-150
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">Notifications</span>
                {totalNotifs > 0 && (
                  <span className="rounded-full bg-purple-100 dark:bg-purple-950/70 px-2 py-0.5 text-[10px] font-extrabold text-purple-600 dark:text-purple-300">
                    {totalNotifs} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleSound}
                  title={soundEnabled ? "Mute notification sounds" : "Enable notification chime"}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4 text-purple-600 dark:text-purple-400" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 sm:hidden cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Smart Content */}
            {totalNotifs === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">All caught up!</p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">No new chat messages or pending requests right now.</p>
              </div>
            ) : (
              <div className="p-2">
                <div className="space-y-2">
                  {displayedNotifications.map((notif) => {
                    if (notif.type === "chat") {
                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setOpen(false);
                            router.push("/chats");
                          }}
                          className="group relative flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 p-3 hover:border-purple-300 hover:bg-purple-50/40 dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-purple-500/30 dark:hover:bg-purple-950/20 transition-all cursor-pointer shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative shrink-0">
                              {notif.avatarUser ? (
                                <Avatar
                                  name={notif.avatarUser.name || notif.avatarUser.email || "User"}
                                  size={40}
                                  showPresence
                                  online={notif.avatarUser.online}
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                  <MessagesSquare className="h-5 w-5" />
                                </div>
                              )}
                              {notif.unreadCount && notif.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[9px] font-bold text-white shadow-xs">
                                  {notif.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {notif.title}
                                </p>
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">
                                  Office Chat
                                </span>
                              </div>
                              <p className="truncate text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                {notif.subtitle}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (notif.type === "friend") {
                      const f = notif.friendUser!;
                      return (
                        <div
                          key={notif.id}
                          className="rounded-2xl border border-slate-100 bg-white/80 p-3 hover:bg-slate-50 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.05] transition-all shadow-xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
                              <UserPlus className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-2 truncate">
                                Sent you a friend request
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => void respondFriend(f, true)}
                                  disabled={busyId === f.user_id}
                                  className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => void respondFriend(f, false)}
                                  disabled={busyId === f.user_id}
                                  className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (notif.type === "invite") {
                      const inv = invites.find((i) => i.id === notif.inviteId);
                      return (
                        <div
                          key={notif.id}
                          className="rounded-2xl border border-slate-100 bg-white/80 p-3 hover:bg-slate-50 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.05] transition-all shadow-xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                              <Building className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-2 truncate">
                                {notif.subtitle}
                              </p>
                              {inv && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => void respondInvite(inv, true)}
                                    disabled={busyId === inv.id}
                                    className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => void respondInvite(inv, false)}
                                    disabled={busyId === inv.id}
                                    className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (notif.type === "join") {
                      return (
                        <div
                          key={notif.id}
                          className="rounded-2xl border border-slate-100 bg-white/80 p-3 hover:bg-slate-50 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.05] transition-all shadow-xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                              <UserPlus className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-2 truncate">
                                {notif.subtitle}
                              </p>
                              <button
                                onClick={() => {
                                  setOpen(false);
                                  router.push("/members");
                                }}
                                className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                Review in Members
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                {/* VIEW ALL NOTIFICATIONS FOOTER CTA */}
                <div className="mt-2 border-t border-slate-100 dark:border-white/5 pt-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/notifications");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-purple-600 hover:bg-purple-50/60 dark:text-purple-400 dark:hover:bg-purple-950/30 transition-all cursor-pointer"
                  >
                    <span>View all notifications {totalNotifs > 3 ? `(${totalNotifs})` : ""}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

