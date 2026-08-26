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
    setBusy(true);
    setMsg(null);
    try {
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
      setMsg("Profile updated!");
      setTimeout(() => setOpen(false), 800);
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your profile details visible to your team.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Status
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
              Bio
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
                Job Title
              </label>
              <input
                list="edit-job-titles"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Engineer"
                maxLength={120}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
              <datalist id="edit-job-titles">
                {JOB_TITLES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Job Role / Domain
              </label>
              <input
                list="edit-job-roles"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Engineering"
                maxLength={120}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
              <datalist id="edit-job-roles">
                {JOB_ROLES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Phone
              </label>
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
                Pronouns
              </label>
              <input
                list="edit-pronouns"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="he/him, she/her, they/them"
                maxLength={50}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#181818] dark:text-white"
              />
              <datalist id="edit-pronouns">
                {PRONOUNS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Location
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

        {msg && (
          <p
            className={`text-xs font-medium ${
              msg.includes("updated")
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {msg}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
