"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  Scale,
  BadgePercent,
  Stethoscope,
  Briefcase,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  FileText,
  MessagesSquare,
  Plus,
  User,
  Camera,
  Compass,
  Zap,
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
  "Graduate Researcher",
  "Software Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Legal Counsel / Attorney",
  "Financial Analyst / Accountant",
  "Medical Practitioner / Doctor",
  "Consultant / Freelancer",
  "Executive / Director",
];

const JOB_ROLES = [
  "Academic & Education",
  "Engineering & Technology",
  "Design & Creative",
  "Product & Operations",
  "Legal & Compliance",
  "Finance & Banking",
  "Healthcare & Life Sciences",
  "Research & Analytics",
];

const MODE_CARDS: {
  id: AudienceMode;
  title: string;
  oneLiner: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
  accentBorder: string;
}[] = [
  {
    id: "academic",
    title: "Academic & Study",
    oneLiner: "Syllabi mastery, 3D flashcards, 2-host audio podcasts & study pods",
    icon: GraduationCap,
    color: "from-purple-600 to-indigo-600",
    badge: "🎓 Student",
    accentBorder: "hover:border-purple-500",
  },
  {
    id: "office",
    title: "Corporate & Team Ops",
    oneLiner: "Enterprise AI chat, WhatsApp-style team channels & decision graphs",
    icon: Building2,
    color: "from-indigo-600 to-blue-600",
    badge: "🏢 Office",
    accentBorder: "hover:border-indigo-500",
  },
  {
    id: "legal",
    title: "Legal & Compliance",
    oneLiner: "Contract redlining diff, clause comparison & mandatory PII redactions",
    icon: Scale,
    color: "from-amber-600 to-orange-600",
    badge: "⚖️ Legal",
    accentBorder: "hover:border-amber-500",
  },
  {
    id: "finance",
    title: "Finance & Accounting",
    oneLiner: "PDF-to-Excel invoice extraction, balance sheet audit & tabular data",
    icon: BadgePercent,
    color: "from-emerald-600 to-teal-600",
    badge: "📊 Finance",
    accentBorder: "hover:border-emerald-500",
  },
  {
    id: "clinical",
    title: "Clinical & Healthcare",
    oneLiner: "HIPAA-grade medical record summaries, clinical trial notes & lab reports",
    icon: Stethoscope,
    color: "from-rose-600 to-pink-600",
    badge: "🏥 Clinical",
    accentBorder: "hover:border-rose-500",
  },
  {
    id: "personal",
    title: "Solo & Freelance",
    oneLiner: "Personal knowledge base, quick document search & client notes",
    icon: Briefcase,
    color: "from-cyan-600 to-blue-600",
    badge: "💼 Personal",
    accentBorder: "hover:border-cyan-500",
  },
];

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const { select: selectWs, refresh: refreshWs } = useWorkspace();
  const { mode, setMode } = useAudienceMode();
  const router = useRouter();

  // Slide index: 1 (Name) -> 2 (Role) -> 3 (Bio/Headline) -> 4 (Photo Optional) -> 5 (Mode Selection) -> 6 (Workspace Setup)
  const [slide, setSlide] = useState<number>(1);

  // Form State
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [status, setStatus] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [selectedMode, setSelectedMode] = useState<AudienceMode>(mode || "office");
  const [workspaceName, setWorkspaceName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setJobTitle(user.job_title || "Student / Undergraduate");
      setJobRole(user.job_role || "Academic & Education");
      setStatus(user.status || "Exploring AskDocs Workspace AI");
      setBio(user.bio || "");
    }
  }, [user]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfileData() {
    try {
      if (avatarFile) {
        await api.uploadAvatarPhoto(avatarFile);
      }
      await api.updateMe({
        name: name.trim() || user?.name || "User",
        job_title: jobTitle || null,
        job_role: jobRole || null,
        status: status || null,
        bio: bio || null,
      });
      await refreshUser();
    } catch (err) {
      console.error("Profile save error:", err);
    }
  }

  const nextSlide = async () => {
    if (slide === 1 && !name.trim()) {
      showToast("error", "Please enter your full name");
      return;
    }
    if (slide === 4) {
      setBusy(true);
      await saveProfileData();
      setBusy(false);
    }
    setSlide((prev) => Math.min(6, prev + 1));
  };

  const prevSlide = () => {
    setSlide((prev) => Math.max(1, prev - 1));
  };

  const handleModeConfirm = (m: AudienceMode) => {
    setSelectedMode(m);
    setMode(m);
    setSlide(6);
  };

  async function handleFinish(wsNameOverride?: string) {
    const finalWsName =
      (wsNameOverride || workspaceName).trim() ||
      (selectedMode === "academic"
        ? "My Study Room"
        : selectedMode === "legal"
        ? "Legal Contracts Vault"
        : selectedMode === "finance"
        ? "Financial Intelligence Hub"
        : selectedMode === "clinical"
        ? "Clinical Records Vault"
        : "My Workspace");

    setBusy(true);
    try {
      await saveProfileData();
      setMode(selectedMode);

      const newWs = await api.createWorkspace(finalWsName);
      await refreshWs();
      selectWs(newWs);

      localStorage.setItem("askdocs_onboarded", "1");
      showToast("success", `Welcome to ${newWs.name}! Setup complete.`);
      router.replace("/dashboard");
    } catch (err) {
      showToast("error", (err as Error).message || "Workspace creation failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#07060e]">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          <p className="text-xs font-semibold">Loading your workspace environment…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8 select-none">
      {/* ===== Animated Wavy Fluid Gradient Background Layer (Theme Aware) ===== */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-[#07060e] transition-colors duration-700">
        {/* Glowing Luminous Aurora Blobs */}
        <div className="absolute -top-[15%] -left-[10%] h-[60vw] w-[60vw] rounded-full bg-gradient-to-br from-purple-400/35 via-indigo-300/25 to-transparent blur-[100px] dark:from-purple-900/35 dark:via-indigo-900/25 animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-[15%] -right-[10%] h-[60vw] w-[60vw] rounded-full bg-gradient-to-tl from-cyan-400/25 via-indigo-400/20 to-pink-400/20 blur-[120px] dark:from-cyan-900/25 dark:via-purple-900/30 dark:to-indigo-900/20 animate-pulse duration-[10000ms]" />
        <div className="absolute top-[35%] left-[20%] h-[45vw] w-[45vw] rounded-full bg-gradient-to-tr from-violet-300/25 via-fuchsia-300/20 to-transparent blur-[90px] dark:from-violet-800/20 dark:via-fuchsia-900/15" />

        {/* Dynamic Fluid SVG Waves Layer */}
        <svg
          className="absolute inset-0 h-full w-full opacity-80 dark:opacity-70 transition-opacity duration-700 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="onbWave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="onbWave2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="onbWaveDark1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="onbWaveDark2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#db2777" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#9333ea" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          <path
            d="M0,280 C320,140 460,460 760,340 C1060,220 1180,480 1440,360 L1440,900 L0,900 Z"
            className="fill-[url(#onbWave1)] dark:fill-[url(#onbWaveDark1)] transition-all duration-700"
          />
          <path
            d="M0,420 C260,560 520,300 820,460 C1120,620 1280,360 1440,480 L1440,900 L0,900 Z"
            className="fill-[url(#onbWave2)] dark:fill-[url(#onbWaveDark2)] transition-all duration-700"
          />
        </svg>

        {/* Tech Mesh Radial Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:32px_32px] opacity-25 dark:opacity-15 pointer-events-none" />
      </div>

      {/* ===== Outer Container Card ===== */}
      <div className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-3xl sm:rounded-[2.25rem] border border-white/70 bg-white/85 p-6 sm:p-10 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-[#110f22]/90 dark:shadow-[0_0_90px_-15px_rgba(147,51,234,0.35)]">
        
        {/* Top Header & Progress Dots */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <span className="block text-xs font-black text-slate-900 dark:text-white tracking-tight">
                Welcome to AskDocs
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 dark:text-zinc-400">
                First-Time Profile & Setup
              </span>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                onClick={() => {
                  if (s < slide) setSlide(s);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  slide === s
                    ? "w-7 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm"
                    : slide > s
                    ? "w-2 bg-purple-500/60 cursor-pointer hover:bg-purple-600"
                    : "w-2 bg-slate-200 dark:bg-white/15"
                }`}
                title={`Step ${s}`}
              />
            ))}
          </div>
        </div>

        {/* ===== SLIDE 1: FULL NAME ===== */}
        {slide === 1 && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 mb-3">
              <span>Question 1 of 4</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              What should we call you? 👋
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Your name will be visible to team members, study partners, and AI collaborators.
            </p>

            <div className="mt-6 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Full Name <span className="text-purple-600">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && nextSlide()}
                  placeholder="e.g. Harshal Patel"
                  className="block w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3.5 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600 dark:focus:border-purple-500"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={nextSlide}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40 active:scale-95 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== SLIDE 2: JOB TITLE & ROLE ===== */}
        {slide === 2 && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 mb-3">
              <span>Question 2 of 4</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              What is your primary role? 🎯
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              This helps AskDocs tailor document suggestions, smart AI tools, and dashboard templates.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Job Title / Profession
                </label>
                <input
                  list="job-titles"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Select or type job title…"
                  className="block w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3 px-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600"
                />
                <datalist id="job-titles">
                  {JOB_TITLES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Field / Department Domain
                </label>
                <input
                  list="job-roles"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Select or type domain…"
                  className="block w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3 px-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600"
                />
                <datalist id="job-roles">
                  {JOB_ROLES.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={prevSlide}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40 active:scale-95 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== SLIDE 3: STATUS & BIO ===== */}
        {slide === 3 && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 mb-3">
              <span>Question 3 of 4</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Headline & Short Bio ✍️
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Add a quick status headline or brief summary of your current project/focus.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Status Headline
                </label>
                <input
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Hey there! Exploring AskDocs Workspace AI"
                  maxLength={100}
                  className="block w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3 px-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Short Bio / Overview (Optional)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize your work, team, or study focus…"
                  maxLength={300}
                  className="block w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3 px-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={prevSlide}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40 active:scale-95 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== SLIDE 4: PROFILE PICTURE (OPTIONAL WITH SKIP) ===== */}
        {slide === 4 && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 mb-3">
              <span>Question 4 of 4 (Optional)</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Add a profile photo 📸
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Upload a picture so colleagues and teammates recognize you in team chats.
            </p>

            {/* Avatar Preview Box */}
            <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-slate-50/70 p-6 dark:border-white/15 dark:bg-[#151326]/60 text-center">
              <Avatar
                name={name || "User"}
                size={80}
                src={avatarPreview || undefined}
              />
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:bg-purple-700 transition-all hover:scale-105 active:scale-95">
                  <Camera className="h-4 w-4" />
                  <span>{avatarFile ? "Change Photo" : "Upload Picture"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="rounded-full bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/20 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-400 dark:text-zinc-500">
                Supports PNG, JPG or WebP images up to 5MB.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={nextSlide}
                className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Skip Photo →
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40 active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  <span>{busy ? "Saving…" : "Save & Choose Mode"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== SLIDE 5: FIRST-TIME AUDIENCE MODE SELECTION ===== */}
        {slide === 5 && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-indigo-500/15 px-3 py-1 text-[11px] font-extrabold text-purple-700 dark:text-purple-300 border border-purple-300/40 dark:border-purple-700/40 mb-2">
              <Compass className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>First-Time Mode Selection</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Choose your operational mode 🚀
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Select how you will primarily use AskDocs. This configures your sidebar tools, AI prompts, and feature prioritization.
            </p>

            {/* Grid of 6 Modes with Simple 1-Liners */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
              {MODE_CARDS.map((card) => {
                const Icon = card.icon;
                const isSelected = selectedMode === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleModeConfirm(card.id)}
                    className={`group flex items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-purple-600 ring-2 ring-purple-500/30 bg-purple-50/70 dark:bg-purple-950/40 dark:border-purple-400 shadow-md scale-[1.02]"
                        : `border-slate-200/90 bg-slate-50/60 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] ${card.accentBorder}`
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-md`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {card.title}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 leading-snug line-clamp-2">
                        {card.oneLiner}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={prevSlide}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Profile</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeConfirm(selectedMode)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40 active:scale-95 cursor-pointer"
              >
                <span>Initialize Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== SLIDE 6: WORKSPACE CREATION & HINTS ===== */}
        {slide === 6 && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 mb-3">
              <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Final Step</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create your first workspace 🏢
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Workspaces isolate your uploaded documents, AI chats, and team channels securely.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Workspace Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder={
                      selectedMode === "academic"
                        ? "e.g. CS101 Midterm Study Vault"
                        : selectedMode === "legal"
                        ? "e.g. Corporate Contracts Vault"
                        : "e.g. Acme Corp Knowledge Workspace"
                    }
                    className="block w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3 px-4 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181628]/80 dark:text-white dark:placeholder-zinc-600"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block">
                  Quick Name Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    selectedMode === "academic" ? "CS101 Study Vault" : "Primary Knowledge Hub",
                    selectedMode === "academic" ? "Research & Notes Pod" : "Team Documents Vault",
                    selectedMode === "academic" ? "Thesis & Exam Prep" : "Client Project Room",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setWorkspaceName(preset);
                        void handleFinish(preset);
                      }}
                      className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-purple-400 hover:bg-purple-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ultra-Concise 1-Line Quick Hints */}
              <div className="rounded-2xl border border-purple-200/60 bg-purple-50/50 p-3.5 dark:border-purple-500/20 dark:bg-purple-950/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 block mb-2">
                  ✨ Quick Tips & Hints:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                    <Upload className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span>Drag & drop PDFs or notes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                    <FileText className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>Ask AI questions with citations</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                    <MessagesSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Collaborate in team channels</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={prevSlide}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Mode</span>
              </button>
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-7 py-3.5 text-xs sm:text-sm font-black text-white shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <span>{busy ? "Opening Workspace…" : "Finish & Enter Workspace"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
