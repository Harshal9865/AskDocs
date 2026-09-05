"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  Plus,
  Settings,
  UsersRound,
  X,
  ArrowRight,
  Shield,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";

const TEMPLATES = [
  { name: "CS101 Midterm Prep", type: "student", icon: GraduationCap, tag: "Academic" },
  { name: "Engineering Ops & Architecture", type: "corporate", icon: Building2, tag: "Corporate" },
  { name: "Client Contracts & Invoices", type: "freelance", icon: Briefcase, tag: "Freelance" },
  { name: "Legal & SOC2 Vault", type: "legal", icon: Shield, tag: "Legal" },
];

export default function WorkspaceHubModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { workspace, workspaces, select, refresh } = useWorkspace();
  const [activeTab, setActiveTab] = useState<"switch" | "create" | "settings">("switch");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  async function handleCreate(workspaceName?: string) {
    const finalName = (workspaceName || name).trim();
    if (!finalName) {
      showToast("error", "Please enter a workspace name");
      return;
    }

    setBusy(true);
    try {
      const newWs = await api.createWorkspace(finalName);
      await refresh();
      select(newWs);
      showToast("success", `Workspace "${newWs.name}" created!`);
      setName("");
      onClose();
    } catch (err) {
      showToast("error", (err as Error).message || "Failed to create workspace");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#12141f]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-0.5 text-xs font-bold text-purple-700 dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300">
            <Building2 className="h-3.5 w-3.5" />
            <span>WORKSPACE MANAGEMENT HUB</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspaces & Teams
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Switch between workspaces, create new dedicated team rooms, or adjust settings.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex gap-2 border-b border-slate-100 pb-3 dark:border-white/5">
          <button
            onClick={() => setActiveTab("switch")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "switch"
                ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-black"
                : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Switch ({workspaces.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "create"
                ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-black"
                : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "settings"
                ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-black"
                : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Tab 1: Switch Workspaces */}
        {activeTab === "switch" && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {workspaces.map((ws) => {
              const isCurrent = workspace?.id === ws.id;
              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    select(ws);
                    showToast("info", `Switched to workspace "${ws.name}"`);
                    onClose();
                  }}
                  className={`group flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition-all ${
                    isCurrent
                      ? "border-emerald-500/60 bg-emerald-50/40 dark:border-emerald-500/40 dark:bg-emerald-950/20 shadow-xs"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
                      isCurrent
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-300"
                    }`}>
                      {ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{ws.name}</span>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        ID: {ws.id.slice(0, 8)}…
                      </div>
                    </div>
                  </div>

                  {isCurrent ? (
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Create Workspace */}
        {activeTab === "create" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Workspace Name <span className="text-rose-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp Knowledge Vault"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#181a26] dark:text-white dark:focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                Or Pick a Preset Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleCreate(tmpl.name)}
                      disabled={busy}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/30"
                    >
                      <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-slate-800 dark:text-zinc-200">
                          {tmpl.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {tmpl.tag} Preset
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreate()}
                disabled={busy || !name.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {busy ? "Creating…" : "Create Workspace"}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Settings & Links */}
        {activeTab === "settings" && (
          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                router.push("/settings/workspace");
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-left hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Workspace Branding & Preferences
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                    Change logo, active operational mode, and PII defaults.
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                onClose();
                router.push("/members");
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-left hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <UsersRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Team Members & Invitations
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                    Invite colleagues, manage roles (Admin / Member / Viewer).
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
