"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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
  const { user, refreshUser } = useAuth();
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
                placeholder="Your Name"
                maxLength={80}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Status <span className="text-[10px] text-slate-400 dark:text-zinc-500">(optional)</span>
              </label>
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Hey there! I'm on AskDocs"
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all"
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
                placeholder="Tell your team a little about yourself"
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all"
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
                  placeholder="e.g. Senior Engineer"
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all"
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
                  placeholder="e.g. Engineering"
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all"
                />
                <datalist id="edit-job-roles">
                  {JOB_ROLES.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Phone & Pronouns */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Phone <span className="text-[10px] text-slate-400 dark:text-zinc-500">(optional)</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  maxLength={32}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Pronouns <span className="text-[10px] text-slate-400 dark:text-zinc-500">(optional)</span>
                </label>
                <input
                  list="edit-pronouns"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="he/him, she/her, they/them"
                  maxLength={50}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all"
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
                placeholder="San Francisco, CA"
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#181818] dark:text-white transition-all"
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
