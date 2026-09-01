"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, RotateCcw, Pencil, Trash2 } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";
import Avatar from "@/components/Avatar";

const AVATARS = [
  { id: "male-1", name: "Ginger Curls", tag: "Yellow BG", color: "from-amber-400 to-yellow-500" },
  { id: "male-2", name: "Classic Cool", tag: "Yellow BG", color: "from-yellow-500 to-amber-600" },
  { id: "female-1", name: "Lavender Bob", tag: "Day Theme", color: "from-indigo-400 to-purple-500" },
  { id: "female-2", name: "Modern Teal", tag: "Day Theme", color: "from-sky-400 to-teal-500" },
  { id: "ai-1", name: "Violet Night", tag: "Dark Theme", color: "from-violet-600 to-indigo-900" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90 sm:p-6">
      <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, avatarSrc, refreshUser } = useAuth();

  // profile name
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  // password
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // avatar
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameBusy(true);
    setNameMsg(null);
    try {
      await api.updateMe(name.trim());
      await refreshUser();
      setNameMsg("Name updated.");
    } catch (err) {
      setNameMsg((err as Error).message);
    } finally {
      setNameBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwMsg(null);
    if (next !== confirmPw) {
      setPwError("New passwords do not match");
      return;
    }
    setPwBusy(true);
    try {
      await api.changePassword(current, next);
      setPwMsg("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirmPw("");
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setPwBusy(false);
    }
  }

  async function pickSticker(id: string) {
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      await api.setAvatar("sticker", id);
      await refreshUser();
      setAvatarMsg("3D Avatar saved.");
    } catch (err) {
      setAvatarMsg((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function resetToInitials() {
    setAvatarBusy(true);
    try {
      await api.setAvatar("initials");
      await refreshUser();
      setAvatarMsg("Reset to initials.");
    } catch (err) {
      setAvatarMsg((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onPhotoChosen(file?: File | null) {
    if (!file) return;
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      await api.uploadAvatarPhoto(file);
      await refreshUser();
      setAvatarMsg("Photo uploaded.");
    } catch (err) {
      setAvatarMsg((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }



  const previewSticker =
    user?.avatar_kind === "sticker" ? user.avatar_value ?? null : null;

  return (
    <div className="relative mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200">
          Account Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
          Personalize your profile, 3D character avatars, and security preferences.
        </p>
      </div>

      {/* ---------- Profile photo & 3D Avatars ---------- */}
      <Section title="Profile Picture & 3D Character Avatars">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative shrink-0">
            <Avatar
              name={user?.name ?? "?"}
              size={76}
              src={avatarSrc}
              stickerId={previewSticker}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              aria-label="Upload photo"
              title="Upload custom photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-600 text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 dark:border-[#13111f]"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              hidden
              onChange={(e) => void onPhotoChosen(e.target.files?.[0])}
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-400">{user?.email}</p>
            {avatarMsg && (
              <p className="mt-1 text-xs font-bold text-purple-600 dark:text-purple-400">{avatarMsg}</p>
            )}
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <ImagePlus className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Upload photo
              </button>
              <button
                onClick={() => void resetToInitials()}
                disabled={avatarBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset to initials
              </button>
            </div>
          </div>
        </div>

        {/* Modern 3D Avatars */}
        <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
              Select 3D Character Avatar
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AVATARS.map((av) => {
              const selected = previewSticker === av.id;
              return (
                <button
                  key={av.id}
                  onClick={() => void pickSticker(av.id)}
                  disabled={avatarBusy}
                  className={`group relative flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all duration-200 hover:scale-102 ${
                    selected
                      ? "border-purple-500 bg-purple-50/80 shadow-md shadow-purple-500/15 ring-2 ring-purple-500 dark:border-purple-400 dark:bg-purple-950/40"
                      : "border-slate-200/80 bg-white/60 hover:border-purple-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-purple-500/30"
                  } ${avatarBusy ? "opacity-60" : ""}`}
                >
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/stickers/${av.id}.svg`} alt={av.name} className="h-12 w-12 rounded-full object-cover shadow-xs" />
                    {selected && (
                      <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-purple-600 text-white shadow-xs">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-white">{av.name}</p>
                    <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-white/10 dark:text-zinc-300">
                      {av.tag}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ---------- Display name ---------- */}
      <Section title="Display Name">
        <form onSubmit={saveName} className="space-y-3.5">
          <input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-xs sm:text-sm font-medium outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628] dark:text-white"
          />
          {nameMsg && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{nameMsg}</p>}
          <button
            type="submit"
            disabled={nameBusy || !name.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {nameBusy ? "Saving…" : "Save Name"}
          </button>
        </form>
      </Section>

      {/* ---------- Profile details ---------- */}
      <Section title="Profile Information">
        <p className="mb-4 text-xs text-slate-500 dark:text-zinc-400">
          Job title, department, bio, status, pronouns, and contact details visible across your workspaces.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <EditProfileModal
            trigger={
              <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:scale-105 active:scale-95">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile Details
              </button>
            }
          />
          <a
            href={user ? `/profile/${user.id}` : "#"}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition-all hover:scale-105"
          >
            View Public Profile →
          </a>
        </div>
      </Section>

      {/* ---------- Change password ---------- */}
      <Section title="Security & Password">
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300" htmlFor="cur">
              Current Password
            </label>
            <PasswordInput id="cur" value={current} onChange={setCurrent} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300" htmlFor="new1">
              New Password
            </label>
            <PasswordInput
              id="new1"
              value={next}
              onChange={setNext}
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">Minimum 8 characters.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300" htmlFor="new2">
              Confirm New Password
            </label>
            <PasswordInput
              id="new2"
              value={confirmPw}
              onChange={setConfirmPw}
              autoComplete="new-password"
              ariaLabel="Password confirmation"
            />
          </div>
          {pwError && (
            <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-xs font-bold text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">
              {pwError}
            </p>
          )}
          {pwMsg && (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300">
              {pwMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={pwBusy || !current || next.length < 8}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {pwBusy ? "Updating…" : "Change Password"}
          </button>
        </form>
      </Section>



      {/* ---------- Danger zone ---------- */}
      <DeleteAccountSection />
    </div>
  );
}

function DeleteAccountSection() {
  const { logout } = useAuth();
  const [confirmStep, setConfirmStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.deleteMe();
      logout();
      window.location.href = "/login";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-red-200/80 bg-red-50/50 p-5 sm:p-6 backdrop-blur-md dark:border-red-900/30 dark:bg-red-950/20">
      <h2 className="text-sm font-bold text-red-700 dark:text-red-400">Danger Zone — Delete Account</h2>
      <p className="mt-1 text-xs text-red-600/90 dark:text-red-300/80">
        Permanently delete your account and all associated workspace memberships and conversations. This action cannot be undone.
      </p>
      {confirmStep > 0 && (
        <p className="mt-2 text-xs font-bold text-red-700 dark:text-red-400">
          {confirmStep === 1
            ? "Are you sure? This will permanently delete your entire user profile and credentials."
            : "Click once more to confirm permanent account deletion."}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs font-bold text-red-700">{error}</p>
      )}
      <button
        onClick={() => void handleDelete()}
        disabled={busy}
        className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-700 hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {busy
          ? "Deleting…"
          : confirmStep === 0
            ? "Delete Account"
            : confirmStep === 1
              ? "Yes, I'm sure"
              : "Confirm Permanent Deletion"}
      </button>
    </section>
  );
}
