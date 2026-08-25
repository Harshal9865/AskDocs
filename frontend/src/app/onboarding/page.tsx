"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";

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
const JOB_ROLES = ["Engineering", "Design", "Product", "Marketing", "Sales", "Operations", "HR", "Finance", "Support", "Research", "Prefer not to say"];
const PRONOUNS = ["he/him", "she/her", "they/them", "he/they", "she/they", "any", "Prefer not to say"];

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobRole, setJobRole] = useState("");
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
      setJobTitle(user.job_title || "");
      setJobRole(user.job_role || "");
    }
  }, [user]);

  const mandatoryOk =
    bio.trim().length > 0 &&
    status.trim().length > 0 &&
    pronouns.trim().length > 0 &&
    jobTitle.trim().length > 0 &&
    jobRole.trim().length > 0;

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
      await api.updateMe({
        bio: bio || null,
        phone: phone || null,
        status: status || null,
        location: location || null,
        pronouns: pronouns || null,
        job_title: jobTitle || null,
        job_role: jobRole || null,
      });
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
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Status <span className="text-red-500">*</span>
            </label>
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Hey there! I'm on AskDocs"
              maxLength={120}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Bio <span className="text-red-500">*</span>
            </label>
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
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                list="job-titles"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Engineer"
                maxLength={120}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
              <datalist id="job-titles">
                {JOB_TITLES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Job Role / Domain <span className="text-red-500">*</span>
              </label>
              <input
                list="job-roles"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Engineering"
                maxLength={120}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
              <datalist id="job-roles">
                {JOB_ROLES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                maxLength={32}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Pronouns <span className="text-red-500">*</span>
              </label>
              <input
                list="pronouns-list"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="he/him, she/her, they/them"
                maxLength={50}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
              <datalist id="pronouns-list">
                {PRONOUNS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Location <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              maxLength={120}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
            />
          </div>
        </div>

        {!mandatoryOk && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            * Please fill all mandatory fields (bio, status, pronouns, job title &amp; role). You can use “Prefer not to say” to skip a field.
          </p>
        )}
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
            disabled={busy || !mandatoryOk}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {busy ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
