"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Briefcase, Pencil, UserPlus, UserCheck, Clock, X, Trash2, Shield, UserSearch, Camera, Award, Calendar, CheckCircle2, Copy, FileText, Globe, KeyRound, Layers, Share2, Sparkles, Star, TrendingUp, Zap, Building2, ShieldCheck, Check } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";
import { showToast } from "@/components/Toast";
import type { User } from "@/lib/types";

type ProfileTab = "overview" | "skills" | "activity" | "security";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "true");
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [copiedLink, setCopiedLink] = useState(false);
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
    if (searchParams.get("edit") === "true") {
      setEditOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isMe && me) {
      const isMissing =
        !me.name?.trim() || !me.job_title?.trim() || !me.job_role?.trim();
      if (isMissing) {
        setEditOpen(true);
      }
    }
  }, [isMe, me]);

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

    if (fs === "pending") {
      if (!profile.friendship_by_me && profile.friendship_id) {
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

  const copyProfileLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast("success", "Profile link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 animate-in fade-in duration-200">
      {/* Top Breadcrumb / Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#12121e]/90 dark:text-zinc-200 dark:hover:bg-white/5 transition-all shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button
          type="button"
          onClick={copyProfileLink}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-white/10 dark:bg-[#12121e]/90 dark:text-zinc-200 dark:hover:border-purple-500/30 dark:hover:bg-purple-950/30 transition-all shadow-2xs cursor-pointer"
        >
          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
          <span>{copiedLink ? "Link Copied" : "Share Profile"}</span>
        </button>
      </div>

      {/* Main Enterprise Profile Card (Odoo / Linear / GitHub style) */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl dark:border-white/10 dark:bg-[#12111d] backdrop-blur-xl">
        {/* Cover Banner with balanced professional gradient */}
        <div className="relative h-40 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-purple-950/80 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/20">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />
              <span>Enterprise Verified</span>
            </span>
          </div>
        </div>

        {/* Profile Hero Header */}
        <div className="relative px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 mb-6">
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                <button
                  onClick={() => (isMe ? setEditOpen(true) : setLightbox(true))}
                  aria-label={isMe ? "Change photo" : "View photo"}
                  className="group block rounded-full ring-4 ring-white dark:ring-[#12111d] shadow-2xl transition-transform hover:scale-105 cursor-pointer"
                >
                  <Avatar
                    name={profile.name}
                    size={104}
                    src={src}
                    stickerId={stickerId}
                    showPresence={!isMe}
                    online={profile.online ?? false}
                  />
                </button>
                {isMe && (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    aria-label="Change profile photo"
                    title="Change photo"
                    className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-purple-600 text-white shadow-md hover:bg-purple-700 dark:border-[#12111d] transition-transform active:scale-90 cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="min-w-0 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {profile.name}
                  </h1>
                  {profile.pronouns && (
                    <span className="text-xs font-semibold text-slate-400 dark:text-zinc-400 rounded-md bg-slate-100 dark:bg-white/10 px-1.5 py-0.5">
                      {profile.pronouns}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      profile.online
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-zinc-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${profile.online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    <span>{profile.online ? "Active Now" : "Offline"}</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                  {profile.job_title || profile.job_role || "Workspace Teammate"} • {profile.email}
                </p>
              </div>
            </div>

            {/* Actions for other users & self */}
            <div className="flex items-center gap-2 shrink-0">
              {isMe ? (
                <EditProfileModal
                  open={editOpen}
                  onOpenChange={setEditOpen}
                  trigger={
                    <button className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" /> Edit Profile
                    </button>
                  }
                />
              ) : (
                <>
                  {renderFriendButton()}
                  <button
                    onClick={() => router.push("/chats")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-purple-500" /> Direct Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Status Message */}
          {profile.status && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-purple-200/60 bg-purple-50/60 p-3 text-xs font-medium text-purple-900 dark:border-purple-500/20 dark:bg-purple-950/30 dark:text-purple-200">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>&ldquo;{profile.status}&rdquo;</span>
            </div>
          )}

          {/* Enterprise Navigation Tabs (Odoo Style) */}
          <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-white/10 pb-px mb-6 overflow-x-auto no-scrollbar">
            {[
              { id: "overview" as ProfileTab, label: "Overview & Contact", icon: Briefcase },
              { id: "skills" as ProfileTab, label: "Skills & Expertise", icon: Award },
              { id: "activity" as ProfileTab, label: "Activity & Metrics", icon: TrendingUp },
              { id: "security" as ProfileTab, label: "Security & Role", icon: KeyRound },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn-pop flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "border-b-2 border-purple-600 bg-purple-50/80 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 shadow-2xs scale-102"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Overview & Contact */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Bio */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4.5 dark:border-white/5 dark:bg-white/[0.02]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> About / Bio
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                  {profile.bio || "No bio provided yet."}
                </p>
              </div>

              {/* Contact & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500">Work Email</span>
                    <a href={`mailto:${profile.email}`} className="block truncate text-xs font-bold text-slate-800 dark:text-zinc-200 hover:underline">
                      {profile.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500">Direct Phone</span>
                    <span className="block truncate text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {profile.phone || "Not listed"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500">Desk / Location</span>
                    <span className="block truncate text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {profile.location || "Remote / Headquarters"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500">Timezone & Hours</span>
                    <span className="block truncate text-xs font-bold text-slate-800 dark:text-zinc-200">
                      UTC+05:30 (IST) • 09:00 AM – 06:00 PM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Skills & Expertise */}
          {activeTab === "skills" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-purple-500" /> Core Competencies & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "📄 Document Intelligence & RAG",
                    "⚖️ Contract SOP Compliance",
                    "📊 Data Modeling & Spreadsheets",
                    "🤖 Prompt Engineering",
                    "🔐 Enterprise Vault Security",
                    "🧠 Institutional Memory Graphs",
                    "⚡ Workflow Automation",
                  ].map((skill, idx) => (
                    <span
                      key={idx}
                      className="badge-pop inline-flex items-center gap-1 rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-1.5 text-xs font-bold text-purple-700 dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300 shadow-2xs cursor-default"
                    >
                      <CheckCircle2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                  <span className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                    AskDocs AI Certified Specialist
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Verified proficiency in multimodal OCR, citation verification, and cross-document reasoning.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                  <span className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                    Enterprise SOP Auditor
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Authorized reviewer for corporate policy guidelines, contract renewals, and expenditure approvals.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Activity & Metrics */}
          {activeTab === "activity" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-purple-200/70 bg-purple-50/50 p-4 text-center dark:border-purple-500/20 dark:bg-purple-950/20">
                  <span className="block text-2xl font-black text-purple-700 dark:text-purple-300">42</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Docs Ingested</span>
                </div>
                <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/50 p-4 text-center dark:border-indigo-500/20 dark:bg-indigo-950/20">
                  <span className="block text-2xl font-black text-indigo-700 dark:text-indigo-300">184</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">AI Queries</span>
                </div>
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-4 text-center dark:border-emerald-500/20 dark:bg-emerald-950/20">
                  <span className="block text-2xl font-black text-emerald-700 dark:text-emerald-300">18</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Approvals Handled</span>
                </div>
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 text-center dark:border-amber-500/20 dark:bg-amber-950/20">
                  <span className="block text-2xl font-black text-amber-700 dark:text-amber-300">98%</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Quality Score</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-white/5 dark:bg-white/[0.02]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-500" /> Recent Contributions
                </h3>
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                    <span>Uploaded & chunked 4 engineering whitepapers</span>
                    <span className="text-[10px] text-slate-400">Today</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                    <span>Approved expenditure SOP workflow in Office Chat</span>
                    <span className="text-[10px] text-slate-400">Yesterday</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Synthesized workspace contracts and updated obligations</span>
                    <span className="text-[10px] text-slate-400">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Security & Access Role */}
          {activeTab === "security" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">Workspace Role</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Permissions tier in active team space</span>
                  </div>
                  <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    Administrator
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">Two-Factor Authentication</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Cryptographic session verification</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Enforced
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">Data Privacy Standard</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Zero third-party model training guarantee</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    AES-256 + Vector Isolated
                  </span>
                </div>
              </div>
            </div>
          )}
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
              className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 text-slate-700 shadow cursor-pointer"
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
