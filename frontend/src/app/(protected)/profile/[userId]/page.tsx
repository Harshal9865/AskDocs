"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex h-[var(--chat-h)] items-center justify-center">
        <p className="text-sm text-slate-500">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[var(--chat-h)] flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-medium">Profile not found</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-indigo-600 hover:underline">
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
          <div className="-mt-12 flex items-end gap-4">
            <button onClick={() => setLightbox(true)} aria-label="View photo" className="shrink-0">
              <Avatar
                name={profile.name}
                size={96}
                src={src}
                stickerId={stickerId}
              />
            </button>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-xl font-bold">
                {profile.name}{" "}
                {profile.pronouns && (
                  <span className="text-sm font-normal text-slate-500 dark:text-zinc-400">({profile.pronouns})</span>
                )}
              </h1>
              <p className="truncate text-sm text-slate-500 dark:text-zinc-400">{profile.email}</p>
              {profile.status && <p className="mt-1 text-sm italic text-slate-600 dark:text-zinc-300">“{profile.status}”</p>}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {profile.bio && (
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Bio</div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{profile.bio}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.phone && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{profile.phone}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate text-sm">{profile.email}</span>
              </div>
              {profile.pronouns && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
                  <span className="text-xs font-semibold text-slate-400">Pronouns</span>
                  <span className="text-sm">{profile.pronouns}</span>
                </div>
              )}
            </div>
            {!isMe && (
              <button
                onClick={() => router.push("/chats")}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1DB954] px-4 py-2.5 text-sm font-medium text-black hover:bg-[#1ed760]"
              >
                <MessageCircle className="h-4 w-4" /> Message
              </button>
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
