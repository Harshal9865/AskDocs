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
  Search,
  Compass,
  Clock,
  Send,
  Loader2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import { showToast } from "@/components/Toast";
import HintTooltip from "@/components/HintTooltip";
import type { Workspace, Member, JoinRequest } from "@/lib/types";

const WORKSPACE_EMBLEMS = [
  { id: "cute-1", name: "Nexus Prism", tag: "Quantum 3D" },
  { id: "cute-2", name: "Aero Launch", tag: "Velocity 3D" },
  { id: "cute-3", name: "Quantum Spark", tag: "Energy 3D" },
  { id: "cute-4", name: "Cyber Shield", tag: "Security 3D" },
  { id: "ai-2", name: "Global Orbit", tag: "Planetary 3D" },
];

function WorkspaceLogoCardBadge({ ws, isCurrent }: { ws: Workspace; isCurrent?: boolean }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (ws.brand_kind === "upload") {
      api.getBrandLogoUrl(ws.id)
        .then((url) => { if (!cancelled) setLogoUrl(url); })
        .catch(() => { if (!cancelled) setLogoUrl(null); });
    } else {
      setLogoUrl(null);
    }
    return () => { cancelled = true; };
  }, [ws.id, ws.brand_kind]);

  return (
    <div
      className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs uppercase shadow-xs overflow-hidden ${
        isCurrent
          ? "bg-emerald-600 text-white"
          : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
      }`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={ws.name} className="h-full w-full object-cover" />
      ) : ws.brand_kind === "sticker" && ws.brand_value ? (
        <span className="text-sm">{ws.brand_value}</span>
      ) : (
        ws.name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

export default function WorkspacesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "all" | "discover" | "create" | "settings" | "members") || "all";

  const { workspace, workspaces, select, refresh } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | "discover" | "create" | "settings" | "members">(initialTab);

  // Discover Public Workspaces State
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [publicWorkspaces, setPublicWorkspaces] = useState<Workspace[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [applyMsg, setApplyMsg] = useState<Record<string, string>>({});
  const [showMsgFor, setShowMsgFor] = useState<string | null>(null);
  const [busyJoinId, setBusyJoinId] = useState<string | null>(null);

  const loadDiscoverWorkspaces = async (q?: string) => {
    setDiscoverLoading(true);
    try {
      const [pubList, reqList] = await Promise.all([
        api.discoverWorkspaces(q, 50, 0),
        api.myJoinRequests().catch(() => [] as JoinRequest[]),
      ]);
      setPublicWorkspaces(pubList);
      setMyRequests(reqList);
    } catch (err) {
      console.error("Discover load error:", err);
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "discover") {
      void loadDiscoverWorkspaces(discoverQuery.trim() || undefined);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "discover") return;
    const t = setTimeout(() => {
      void loadDiscoverWorkspaces(discoverQuery.trim() || undefined);
    }, 350);
    return () => clearTimeout(t);
  }, [discoverQuery]);

  async function handleApply(wsId: string) {
    setBusyJoinId(wsId);
    try {
      const message = applyMsg[wsId]?.trim() || "";
      await api.createJoinRequest(wsId, message);
      showToast("success", "Join request sent! Workspace admin will review.");
      setShowMsgFor(null);
      await loadDiscoverWorkspaces(discoverQuery.trim() || undefined);
    } catch (err) {
      showToast("error", (err as Error).message || "Failed to send request");
    } finally {
      setBusyJoinId(null);
    }
  }

  async function handleWithdraw(reqId: string) {
    if (!confirm("Withdraw this join request?")) return;
    try {
      await api.withdrawJoinRequest(reqId);
      showToast("info", "Join request withdrawn.");
      setMyRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

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
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>WORKSPACE MANAGEMENT CENTER</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Workspaces & Teams
            </h1>
            <HintTooltip text="Workspaces isolate team files, channels, and AI memories so your data stays private and organized." />
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
            Create dedicated team rooms, switch active workspaces, and customize branding in seconds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Workspace Logo Emblem Badge */}
          {workspace && (
            <div className="hidden sm:flex items-center gap-2.5 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 p-2 dark:border-indigo-500/30 dark:bg-indigo-950/40 shadow-2xs shrink-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xs shadow-xs overflow-hidden">
                {brandSrcLocal ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandSrcLocal} alt={workspace.name} className="h-full w-full object-cover" />
                ) : brandStickerLocal ? (
                  <span className="text-sm">{brandStickerLocal}</span>
                ) : (
                  workspace.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[130px]">
                    {workspace.name}
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                  Current Workspace
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => setActiveTab("create")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20 shrink-0 w-full sm:w-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Workspace</span>
          </button>
        </div>
      </div>

      {/* Skippable Onboarding Tutorial Banner */}
      {showTutorial && (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white p-4 sm:p-5 dark:border-indigo-500/20 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-[#121420] shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-black text-xs shrink-0">
                    ⚡
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Quick Start Guide: How Workspaces Work
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={dismissTutorial}
                  className="sm:hidden text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 text-xs">
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
              className="hidden sm:block shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20 transition-all cursor-pointer"
            >
              Skip Tutorial ✕
            </button>
          </div>
        </div>
      )}

      {/* Feature Hub Grid — No Horizontal Scroll Required! */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          {
            id: "all",
            label: "My Workspaces",
            sub: `${workspaces.length} Vaults`,
            icon: Layers,
            color: "text-indigo-600 bg-indigo-50 border-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/40",
            badge: workspaces.length,
          },
          {
            id: "discover",
            label: "Discover & Join",
            sub: "Search Public",
            icon: Globe,
            color: "text-purple-600 bg-purple-50 border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/40",
            badge: "Search",
          },
          {
            id: "create",
            label: "Create Workspace",
            sub: "New Room",
            icon: Plus,
            color: "text-emerald-600 bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40",
            badge: "+ New",
          },
          {
            id: "settings",
            label: "Settings & Brand",
            sub: "Branding",
            icon: Settings,
            color: "text-amber-600 bg-amber-50 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40",
          },
          {
            id: "members",
            label: "Team Members",
            sub: `${members.length} People`,
            icon: UsersRound,
            color: "text-cyan-600 bg-cyan-50 border-cyan-200/60 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800/40",
            badge: members.length,
            colSpan: "col-span-2 sm:col-span-1",
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "all" | "discover" | "create" | "settings" | "members")}
              className={`group flex flex-col justify-between rounded-2xl border p-3 sm:p-3.5 text-left transition-all duration-200 cursor-pointer ${
                tab.colSpan || ""
              } ${
                isSelected
                  ? "border-purple-600 ring-2 ring-purple-500/30 bg-purple-50/80 dark:bg-purple-950/40 dark:border-purple-400 shadow-md scale-[1.02]"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-white/10 dark:bg-[#121420] dark:hover:border-white/20 dark:hover:bg-white/[0.04] shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl border font-bold ${tab.color}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                </div>
                {tab.badge !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-purple-600 text-white dark:bg-purple-500 dark:text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-400"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {tab.label}
                </span>
                <span className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                  {tab.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ALL WORKSPACES & SWITCHER */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Quick Discover Callout Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-white p-4 dark:border-indigo-500/20 dark:bg-gradient-to-r dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-[#121420] shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold shadow-xs">
                <Compass className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Looking to search or join an existing workspace?
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Discover public workspaces across your company, request access, or track pending join requests.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-xs cursor-pointer w-full sm:w-auto justify-center"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search Public Workspaces</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {workspaces.map((ws) => {
              const isCurrent = workspace?.id === ws.id;
              return (
                <div
                  key={ws.id}
                  onClick={() => handleSwitch(ws)}
                  className={`group relative flex flex-col justify-between rounded-3xl border p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                    isCurrent
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:border-emerald-500/40 dark:bg-emerald-950/20 shadow-md"
                      : "border-slate-200/90 bg-white hover:border-slate-300 shadow-sm dark:border-white/10 dark:bg-[#121420] dark:hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <WorkspaceLogoCardBadge ws={ws} isCurrent={isCurrent} />
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5">
                            <span className="truncate">{ws.name}</span>
                            {isCurrent && (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5 truncate max-w-[180px] sm:max-w-none">
                            ID: {ws.id}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/5 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-medium truncate">
                      <Shield className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>{ws.is_public ? "Public" : "Private Vault"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwitch(ws);
                        setActiveTab("settings");
                      }}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
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

      {/* TAB: DISCOVER & JOIN PUBLIC WORKSPACES */}
      {activeTab === "discover" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-xl dark:border-white/10 dark:bg-[#121420] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-xs shadow-xs">
                    <Globe className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    Discover Public Workspaces
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Search existing workspaces across your company, request membership, or track join requests.
                </p>
              </div>

              {/* Active Workspace Badge in Discover Header */}
              {workspace && (
                <div className="flex items-center gap-3 rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/80 to-indigo-50/50 px-3.5 py-2 dark:border-purple-500/30 dark:bg-purple-950/40 shrink-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-xs shadow-xs overflow-hidden">
                    {brandSrcLocal ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brandSrcLocal} alt={workspace.name} className="h-full w-full object-cover" />
                    ) : brandStickerLocal ? (
                      <span className="text-sm">{brandStickerLocal}</span>
                    ) : (
                      workspace.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {workspace.name}
                      </span>
                      <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white">
                        Active
                      </span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                      Your Current Workspace
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={discoverQuery}
                onChange={(e) => setDiscoverQuery(e.target.value)}
                placeholder="Search public workspaces by name, keyword, or domain…"
                className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3 pl-11 pr-10 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181a28] dark:text-white dark:placeholder-zinc-500"
              />
              {discoverQuery && (
                <button
                  type="button"
                  onClick={() => setDiscoverQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Loading Spinner */}
            {discoverLoading && (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                <span className="text-xs font-semibold">Searching public workspace directory…</span>
              </div>
            )}

            {/* Empty State */}
            {!discoverLoading && publicWorkspaces.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200/80 p-8 text-center dark:border-white/10">
                <Compass className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600 mb-2" />
                <div className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                  No public workspaces found
                </div>
                <div className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                  {discoverQuery ? `No public workspaces match "${discoverQuery}"` : "There are no public workspaces listed yet. You can create a new workspace or make yours public!"}
                </div>
              </div>
            )}

            {/* Public Workspaces Grid */}
            {!discoverLoading && publicWorkspaces.length > 0 && (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {publicWorkspaces.map((pubWs) => {
                  const isMember = workspaces.some((w) => w.id === pubWs.id);
                  const pendingReq = myRequests.find(
                    (r) => r.workspace_id === pubWs.id && r.status === "pending"
                  );
                  const isBusy = busyJoinId === pubWs.id;

                  return (
                    <div
                      key={pubWs.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 transition-all hover:border-purple-300 hover:bg-white dark:border-white/10 dark:bg-[#161826] dark:hover:bg-[#1b1e30]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <WorkspaceLogoCardBadge ws={pubWs} isCurrent={isMember} />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {pubWs.name}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[150px] sm:max-w-none">
                                ID: {pubWs.id}
                              </div>
                            </div>
                          </div>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 shrink-0">
                            Public Vault
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/5">
                        {isMember ? (
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3.5 w-3.5" /> Already Joined
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSwitch(pubWs)}
                              className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              Switch Workspace ➔
                            </button>
                          </div>
                        ) : pendingReq ? (
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                              <Clock className="h-3.5 w-3.5" /> Request Pending
                            </span>
                            <button
                              type="button"
                              onClick={() => handleWithdraw(pendingReq.id)}
                              className="text-[11px] font-bold text-rose-500 hover:underline"
                            >
                              Withdraw Request
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {showMsgFor === pubWs.id ? (
                              <div className="space-y-2 animate-in fade-in duration-200">
                                <input
                                  type="text"
                                  placeholder="Message for workspace admin (optional)…"
                                  value={applyMsg[pubWs.id] || ""}
                                  onChange={(e) =>
                                    setApplyMsg((prev) => ({
                                      ...prev,
                                      [pubWs.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#121420] dark:text-white"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowMsgFor(null)}
                                    className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApply(pubWs.id)}
                                    disabled={isBusy}
                                    className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3.5 py-1 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-all cursor-pointer"
                                  >
                                    <Send className="h-3 w-3" />
                                    <span>{isBusy ? "Sending…" : "Send Join Request"}</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowMsgFor(pubWs.id)}
                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Request to Join Workspace</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Sent Join Requests Tracking Section */}
          {myRequests.length > 0 && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-[#121420] space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                My Sent Join Requests ({myRequests.length})
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {myRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Workspace ID: {req.workspace_id}
                      </div>
                      {req.message && (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 italic">
                          &ldquo;{req.message}&rdquo;
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        req.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          : req.status === "approved"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                      }`}>
                        {req.status}
                      </span>
                      {req.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleWithdraw(req.id)}
                          className="font-bold text-rose-500 hover:underline text-[11px]"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE WORKSPACE */}
      {activeTab === "create" && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-xl dark:border-white/10 dark:bg-[#121420] space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Create a New Workspace</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Workspaces isolate documents, team channels, and AI memories securely.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Workspace Name <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
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
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
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
