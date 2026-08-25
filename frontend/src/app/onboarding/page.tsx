"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setStatus(user.status || "");
      setLocation(user.location || "");
      setPronouns(user.pronouns || "");
    }
  }, [user]);

  async function handleSave(skip = false) {
    if (skip) {
      localStorage.setItem("askdocs_onboarded", "1");
      router.replace("/dashboard");
      return;
    }
    setBusy(true);
    try {
      if (avatarFile) {
        await api.uploadAvatarPhoto(avatarFile);
      }
      await api.updateMe({ bio: bio || null, phone: phone || null, status: status || null, location: location || null, pronouns: pronouns || null });
      await refreshUser();
      localStorage.setItem("askdocs_onboarded", "1");
      router.replace("/dashboard");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#070b0e] sm:px-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121212] sm:p-8">
        <h1 className="text-xl font-bold tracking-tight">Complete your profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Add a few details so your teammates recognize you. You can skip and finish later in Settings.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <Avatar
            name={user.name}
            size={72}
            src={avatarPreview || undefined}
            stickerId={user.avatar_kind === "sticker" ? user.avatar_value ?? null : null}
          />
          <label className="cursor-pointer rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black dark:bg-white dark:text-black">
            Choose photo
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Status</label>
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Hey there! I'm on AskDocs"
              maxLength={120}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your team about yourself"
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                maxLength={32}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Pronouns</label>
              <input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="he/him, she/her, they/them"
                maxLength={50}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              maxLength={120}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <button
            onClick={() => handleSave(true)}
            disabled={busy}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
          >
            Skip for now
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={busy}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {busy ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
