"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Check,
  Plus,
  Settings,
  UsersRound,
  ArrowRight,
  Shield,
  GraduationCap,
  Briefcase,
  Camera,
  RotateCcw,
  Trash2,
  Globe,
  Lock,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import { showToast } from "@/components/Toast";
import HintTooltip from "@/components/HintTooltip";
import type { Workspace, Member } from "@/lib/types";

const WORKSPACE_EMBLEMS = [
  { id: "cute-1", name: "Nexus Prism", tag: "Quantum 3D" },
  { id: "cute-2", name: "Aero Launch", tag: "Velocity 3D" },
  { id: "cute-3", name: "Quantum Spark", tag: "Energy 3D" },
  { id: "cute-4", name: "Cyber Shield", tag: "Security 3D" },
  { id: "ai-2", name: "Global Orbit", tag: "Planetary 3D" },
];

const TEMPLATES = [
  { name: "CS101 Midterm Prep", type: "student", icon: GraduationCap, tag: "Academic Mode" },
  { name: "Engineering Ops & Architecture", type: "corporate", icon: Building2, tag: "Corporate Mode" },
  { name: "Client Contracts & Invoices", type: "freelance", icon: Briefcase, tag: "Freelance Mode" },
  { name: "Legal & Compliance Vault", type: "legal", icon: Shield, tag: "Legal Mode" },
];

export default function WorkspacesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "all" | "create" | "settings" | "members") || "all";

  const { workspace, workspaces, select, refresh } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | "create" | "settings" | "members">(initialTab);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  useEffect(() => {
    setShowTutorial(localStorage.getItem("askdocs_ws_tutorial_dismissed") !== "1");
  }, []);

  function dismissTutorial() {
    localStorage.setItem("askdocs_ws_tutorial_dismissed", "1");
    setShowTutorial(false);
  }

  // Create Workspace State
  const [newWsName, setNewWsName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  // Workspace Settings State
  const [name, setName] = useState(workspace?.name ?? "");
  const [isPublic, setIsPublic] = useState(workspace?.is_public ?? false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Brand Logo State
  const brandRef = useRef<HTMLInputElement>(null);
  const [brandBusy, setBrandBusy] = useState(false);
  const [brandSrcLocal, setBrandSrcLocal] = useState<string | null>(null);
  const [brandStickerLocal, setBrandStickerLocal] = useState<string | null>(null);

  // Members State
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!workspace || !user) return;
    api.listMembers(workspace.id)
      .then((mList) => {
        setMembers(mList);
        const me = mList.find((m) => m.user_id === user.id || m.email === user.email);
        setIsAdmin(me?.role === "admin");
      })
      .catch(() => {});
  }, [workspace, user]);

  useEffect(() => {
    if (!workspace) return;
    setName(workspace.name ?? "");
    setIsPublic(workspace.is_public ?? false);

    if (workspace.brand_kind === "upload") {
      api.getBrandLogoUrl(workspace.id)
        .then((url) => {
          setBrandSrcLocal(url);
          setBrandStickerLocal(null);
        })
        .catch(() => setBrandSrcLocal(null));
    } else if (workspace.brand_kind === "sticker" && workspace.brand_value) {
      setBrandStickerLocal(workspace.brand_value);
      setBrandSrcLocal(null);
    } else {
      setBrandSrcLocal(null);
      setBrandStickerLocal(null);
    }
  }, [workspace]);

  // Handle Workspace Switch
  function handleSwitch(targetWs: Workspace) {
    select(targetWs);
    showToast("info", `Switched to workspace "${targetWs.name}"`);
  }

  // Handle Workspace Creation
  async function handleCreateWorkspace(presetName?: string) {
    const finalName = (presetName || newWsName).trim();
    if (!finalName) {
      showToast("error", "Please enter a workspace name");
      return;
    }
    setCreateBusy(true);
    try {
      const newWs = await api.createWorkspace(finalName);
      await refresh();
      select(newWs);
      setNewWsName("");
      showToast("success", `Workspace "${newWs.name}" created!`);
      setActiveTab("all");
    } catch (err) {
      showToast("error", (err as Error).message || "Failed to create workspace");
    } finally {
      setCreateBusy(false);
    }
  }

  // Handle Workspace Rename
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !name.trim() || !isAdmin) return;
    setSettingsBusy(true);
    try {
      await api.renameWorkspace(workspace.id, name.trim());
      await refresh();
      showToast("success", "Workspace renamed successfully.");
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setSettingsBusy(false);
    }
  }

  // Handle Visibility Toggle
  async function handleTogglePublic() {
    if (!workspace || !isAdmin) return;
    const next = !isPublic;
    try {
      await api.setWorkspaceVisibility(workspace.id, next);
      setIsPublic(next);
      await refresh();
      showToast("success", next ? "Workspace is now public." : "Workspace is now private.");
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  // Handle Brand Update
  async function applyBrand(kind: "default" | "sticker", value?: string) {
    if (!workspace || !isAdmin) return;
    setBrandBusy(true);
    try {
      await api.setBrand(workspace.id, kind, value);
      await refresh();
      if (kind === "default") {
        setBrandSrcLocal(null);
        setBrandStickerLocal(null);
        showToast("success", "Reset to workspace initials.");
      } else {
        setBrandSrcLocal(null);
        setBrandStickerLocal(value ?? null);
        showToast("success", "Workspace brand emblem updated.");
      }
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setBrandBusy(false);
    }
  }

  async function onBrandPhotoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !workspace || !isAdmin) return;
    setBrandBusy(true);
    try {
      await api.uploadBrandPhoto(workspace.id, file);
      const url = await api.getBrandLogoUrl(workspace.id);
      setBrandSrcLocal(url);
      setBrandStickerLocal(null);
      await refresh();
      showToast("success", "Brand logo uploaded successfully.");
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setBrandBusy(false);
      if (brandRef.current) brandRef.current.value = "";
    }
  }

  // Handle Delete Workspace
  async function handleDeleteWorkspace() {
    if (!workspace || !isAdmin) return;
    if (!confirm(`Delete "${workspace.name}" and ALL its documents/chats? This cannot be undone.`)) return;
    try {
      await api.deleteWorkspace(workspace.id);
      localStorage.removeItem("askdocs_workspace");
      await refresh();
      showToast("info", `Workspace "${workspace.name}" deleted.`);
      router.replace("/dashboard");
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-white/10">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300">
            <Building2 className="h-3.5 w-3.5" />
            <span>WORKSPACE MANAGEMENT CENTER</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Workspaces & Teams
            </h1>
            <HintTooltip text="Workspaces isolate team files, channels, and AI memories so your data stays private and organized." />
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
            Create dedicated team rooms, switch active workspaces, and customize branding in seconds.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setActiveTab("create")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Skippable Onboarding Tutorial Banner */}
      {showTutorial && (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white p-5 dark:border-indigo-500/20 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-[#121420] shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-black text-xs">
                  ⚡
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Quick Start Guide: How Workspaces Work
                </h3>
                <span className="rounded-full bg-indigo-200/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  New User Guide
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
                <div className="rounded-2xl bg-white/90 p-3 border border-indigo-100 dark:border-white/5 dark:bg-[#161826] shadow-2xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <span>1. Select or Create</span>
                  </div>
                  <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-snug">
                    Pick a preset template or create a custom team workspace vault.
                  </div>
                </div>
                <div className="rounded-2xl bg-white/90 p-3 border border-indigo-100 dark:border-white/5 dark:bg-[#161826] shadow-2xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <span>2. Add Team & Files</span>
                  </div>
                  <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-snug">
                    Upload PDFs or spreadsheets and invite members with instant role links.
                  </div>
                </div>
                <div className="rounded-2xl bg-white/90 p-3 border border-indigo-100 dark:border-white/5 dark:bg-[#161826] shadow-2xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <span>3. Ask Cited AI</span>
                  </div>
                  <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-snug">
                    Get answers with exact page citations and collaborate in group chats.
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissTutorial}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20 transition-all cursor-pointer"
            >
              Skip Tutorial ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 pb-3 dark:border-white/5">
        {[
          { id: "all", label: `All Workspaces (${workspaces.length})`, icon: Layers },
          { id: "create", label: "Create Workspace", icon: Plus },
          { id: "settings", label: "Workspace Settings & Branding", icon: Settings },
          { id: "members", label: `Team Members (${members.length})`, icon: UsersRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "all" | "create" | "settings" | "members")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-black scale-[1.02]"
                  : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ALL WORKSPACES & SWITCHER */}
      {activeTab === "all" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {workspaces.map((ws) => {
              const isCurrent = workspace?.id === ws.id;
              return (
                <div
                  key={ws.id}
                  onClick={() => handleSwitch(ws)}
                  className={`group relative flex flex-col justify-between rounded-3xl border p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                    isCurrent
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:border-emerald-500/40 dark:bg-emerald-950/20 shadow-md"
                      : "border-slate-200/90 bg-white hover:border-slate-300 shadow-sm dark:border-white/10 dark:bg-[#121420] dark:hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-black text-sm uppercase shadow-xs ${
                          isCurrent
                            ? "bg-emerald-600 text-white"
                            : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                        }`}>
                          {ws.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{ws.name}</span>
                            {isCurrent && (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                Active Workspace
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                            ID: {ws.id}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/5 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Shield className="h-3.5 w-3.5 text-indigo-500" />
                      {ws.is_public ? "Public Workspace" : "Private Vault"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwitch(ws);
                        setActiveTab("settings");
                      }}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Settings className="h-3.5 w-3.5" /> Configure
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE WORKSPACE */}
      {activeTab === "create" && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#121420] sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create a New Workspace</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Workspaces isolate documents, team channels, and AI memories securely.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Workspace Name <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Acme Legal Contracts Vault"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#181a28] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleCreateWorkspace()}
                  disabled={createBusy || !newWsName.trim()}
                  className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>{createBusy ? "Initializing…" : "Initialize Workspace"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                Or Pick a Preset Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleCreateWorkspace(tmpl.name)}
                      disabled={createBusy}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/30 group"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {tmpl.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          {tmpl.tag} • Instant Setup
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKSPACE SETTINGS & BRANDING */}
      {activeTab === "settings" && workspace && (
        <div className="space-y-6">
          {!isAdmin && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200">
              You are a member of <span className="font-bold">{workspace.name}</span>. Only workspace admins can modify branding and security settings.
            </div>
          )}

          {/* Rename Workspace Form */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121420] space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" />
              General Preferences
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin || settingsBusy}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-[#181a28] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {isPublic ? <Globe className="h-3.5 w-3.5 text-emerald-500" /> : <Lock className="h-3.5 w-3.5 text-amber-500" />}
                    Workspace Visibility
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {isPublic ? "Public — Discoverable by company colleagues" : "Private — Hidden vault, invite-only access"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePublic}
                  disabled={!isAdmin}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isPublic
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-300"
                  }`}
                >
                  {isPublic ? "Public" : "Private"}
                </button>
              </div>

              {isAdmin && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={settingsBusy || !name.trim()}
                    className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-black dark:bg-white dark:text-black transition-all"
                  >
                    {settingsBusy ? "Saving…" : "Save Workspace Name"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Custom Brand Logo & Emblem Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121420] space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-purple-500" />
              Workspace Emblem & Branding
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Preview Avatar */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 font-black text-2xl text-white shadow-md">
                  {brandSrcLocal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brandSrcLocal} alt="Brand logo" className="h-full w-full object-cover" />
                  ) : brandStickerLocal ? (
                    <span className="text-xs font-bold text-white">{brandStickerLocal}</span>
                  ) : (
                    workspace.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Current Logo</span>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <input
                  ref={brandRef}
                  type="file"
                  accept="image/*"
                  onChange={onBrandPhotoChosen}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => brandRef.current?.click()}
                    disabled={!isAdmin || brandBusy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload Custom Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBrand("default")}
                    disabled={!isAdmin || brandBusy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Initials</span>
                  </button>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block">
                    Or select a 3D Emblem Preset:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {WORKSPACE_EMBLEMS.map((emb) => (
                      <button
                        key={emb.id}
                        type="button"
                        onClick={() => applyBrand("sticker", emb.id)}
                        disabled={!isAdmin || brandBusy}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 transition-colors"
                      >
                        {emb.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone: Delete Workspace */}
          {isAdmin && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/30 dark:bg-rose-950/20 space-y-3">
              <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Danger Zone
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-300">
                Permanently delete workspace &ldquo;{workspace.name}&rdquo; and all associated documents, channels, and AI memories.
              </p>
              <button
                type="button"
                onClick={handleDeleteWorkspace}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-all shadow-sm"
              >
                Delete Workspace
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MEMBERS */}
      {activeTab === "members" && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121420] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-emerald-500" />
                Team Members & Invitations
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                People with access to workspace documents and team channels.
              </p>
            </div>
            <button
              onClick={() => router.push("/members")}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Manage Members Page</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {members.map((m) => (
              <div key={m.user_id || m.email} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 font-bold text-xs uppercase text-slate-700 dark:bg-white/10 dark:text-zinc-300">
                    {(m.name || m.email).slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {m.name || m.email.split("@")[0]}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                      {m.email}
                    </div>
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  m.role === "admin"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                    : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-300"
                }`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
