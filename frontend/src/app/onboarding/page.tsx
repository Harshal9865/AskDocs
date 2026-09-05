"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  Briefcase,
  Check,
  ArrowRight,
  Sparkles,
  Upload,
  FileText,
  MessagesSquare,
  Shield,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { useAudienceMode } from "@/lib/audience-mode-context";
import Avatar from "@/components/Avatar";
import { showToast } from "@/components/Toast";
import type { AudienceMode } from "@/lib/types";

const JOB_TITLES = [
  "Student / Undergraduate",
  "Graduate Student / Researcher",
  "Software Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Legal Counsel",
  "Consultant / Freelancer",
  "Prefer not to say",
];
const JOB_ROLES = ["Academic & Education", "Engineering", "Design", "Product", "Legal & Compliance", "Finance", "Research", "Prefer not to say"];
const PRONOUNS = ["he/him", "she/her", "they/them", "he/they", "she/they", "any", "Prefer not to say"];

const MODE_OPTIONS: { id: AudienceMode; title: string; desc: string; icon: any; color: string; badge: string }[] = [
  {
    id: "academic",
    title: "Student & Academic Mode",
    desc: "Syllabus mastery, 3D flashcards, 2-host audio podcasts, and friend study rooms.",
    icon: GraduationCap,
    color: "from-purple-600 to-indigo-600",
    badge: "🎓 Student",
  },
  {
    id: "office",
    title: "Corporate & Team Ops",
    desc: "Enterprise AI chat, WhatsApp-style team channels, knowledge health, and audit logs.",
    icon: Building2,
    color: "from-indigo-600 to-blue-600",
    badge: "🏢 Corporate",
  },
  {
    id: "personal",
    title: "Solo & Freelance Studio",
    desc: "Contract redlining diff, PDF-to-Excel invoice extractor, and quick client doc search.",
    icon: Briefcase,
    color: "from-emerald-600 to-teal-600",
    badge: "💼 Freelance",
  },
];

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const { workspace, select: selectWs, refresh: refreshWs } = useWorkspace();
  const { mode, setMode } = useAudienceMode();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 2 State
  const [selectedMode, setSelectedMode] = useState<AudienceMode>(mode || "academic");

  // Step 3 State
  const [workspaceName, setWorkspaceName] = useState("");
  const [createdWs, setCreatedWs] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setStatus(user.status || "Hey there! I'm on AskDocs");
      setLocation(user.location || "");
      setPronouns(user.pronouns || "Prefer not to say");
      setJobTitle(user.job_title || "Student / Undergraduate");
      setJobRole(user.job_role || "Academic & Education");
    }
  }, [user]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  // Step 1 submit -> move to Step 2
  async function handleProfileSubmit(skip = false) {
    setBusy(true);
    try {
      if (!skip) {
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
      }
      setStep(2);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  // Step 2 submit -> move to Step 3
  function handleModeSubmit() {
    setMode(selectedMode);
    setStep(3);
  }

  // Step 3 submit -> Create workspace & enter dashboard
  async function handleWorkspaceSubmit(templateName?: string) {
    const nameToUse = (templateName || workspaceName).trim() || (selectedMode === "academic" ? "My Study Room" : "My Workspace");
    setBusy(true);
    try {
      const newWs = await api.createWorkspace(nameToUse);
      await refreshWs();
      selectWs(newWs);
      setCreatedWs(true);
      showToast(`Workspace "${newWs.name}" initialized!`, "success");
      localStorage.setItem("askdocs_onboarded", "1");
      router.replace("/dashboard");
    } catch (err) {
      showToast((err as Error).message || "Failed to create workspace", "error");
    } finally {
      setBusy(false);
    }
  }

  function handleFinishAndEnter() {
    localStorage.setItem("askdocs_onboarded", "1");
    router.replace("/dashboard");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b0e]">
        <p className="text-sm text-slate-500">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#070b0e] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Step Indicator Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-black">
              Ask
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">AskDocs Setup</span>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step === s
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105"
                      : step > s
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-zinc-500"
                  }`}
                >
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                {s < 3 && <div className="h-0.5 w-6 bg-slate-200 dark:bg-white/10" />}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: PROFILE SETUP */}
        {step === 1 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#11131c] sm:p-8 animate-in fade-in duration-300">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                STEP 1 OF 3
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Complete your profile
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Add a photo and role so classmates and colleagues recognize you.
              </p>
            </div>

            <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-white/5">
              <Avatar
                name={user.name}
                size={68}
                src={avatarPreview || undefined}
                stickerId={user.avatar_kind === "sticker" ? user.avatar_value ?? null : null}
              />
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-100 transition-colors">
                  Upload Photo
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">PNG, JPG or WebP up to 5MB.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Status Headline
                </label>
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Hey there! I'm on AskDocs"
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-[#181824] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Bio / About You
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your team or classmates about your work"
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-[#181824] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Job Title / Role
                  </label>
                  <input
                    list="job-titles"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Student or Senior Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-[#181824] dark:text-white"
                  />
                  <datalist id="job-titles">
                    {JOB_TITLES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Domain / Field
                  </label>
                  <input
                    list="job-roles"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Computer Science or Legal"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-[#181824] dark:text-white"
                  />
                  <datalist id="job-roles">
                    {JOB_ROLES.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleProfileSubmit(true)}
                disabled={busy}
                className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Skip Profile
              </button>
              <button
                type="button"
                onClick={() => handleProfileSubmit(false)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-black dark:bg-white dark:text-black transition-all hover:scale-105"
              >
                <span>Continue to Operational Mode</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MODE SELECTION MENU */}
        {step === 2 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#11131c] sm:p-8 animate-in fade-in duration-300">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                STEP 2 OF 3
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Choose how you will use AskDocs
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Selecting a mode optimizes your workspace, sidebar tools, and chat preferences. You can switch modes anytime.
              </p>
            </div>

            <div className="space-y-3.5 mb-8">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedMode === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedMode(opt.id)}
                    className={`group flex items-start justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-400 shadow-md"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${opt.color} text-white shadow-md`}>
                        <Icon className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {opt.title}
                          </span>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-zinc-300">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </div>

                    <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 dark:border-white/20"
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleModeSubmit}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-black dark:bg-white dark:text-black transition-all hover:scale-105"
              >
                <span>Continue to Workspace Setup</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WORKSPACE CREATION & TUTORIAL */}
        {step === 3 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#11131c] sm:p-8 animate-in fade-in duration-300">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                STEP 3 OF 3
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Create your first workspace & start uploading
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Workspaces hold your documents, team channels, and AI chats securely.
              </p>
            </div>

            {/* Workspace Form */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Workspace Name <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder={selectedMode === "academic" ? "e.g. CS101 Midterm Study Room" : "e.g. Acme Corp Knowledge Vault"}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#181824] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleWorkspaceSubmit()}
                    disabled={busy}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{busy ? "Creating…" : "Initialize Workspace"}</span>
                  </button>
                </div>
              </div>

              {/* Preset Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block">
                  Or pick a preset name:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    selectedMode === "academic" ? "CS101 Midterm Study Room" : "Engineering & Product Vault",
                    selectedMode === "academic" ? "Organic Chemistry Notes" : "Client Contracts & Invoices",
                    selectedMode === "academic" ? "Thesis & Research Cohort" : "General Team Workspace",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setWorkspaceName(preset);
                        handleWorkspaceSubmit(preset);
                      }}
                      disabled={busy}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skippable Tutorial & Document Guide */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03] mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Quick Start Guide: How to use AskDocs
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-xl bg-white p-3 border border-slate-200/60 dark:border-white/5 dark:bg-[#161824]">
                  <Upload className="h-4 w-4 text-indigo-500 mb-1.5" />
                  <div className="font-bold text-slate-900 dark:text-white">1. Drag & Drop Files</div>
                  <div className="text-slate-500 dark:text-zinc-400 mt-0.5">Upload PDFs, DOCX, TXT or CSV files in seconds.</div>
                </div>

                <div className="rounded-xl bg-white p-3 border border-slate-200/60 dark:border-white/5 dark:bg-[#161824]">
                  <FileText className="h-4 w-4 text-emerald-500 mb-1.5" />
                  <div className="font-bold text-slate-900 dark:text-white">2. Ask Cited Questions</div>
                  <div className="text-slate-500 dark:text-zinc-400 mt-0.5">Get instant answers with exact page citations attached.</div>
                </div>

                <div className="rounded-xl bg-white p-3 border border-slate-200/60 dark:border-white/5 dark:bg-[#161824]">
                  <MessagesSquare className="h-4 w-4 text-purple-500 mb-1.5" />
                  <div className="font-bold text-slate-900 dark:text-white">3. Discuss in Chats</div>
                  <div className="text-slate-500 dark:text-zinc-400 mt-0.5">Collaborate in DMs and group chats with team presence.</div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinishAndEnter}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-black dark:bg-white dark:text-black transition-all hover:scale-105"
              >
                <span>Finish & Open Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
