"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Briefcase, Pencil, UserPlus, UserCheck, Clock, X, Trash2, Shield, UserSearch } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";
import { showToast } from "@/components/Toast";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: me } = useAuth();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMe = me?.id === userId;
  const { src, stickerId } = useUserAvatar(
    profile?.id,
    profile?.avatar_kind,
    profile?.avatar_value,
  );
  const [lightbox, setLightbox] = useState(false);
  const [friendBusy, setFriendBusy] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = isMe ? me : await api.getUserProfile(userId);
        if (!cancelled) setProfile(u as User);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isMe, me]);

  async function handleSendRequest() {
    setFriendBusy(true);
    try {
      await api.sendFriendRequest(userId);
      setProfile((p) => p ? { ...p, friendship_status: "pending", friendship_id: null, friendship_by_me: true } : p);
      showToast("success", "Request sent");
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setFriendBusy(false);
    }
  }

  async function handleAccept() {
    if (!profile?.friendship_id) return;
    setFriendBusy(true);
    try {
      await api.acceptFriend(profile.friendship_id);
      setProfile((p) => p ? { ...p, friendship_status: "accepted" } : p);
      showToast("success", "You are now friends");
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setFriendBusy(false);
    }
  }

  async function handleDecline() {
    if (!profile?.friendship_id) return;
    setFriendBusy(true);
    try {
      await api.declineFriend(profile.friendship_id);
      setProfile((p) => p ? { ...p, friendship_status: "none", friendship_id: null } : p);
      showToast("success", "Declined");
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setFriendBusy(false);
    }
  }

  async function handleRemoveFriend() {
    if (!profile?.friendship_id) return;
    setFriendBusy(true);
    try {
      await api.unfriend(profile.friendship_id);
      setProfile((p) => p ? { ...p, friendship_status: "none", friendship_id: null } : p);
      setShowRemoveConfirm(false);
      showToast("success", "Removed");
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setFriendBusy(false);
    }
  }

  async function handleUnblock() {
    if (!profile?.friendship_id) return;
    setFriendBusy(true);
    try {
      await api.unblockFriend(profile.friendship_id);
      setProfile((p) => p ? { ...p, friendship_status: "none", friendship_id: null } : p);
      showToast("success", "Unblocked");
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setFriendBusy(false);
    }
  }

  function renderFriendButton() {
    if (isMe || !profile) return null;
    const fs = profile.friendship_status;
    if (fs === "blocked") {
      return (
        <button
          onClick={() => void handleUnblock()}
          disabled={friendBusy}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
        >
          <Shield className="h-3.5 w-3.5" /> {friendBusy ? "Unblocking…" : "Unblock"}
        </button>
      );
    }

    if (fs === "accepted") {
      if (showRemoveConfirm) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 dark:text-red-400">Remove friend?</span>
            <button
              onClick={() => void handleRemoveFriend()}
              disabled={friendBusy}
              className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> {friendBusy ? "Removing…" : "Yes, remove"}
            </button>
            <button
              onClick={() => setShowRemoveConfirm(false)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        );
      }
      return (
        <button
          onClick={() => setShowRemoveConfirm(true)}
          className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-emerald-400 dark:hover:text-red-400"
        >
          <UserCheck className="h-3.5 w-3.5" /> Friends
        </button>
      );
    }

    if (fs === "pending" && profile.friendship_id) {
      if (!profile.friendship_by_me) {
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleAccept()}
              disabled={friendBusy}
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <UserCheck className="h-3.5 w-3.5" /> {friendBusy ? "Accepting…" : "Accept"}
            </button>
            <button
              onClick={() => void handleDecline()}
              disabled={friendBusy}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Decline
            </button>
          </div>
        );
      }
      return (
        <button
          disabled
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
        >
          <Clock className="h-3.5 w-3.5" /> Request Sent
        </button>
      );
    }

    return (
      <button
        onClick={() => void handleSendRequest()}
        disabled={friendBusy}
        className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        <UserPlus className="h-3.5 w-3.5" /> {friendBusy ? "Sending…" : "Add Friend"}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 h-8 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#121212]">
          <div className="h-32 animate-pulse bg-slate-200 dark:bg-white/5" />
          <div className="px-6 pb-6">
            <div className="-mt-12 h-24 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-white/10 dark:bg-[#121212]">
        <UserSearch className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-zinc-600" />
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">Profile not found</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">They may have no shared workspace or friendship.</p>
        <button onClick={() => router.back()} className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 dark:border-white/10 dark:text-white">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-white/10 dark:bg-[#121212] dark:hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#121212]">
        {/* Cover with aurora */}
        <div className="gemini-gradient-bg relative h-32 bg-slate-900 dark:bg-[#0a0a0a]">
          <div className="gemini-orb gemini-orb-1" />
          <div className="gemini-orb gemini-orb-2" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex items-end gap-4">
            <button onClick={() => setLightbox(true)} aria-label="View photo" className="-mt-12 shrink-0 rounded-full ring-4 ring-white dark:ring-[#121212]">
              <Avatar
                name={profile.name}
                size={96}
                src={src}
                stickerId={stickerId}
                showPresence={!isMe}
                online={profile.online ?? false}
              />
            </button>
            <div className="min-w-0 flex-1 pt-2 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">
                  {profile.name}{" "}
                  {profile.pronouns && (
                    <span className="text-sm font-normal text-slate-500 dark:text-zinc-400">({profile.pronouns})</span>
                  )}
                </h1>
                {!isMe && (
                  <span
                    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white shadow-sm dark:border-[#121212] ${profile.online ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"}`}
                    title={profile.online ? "Online" : "Offline"}
                  />
                )}
                {isMe && (
                  <EditProfileModal
                    trigger={
                      <button
                        className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-zinc-300 dark:hover:bg-white/10"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    }
                  />
                )}
              </div>
              <p className="truncate text-sm font-medium text-slate-600 dark:text-zinc-300">{profile.email}</p>
              {profile.status && <p className="mt-1 text-sm italic text-slate-700 dark:text-zinc-300">&ldquo;{profile.status}&rdquo;</p>}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {profile.bio && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Bio</div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-zinc-200">{profile.bio}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.job_title && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <Briefcase className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{profile.job_title}</span>
                </div>
              )}
              {profile.job_role && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Role</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{profile.job_role}</span>
                </div>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/5">
                  <Phone className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{profile.phone}</span>
                </a>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <MapPin className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{profile.location}</span>
                </div>
              )}
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/5">
                <Mail className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                <span className="truncate text-sm font-medium text-indigo-600 hover:underline dark:text-[#1DB954]">{profile.email}</span>
              </a>
              {profile.pronouns && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Pronouns</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{profile.pronouns}</span>
                </div>
              )}
            </div>
            {!isMe && (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                {renderFriendButton()}
                <button
                  onClick={() => router.push("/chats")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1DB954] px-4 py-2.5 text-sm font-medium text-black hover:bg-[#1ed760]"
                >
                  <MessageCircle className="h-4 w-4" /> Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-h-[85vh] max-w-[85vw]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(false)}
              className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 text-slate-700 shadow"
            >
              ✕
            </button>
            <div className="overflow-hidden rounded-2xl bg-black">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={profile.name} className="max-h-[80vh] max-w-[80vw] object-contain" />
              ) : stickerId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/stickers/${stickerId}.svg`} alt={profile.name} className="h-64 w-64 object-contain p-4" />
              ) : (
                <Avatar name={profile.name} size={320} />
              )}
            </div>
            <p className="mt-3 text-center text-sm font-medium text-white">{profile.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
