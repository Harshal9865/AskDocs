"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Pencil, RotateCcw, Smile } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STICKER_IDS = [
  "male-1", "male-2", "male-3", "male-4",
  "female-1", "female-2", "female-3", "female-4",
  "cute-1", "cute-2", "cute-3", "cute-4",
  "ai-1", "ai-2",
];

const JOB_TITLES = [
  "Intern",
  "Junior Engineer",
  "Mid-level Engineer",
  "Senior Engineer",
  "Staff Engineer",
  "Lead Engineer",
  "Principal Engineer",
  "Engineering Manager",
  "Product Manager",
  "Product Designer",
  "UI/UX Designer",
  "Data Scientist",
  "Prefer not to say",
];
const JOB_ROLES = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Operations",
  "HR",
  "Finance",
  "Support",
  "Research",
  "Prefer not to say",
];
const PRONOUNS = [
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
  "any",
  "Prefer not to say",
];

interface EditProfileModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function EditProfileModal({
  open: controlledOpen,
  onOpenChange: controlledOnChange,
  trigger,
}: EditProfileModalProps) {
  const { user, avatarSrc, refreshUser } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnChange ?? setInternalOpen;

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Profile Photo / Avatar state
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const [showStickers, setShowStickers] = useState(false);

  async function onPhotoChosen(file?: File | null) {
    if (!file) return;
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      await api.uploadAvatarPhoto(file);
      await refreshUser();
      setAvatarMsg("Photo uploaded successfully!");
    } catch (err) {
      setAvatarMsg((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function pickSticker(id: string) {
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      await api.setAvatar("sticker", id);
      await refreshUser();
      setAvatarMsg("Sticker chosen!");
    } catch (err) {
      setAvatarMsg((err as Error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function resetToInitials() {
    setAvatarBusy(true);
    setAvatarMsg(null);
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

  useEffect(() => {
    if (open && user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setStatus(user.status || "");
      setLocation(user.location || "");
      setPronouns(user.pronouns || "");
      setJobTitle(user.job_title || "");
      setJobRole(user.job_role || "");
      setMsg(null);
      setAvatarMsg(null);
      setShowStickers(false);
    }
  }, [open, user]);

  async function handleSave() {
    if (!name.trim()) {
      setMsg("Full name is required.");
      return;
    }
    if (!jobTitle.trim()) {
      setMsg("Job title is required.");
      return;
    }
    if (!jobRole.trim()) {
      setMsg("Department / Role is required.");
      return;
    }
    // Phone validation
    if (phone.trim() && !/^\+?[0-9\s\-()]{7,20}$/.test(phone.trim())) {
      setMsg("Invalid input: Phone number contains invalid characters.");
      return;
    }
    // Job title validation
    if (jobTitle.trim() && /[^a-zA-Z0-9\s\-,.&/]/.test(jobTitle.trim())) {
      setMsg("Invalid input: Job title contains invalid special characters.");
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      await api.updateMe({
        name: name.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        status: status.trim() || null,
        location: location.trim() || null,
        pronouns: pronouns.trim() || null,
        job_title: jobTitle.trim(),
        job_role: jobRole.trim(),
      });
      await refreshUser();
      setMsg("Profile updated successfully!");
      setTimeout(() => setOpen(false), 800);
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isProfileIncomplete =
    !user?.name?.trim() || !user?.job_title?.trim() || !user?.job_role?.trim();

  const isControlled = controlledOpen !== undefined;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isProfileIncomplete) return;
        setOpen(next);
      }}
    >
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : isControlled ? null : (
        <DialogTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </DialogTrigger>
      )}
      <DialogContent
        className="sm:max-w-lg max-h-[90dvh] flex flex-col p-0 overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10"
        showCloseButton={!isProfileIncomplete}
      >
        <DialogHeader className="p-4 sm:p-6 pb-3 shrink-0 border-b border-slate-100 dark:border-white/10">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
            Update your profile details visible to your team. Full name, job title, and department are required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isProfileIncomplete && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900 dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300">
              <span className="font-semibold">⚠️ Mandatory Details Required:</span> Please fill in your <strong>Full Name</strong>, <strong>Job Title</strong>, and <strong>Department / Role</strong> to continue.
            </div>
          )}

          {/* Profile Photo / Avatar Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 dark:border-white/10 dark:bg-[#181818]">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="relative shrink-0">
                <Avatar
                  name={name || user?.name || "?"}
                  size={56}
                  src={avatarSrc}
                  stickerId={
                    user?.avatar_kind === "sticker" ? user.avatar_value ?? null : null
                  }
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarBusy}
                  aria-label="Upload photo"
                  title="Upload photo"
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-purple-600 text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 dark:border-[#181818]"
                >
                  <Camera className="h-3 w-3" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  hidden
                  onChange={(e) => void onPhotoChosen(e.target.files?.[0])}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Profile Photo
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  PNG, JPG, or WebP photo or sticker
                </p>
                {avatarMsg && (
                  <p className="mt-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                    {avatarMsg}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarBusy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                  >
                    <ImagePlus className="h-3 w-3" /> Upload photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStickers((s) => !s)}
                    disabled={avatarBusy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                  >
                    <Smile className="h-3 w-3" /> {showStickers ? "Hide stickers" : "Choose sticker"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void resetToInitials()}
                    disabled={avatarBusy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
                  >
                    <RotateCcw className="h-3 w-3" /> Initials
                  </button>
                </div>
              </div>
            </div>

            {/* Sticker Picker */}
            {showStickers && (
              <div className="mt-3 border-t border-slate-200/60 pt-3 dark:border-white/10">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Select an avatar sticker
                </p>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {STICKER_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => void pickSticker(id)}
                      disabled={avatarBusy}
                      aria-label={`Choose ${id} sticker`}
                      className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border p-1 transition-transform hover:scale-105 ${
                        user?.avatar_kind === "sticker" && user?.avatar_value === id
                          ? "border-purple-600 bg-purple-50 ring-2 ring-purple-600/30 dark:border-purple-400 dark:bg-purple-950/30"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-[#202020]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/stickers/${id}.svg`}
                        alt={id}
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form id="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Full Name <span className="text-purple-600">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={80}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>

            {/* Job Title & Role */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Job Title <span className="text-purple-600">*</span>
                </label>
                <input
                  required
                  list="edit-job-titles"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Select or type job title"
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
                <datalist id="edit-job-titles">
                  {JOB_TITLES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Department / Role <span className="text-purple-600">*</span>
                </label>
                <input
                  required
                  list="edit-job-roles"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Select or type department"
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
                <datalist id="edit-job-roles">
                  {JOB_ROLES.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Status <span className="text-[10px] text-slate-400 dark:text-zinc-500">(optional)</span>
              </label>
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Set status message (e.g. Focused, In meetings)"
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Bio <span className="text-[10px] text-slate-400 dark:text-zinc-500">(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief intro about yourself, your role, or what you work on"
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>

            {/* Phone & Pronouns */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Phone Number <span className="text-[10px] text-slate-400 dark:text-zinc-500">(optional)</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  maxLength={32}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
                <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">Include country code with + (e.g. +1 202 555 0199)</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Pronouns <span className="text-[10px] text-slate-400 dark:text-zinc-500">(optional)</span>
                </label>
                <input
                  list="edit-pronouns"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="Select or type pronouns"
                  maxLength={50}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
                <datalist id="edit-pronouns">
                  {PRONOUNS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Location <span className="text-[10px] text-slate-400 dark:text-zinc-500">(optional)</span>
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city, state or country"
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </form>

          {msg && (
            <p
              className={`text-xs font-medium ${
                msg.includes("updated")
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {msg}
            </p>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-5 shrink-0 border-t border-slate-100 bg-slate-50/80 dark:border-white/10 dark:bg-[#181818]/90 m-0">
          {!isProfileIncomplete && (
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
              type="button"
            >
              Cancel
            </Button>
          )}
          <Button type="submit" form="profile-form" disabled={busy} className="w-full sm:w-auto">
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
