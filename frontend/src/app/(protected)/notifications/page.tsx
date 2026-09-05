"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building,
  CheckCircle2,
  Clock,
  MessagesSquare,
  Sparkles,
  UserPlus,
  Volume2,
  VolumeX,
  XCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import type { Invitation, JoinRequest, Member, TeamChat } from "@/lib/types";
import { playMessageChime } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import { showToast } from "@/components/Toast";

export default function NotificationsPage() {
  const { workspace, refresh } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();

  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteHistory, setInviteHistory] = useState<Invitation[]>([]);
  const [joinReqs, setJoinReqs] = useState<JoinRequest[]>([]);
  const [friendReqs, setFriendReqs] = useState<Member[]>([]);
  const [unreadChats, setUnreadChats] = useState<TeamChat[]>([]);
  const [previews, setPreviews] = useState<Record<string, { workspace_name: string; inviter_email: string; role: string }>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "chats" | "friends" | "invites" | "preferences">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Granular notification toggles
  const [prefDMs, setPrefDMs] = useState(true);
  const [prefGroups, setPrefGroups] = useState(true);
  const [prefFriends, setPrefFriends] = useState(true);
  const [prefAI, setPrefAI] = useState(true);
  const [prefApprovals, setPrefApprovals] = useState(true);

  // Load sound & granular settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem("askdocs_notif_sound");
      if (saved !== null) setSoundEnabled(saved === "true");

      const savedDMs = localStorage.getItem("askdocs_pref_dms");
      if (savedDMs !== null) setPrefDMs(savedDMs === "true");

      const savedGroups = localStorage.getItem("askdocs_pref_groups");
      if (savedGroups !== null) setPrefGroups(savedGroups === "true");

      const savedFriends = localStorage.getItem("askdocs_pref_friends");
      if (savedFriends !== null) setPrefFriends(savedFriends === "true");

      const savedAI = localStorage.getItem("askdocs_pref_ai");
      if (savedAI !== null) setPrefAI(savedAI === "true");

      const savedAppr = localStorage.getItem("askdocs_pref_approvals");
      if (savedAppr !== null) setPrefApprovals(savedAppr === "true");
    } catch {
      // ignore
    }
  }, []);

  const updatePref = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    try {
      localStorage.setItem(key, String(val));
      showToast("success", "Preferences saved");
    } catch {}
  };

  // Load sound setting
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
    setLoading(true);
    try {
      const [pendingInvites, history, reqs, fReqs, chatsList] = await Promise.all([
        api.myInvitations().catch(() => []),
        api.myInvitationHistory().catch(() => []),
        isAdmin && workspace ? api.listJoinRequests(workspace.id).catch(() => []) : Promise.resolve([]),
        api.listFriendRequests().catch(() => []),
        api.listTeamChats().catch(() => []),
      ]);

      setInvites(pendingInvites);
      setInviteHistory(history as Invitation[]);
      setJoinReqs(reqs.filter((r: JoinRequest) => r.status === "pending"));
      setFriendReqs(fReqs || []);
      setUnreadChats((chatsList || []).filter((c: TeamChat) => c.unread_count > 0));

      for (const inv of pendingInvites) {
        try {
          const p = await api.invitationPreview(inv.id);
          setPreviews((prev) => ({ ...prev, [inv.id]: p }));
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user, workspace]);

  useEffect(() => {
    void load();
  }, [load]);

  async function respondInvite(id: string, accept: boolean) {
    setBusyId(id);
    try {
      if (accept) {
        await api.acceptInvitation(id);
        await refresh();
      } else {
        await api.declineInvitation(id);
      }
      await load();
    } catch (err) {
      alert((err as Error).message);
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
      await load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const totalUnreadCount =
    unreadChats.length + friendReqs.length + invites.length + joinReqs.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 p-6 sm:p-8 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/25">
                <Bell className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Notification Center
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Manage your office chats, friend requests, and workspace invites in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Sound Chime Toggle & Test */}
            <button
              onClick={toggleSound}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950/70 dark:text-purple-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-zinc-400"
              }`}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span>{soundEnabled ? "Chime On" : "Chime Muted"}</span>
            </button>

            <button
              onClick={() => playMessageChime()}
              title="Test notification chime sound"
              className="rounded-full border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Test Sound 🔔
            </button>

            <button
              onClick={() => void load()}
              title="Refresh notifications"
              className="rounded-full border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5 p-2 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 dark:border-white/10 pb-3">
        <button
          onClick={() => setTab("all")}
          className={`btn-pop rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "all"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 scale-102"
              : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
          }`}
        >
          All Notifications ({totalUnreadCount})
        </button>

        <button
          onClick={() => setTab("chats")}
          className={`btn-pop inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "chats"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 scale-102"
              : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
          }`}
        >
          <MessagesSquare className="h-3.5 w-3.5" />
          <span>Office Chats ({unreadChats.length})</span>
        </button>

        <button
          onClick={() => setTab("friends")}
          className={`btn-pop inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "friends"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 scale-102"
              : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Friend Requests ({friendReqs.length})</span>
        </button>

        <button
          onClick={() => setTab("invites")}
          className={`btn-pop inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "invites"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 scale-102"
              : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Invitations & Joins ({invites.length + joinReqs.length})</span>
        </button>

        <button
          onClick={() => setTab("preferences")}
          className={`btn-pop inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            tab === "preferences"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 scale-102"
              : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Preferences & Sound Rules</span>
        </button>
      </div>

      {/* Main List Area */}
      <div className="space-y-4">
        {/* 1. Office Chats Section */}
        {(tab === "all" || tab === "chats") && unreadChats.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <MessagesSquare className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Unread Office Chats</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {unreadChats.map((chat) => {
                const other = chat.participants.find(
                  (p) => p.user_id !== user?.id && p.email !== user?.email,
                );
                const title =
                  chat.type === "group"
                    ? chat.title || "Group Chat"
                    : other?.name || other?.email || "Teammate";

                return (
                  <div
                    key={chat.id}
                    className="flex flex-col justify-between rounded-3xl border border-purple-200/70 bg-purple-50/30 p-4 dark:border-purple-500/20 dark:bg-purple-950/15 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        {other ? (
                          <Avatar
                            name={other.name || other.email || "User"}
                            size={44}
                            showPresence
                            online={other.online}
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600">
                            <MessagesSquare className="h-5 w-5" />
                          </div>
                        )}
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[9px] font-bold text-white shadow-xs">
                          {chat.unread_count}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {title}
                          </p>
                          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                            {chat.type === "group" ? "Team Channel" : "Direct Message"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-600 dark:text-zinc-300">
                          {chat.last_message_preview || "New message received"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => router.push("/chats")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Open Chat</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Friend Requests Section */}
        {(tab === "all" || tab === "friends") && friendReqs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
              <span>Friend Requests</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {friendReqs.map((f) => (
                <div
                  key={f.user_id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02] shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={f.name || f.email || "User"}
                      size={44}
                      showPresence
                      online={f.online}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {f.name || f.email}
                      </p>
                      <p className="truncate text-xs text-slate-400 dark:text-zinc-500">
                        {f.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      onClick={() => void respondFriend(f, true)}
                      disabled={busyId === f.user_id}
                      className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => void respondFriend(f, false)}
                      disabled={busyId === f.user_id}
                      className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Pending Workspace Invitations Section */}
        {(tab === "all" || tab === "invites") && invites.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Workspace Invitations</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {invites.map((inv) => {
                const p = previews[inv.id];
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02] shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <Building className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {p?.workspace_name || "Workspace Invitation"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                          {p ? `${p.inviter_email} invited you as ${p.role}` : "Invitation pending"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 justify-end">
                      <button
                        onClick={() => void respondInvite(inv.id, true)}
                        disabled={busyId === inv.id}
                        className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => void respondInvite(inv.id, false)}
                        disabled={busyId === inv.id}
                        className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Workspace Join Requests */}
        {(tab === "all" || tab === "invites") && joinReqs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Workspace Join Requests</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {joinReqs.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02] shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {req.user_name || req.user_email} wants to join
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                        {req.user_email}
                      </p>
                      {req.message ? (
                        <div className="mt-2.5 rounded-2xl bg-purple-50/80 p-3 text-xs text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 border border-purple-200/60 dark:border-purple-800/40">
                          <span className="font-bold text-purple-700 dark:text-purple-300 block mb-0.5">💬 Message from Sender:</span>
                          <span className="italic font-medium break-words">&ldquo;{req.message}&rdquo;</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500 italic">No custom note included</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => router.push("/members")}
                      className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Review in Members →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences & Granular Alert Rules Panel */}
        {tab === "preferences" && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#12111d] shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Granular Notification Channels & Alert Rules</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Customize where and when you receive sound chimes and alert badges across your workspace.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {/* 1. Direct Messages */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold shrink-0">
                    <MessagesSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Direct Messages (DMs)</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Play chime and notify when a colleague sends you a direct message</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefDMs}
                    onChange={(e) => updatePref("askdocs_pref_dms", e.target.checked, setPrefDMs)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* 2. Group Chats & Team Spaces */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold shrink-0">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Group Chats & Office Spaces</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Alerts for team channels and study group messages</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefGroups}
                    onChange={(e) => updatePref("askdocs_pref_groups", e.target.checked, setPrefGroups)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* 3. Friend Requests */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 font-bold shrink-0">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Friend & Network Requests</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Real-time alerts when someone adds you or accepts your request</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefFriends}
                    onChange={(e) => updatePref("askdocs_pref_friends", e.target.checked, setPrefFriends)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* 4. AI Copilot & Document Readiness */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 font-bold shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">AI Assistant & Document Indexing</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Notify when background vector chunking and PDF OCR completes</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefAI}
                    onChange={(e) => updatePref("askdocs_pref_ai", e.target.checked, setPrefAI)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* 5. Policy & Expenditure Approvals */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 font-bold shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Corporate Approvals & SOP Alerts</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Notify on critical expenditure requests and NDA approvals</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefApprovals}
                    onChange={(e) => updatePref("askdocs_pref_approvals", e.target.checked, setPrefApprovals)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {tab !== "preferences" && totalUnreadCount === 0 && !loading && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-white/[0.01]">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500/15 via-indigo-500/15 to-pink-500/15 text-purple-600 dark:text-purple-400 shadow-inner">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-200">
              You are all caught up!
            </h3>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500 max-w-sm">
              No pending notifications in this view. When teammates send messages or requests, they will show up here.
            </p>
          </div>
        )}
      </div>

      {/* Past Invitation History */}
      {inviteHistory.length > 0 && (
        <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>Invitation History</span>
          </h2>
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {inviteHistory.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between py-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {inv.email}
                  </span>
                  <span className="ml-2 text-slate-400 dark:text-zinc-500">
                    Role: {inv.role} · {new Date(inv.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  {inv.status === "accepted" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> Accepted
                    </span>
                  ) : inv.status === "declined" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                      <XCircle className="h-3 w-3" /> Declined
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
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

