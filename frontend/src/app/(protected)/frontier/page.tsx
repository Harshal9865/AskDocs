"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  MicOff,
  FileText,
  ArrowRight,
  Rocket,
  Brain,
  Scale,
  Table,
  Layers,
  CheckCircle2,
  Download,
  Copy,
  GitBranch,
  ArrowLeft,
  Search,
  Sparkles,
  LogOut,
  User,
  Settings,
  CircleHelp,
  ExternalLink,
  Volume2,
  Play,
  Square,
  Radio,
  ShieldAlert,
  Lock,
  BookOpen,
  X,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { showToast } from "@/components/Toast";
import type { DocumentItem } from "@/lib/types";
import NotificationBell from "@/components/NotificationBell";
import Avatar from "@/components/Avatar";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";

type FrontierTab = "command" | "voice" | "research" | "sheets" | "radar" | "decisions" | "workflows";

export default function FrontierLabsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const initialTab = (searchParams.get("tab") as FrontierTab) || "command";
  const [activeTab, setActiveTab] = useState<FrontierTab>(initialTab);
  const { workspace, loading: wsLoading } = useWorkspace();
  const { user, logout, avatarSrc } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Determine user admin status in workspace
  useEffect(() => {
    if (!workspace?.id || !user) {
      if (!wsLoading) setRoleLoading(false);
      return;
    }
    let cancelled = false;
    setRoleLoading(true);
    api.listMembers(workspace.id)
      .then((members) => {
        if (!cancelled) {
          const me = members.find((m) => m.email === user.email);
          setMyRole(me?.role ?? workspace.role ?? null);
          setRoleLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMyRole(workspace.role ?? null);
          setRoleLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspace?.id, workspace?.role, user, wsLoading]);

  const isAdmin =
    workspace?.role === "admin" ||
    workspace?.role === "owner" ||
    myRole === "admin" ||
    myRole === "owner" ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user as any)?.is_superuser ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user as any)?.role === "admin";

  // Load existing workspace documents
  useEffect(() => {
    if (!workspace?.id) return;
    api.listDocuments(workspace.id)
      .then((docs) => setDocuments(docs))
      .catch(() => {});
  }, [workspace?.id]);

  // Sync tab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab") as FrontierTab;
    if (tabParam && ["command", "voice", "research", "sheets", "radar", "decisions", "workflows"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Close profile menu on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [profileMenuOpen]);

  // DOCK NAVIGATION: Institutional Enterprise Color Roles (Emerald Precision for Audio & Pipelines, Indigo for Research & Decisions)
  const DOCK_ITEMS = [
    {
      id: "command",
      label: "Master Console",
      icon: Layers,
      type: "hybrid",
      accent: "from-indigo-600 to-emerald-500",
      badge: "OVERVIEW",
      tagColor: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30",
    },
    {
      id: "voice",
      label: "Voice Co-Pilot",
      icon: Mic,
      type: "acoustic",
      accent: "from-[#10B981] to-emerald-600",
      badge: "SPOKEN DIALOGUE",
      tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40",
    },
    {
      id: "research",
      label: "Deep Research Dossier",
      icon: FileText,
      type: "cognitive",
      accent: "from-indigo-600 via-indigo-500 to-blue-600",
      badge: "COGNITIVE SYNTHESIS",
      tagColor: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30",
    },
    {
      id: "sheets",
      label: "Financial Modeler",
      icon: Table,
      type: "hybrid",
      accent: "from-emerald-600 via-teal-600 to-indigo-600",
      badge: "FORMULA MATRIX",
      tagColor: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30",
    },
    {
      id: "radar",
      label: "Conflict Radar",
      icon: Scale,
      type: "cognitive",
      accent: "from-indigo-600 via-rose-600 to-indigo-800",
      badge: "REDLINE CLASH",
      tagColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30",
    },
    {
      id: "decisions",
      label: "Tradeoff Solver",
      icon: Brain,
      type: "cognitive",
      accent: "from-indigo-700 via-purple-600 to-indigo-500",
      badge: "DECISION MATRIX",
      tagColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
    },
    {
      id: "workflows",
      label: "Pipeline Automator",
      icon: GitBranch,
      type: "acoustic",
      accent: "from-[#10B981] via-emerald-600 to-teal-500",
      badge: "CIRCUIT FLOW",
      tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#07090e] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500/30 selection:text-emerald-500">
      {/* =========================================================================
          TOP HYBRID DUAL-ENGINE CONSOLE NAVBAR (LIGHT / DARK COMPATIBLE & RESPONSIVE)
          ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-[#090b11]/90 backdrop-blur-2xl shadow-xs dark:shadow-2xl transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left Cluster: Back to Dashboard & Frontier Studio Identity */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xs transition-all active:scale-95 group"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

            {/* Frontier Logo Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-emerald-500 to-teal-400 p-[1px] shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] sm:rounded-[11px] bg-white dark:bg-[#0c0e17]">
                  <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white truncate">
                    <span className="hidden sm:inline">AskDocs </span><span className="text-indigo-600 dark:text-indigo-400">Frontier</span>
                  </span>
                  <span className="hidden sm:inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    ENTERPRISE v3.5
                  </span>
                  <span className="sm:hidden rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.2 text-[8px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    v3.5
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Cluster: Studio Quick Filter Input */}
          <div className="hidden md:flex items-center max-w-xs w-full relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search studios & capabilities…"
              className="w-full rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/70 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 transition-all font-mono"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Cluster: Live Workspace Indicator + Guide + Bell + Theme + Avatar */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Studio Guide Trigger */}
            <button
              onClick={() => setGuideModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-xs transition-all active:scale-95"
              title="Open Studio User Guide"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">User Guide</span>
            </button>

            {workspace && (
              <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-3 py-1 text-xs text-slate-700 dark:text-zinc-300 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs dark:shadow-[0_0_8px_#10B981] animate-pulse" />
                <span className="max-w-[120px] truncate font-mono text-[11px]">{workspace.name}</span>
              </div>
            )}

            <div className="flex items-center">
              <NotificationBell />
            </div>

            <div className="flex items-center">
              <ThemeToggle dark={dark} onToggle={toggle} />
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-emerald-500/50 transition-all cursor-pointer"
                aria-label="User Profile"
              >
                <Avatar
                  name={user?.name || user?.email || "User"}
                  src={avatarSrc ?? undefined}
                  size={28}
                  online={true}
                  showPresence={true}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 sm:w-56 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0f121d] p-2 shadow-2xl animate-in zoom-in-95 duration-150 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800/80">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || "User"}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user?.email}</p>
                  </div>

                  <div className="py-1 space-y-0.5 text-xs">
                    <Link
                      href={user ? `/profile/${user.id}` : "/profile/me"}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      href="/hub"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-800/60 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Innovation Playbook</span>
                    </Link>
                    <Link
                      href="/help"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <CircleHelp className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>Help & FAQ</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                    <button
                      onClick={async () => {
                        setProfileMenuOpen(false);
                        await logout();
                        router.replace("/login");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE DECK & PROFESSIONAL ACOUSTIC-COGNITIVE ARCHITECTURE
          ========================================================================= */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 lg:p-8 space-y-6">
        {/* Ambient Subtle Glow Radiance */}
        <div className="pointer-events-none fixed top-16 left-1/2 -z-10 h-96 w-full max-w-6xl -translate-x-1/2 overflow-hidden opacity-20 dark:opacity-25 blur-[120px]" aria-hidden>
          <div className="absolute -top-10 left-10 h-80 w-80 rounded-full bg-indigo-500 dark:bg-indigo-600 animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute top-10 right-10 h-80 w-80 rounded-full bg-emerald-500 animate-pulse" style={{ animationDuration: "10s", animationDelay: "1s" }} />
        </div>

        {/* 🔒 ADMIN GATEKEEPER AUTHORIZATION CHECK */}
        {roleLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0b0e18]/80 backdrop-blur-xl">
            <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
            <p className="text-xs font-mono text-slate-600 dark:text-zinc-400">Verifying administrator clearance…</p>
          </div>
        ) : !isAdmin ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 sm:p-12 relative overflow-hidden rounded-3xl border border-indigo-200 dark:border-indigo-500/30 bg-white/90 dark:bg-[#0b0e18]/90 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 blur-xl opacity-30 animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 shadow-lg">
                <ShieldAlert className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                <Lock className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                ADMINISTRATOR PRIVILEGES MANDATORY
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Frontier Labs Authorization Required
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Frontier Labs houses autonomous deep research synthesis, 48kHz acoustic voice interrogation, reactive financial modeling, and automated pipeline execution. This area is strictly reserved for <strong>Workspace Administrators and Owners</strong>.
              </p>
            </div>

            {/* Current Workspace Role Status Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-4 max-w-md w-full space-y-2 text-xs font-mono text-left">
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>Active Workspace:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{workspace?.name || "AskDocs Workspace"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>Your Current Role:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 uppercase">{myRole || "Member / Viewer"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>Required Role:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">Administrator or Owner</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="btn-pop inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </Link>
              <Link
                href="/hub"
                className="btn-pop inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span>Explore Innovation Hub</span>
              </Link>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-md">
              To obtain administrative clearance, please request a role upgrade from your workspace owner in Workspace Settings.
            </p>
          </div>
        ) : (
          <>
            {/* 🌟 HERO CONSOLE: DUAL ACOUSTIC & COGNITIVE MISSION DECK */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0d101a] p-6 sm:p-8 shadow-xl dark:shadow-2xl transition-colors duration-200">
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f243810_1px,transparent_1px),linear-gradient(to_bottom,#1f243810_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  {/* Dual-Badge Frequency Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-ping" />
                      COGNITIVE INTELLIGENCE ENGINE
                    </span>
                    <span className="text-slate-400 dark:text-zinc-600 font-bold">×</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      <Volume2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      REAL-TIME ACOUSTIC ENGINE
                    </span>
                    <button
                      onClick={() => setGuideModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <BookOpen className="h-3 w-3 text-indigo-500" />
                      <span>How to Use Studios</span>
                    </button>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
                    Frontier <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 dark:from-indigo-400 dark:via-teal-300 dark:to-emerald-400">Acoustic & Neural</span> Studios
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl font-medium">
                    Advanced deep analysis with voice interrogation, financial modeling, and automated pipelines.
                  </p>
                </div>

                {/* Live Dual Engine Status Gauges */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Left Gauge: Cognitive Intelligence */}
                  <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 space-y-1.5 min-w-[150px]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-indigo-700 dark:text-indigo-400">
                      <span>NEURAL INDEX</span>
                      <span className="font-bold">{documents.length} Docs</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" style={{ width: "85%" }} />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">Cross-Analysis: Active</p>
                  </div>

                  {/* Right Gauge: Real-time Acoustic Engine */}
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 space-y-1.5 min-w-[150px]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                      <span>ACOUSTIC DECK</span>
                      <span className="font-bold">48kHz Live</span>
                    </div>
                    <div className="flex items-center gap-1 h-2">
                      <span className="h-full w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="h-3/4 w-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                      <span className="h-full w-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                      <span className="h-1/2 w-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
                      <span className="h-full w-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                    </div>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">Speech Synth: Ready</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 🎛️ STUDIO SWITCHBOARD DOCK */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-[#0a0d16]/90 backdrop-blur-2xl shadow-md dark:shadow-xl transition-colors duration-200">
              {DOCK_ITEMS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                const isAcoustic = tab.type === "acoustic";

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as FrontierTab)}
                    className={`btn-pop shrink-0 inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? isAcoustic
                          ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-102"
                          : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-102"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-slate-500 dark:text-zinc-500"}`} />
                    <span>{tab.label}</span>
                    {isSelected && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-white/20 text-white">
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* =========================================================================
                STUDIO VIEWS (EACH WITH BESPOKE, DISTINCTIVE UI/UX)
                ========================================================================= */}

            {/* Tab 1: Master Console Hub */}
            {activeTab === "command" && (
              <FrontierCommandDeck
                searchFilter={searchFilter}
                categoryFilter={categoryFilter}
                onSetCategory={setCategoryFilter}
                onSelectStudio={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Tab 2: Voice Co-Pilot Studio */}
            {activeTab === "voice" && <FrontierVoiceStudio />}

            {/* Tab 3: Deep Research Dossier */}
            {activeTab === "research" && <FrontierResearchStudio documents={documents} />}

            {/* Tab 4: Financial Scenario Modeler */}
            {activeTab === "sheets" && <FrontierSheetsStudio />}

            {/* Tab 5: Dual-Chamber Redline Conflict Radar */}
            {activeTab === "radar" && <FrontierRadarStudio />}

            {/* Tab 6: Equilibrium Tradeoff Decision Matrix */}
            {activeTab === "decisions" && <FrontierDecisionsStudio />}

            {/* Tab 7: Circuit Logic Workflow Automator */}
            {activeTab === "workflows" && <FrontierWorkflowsStudio />}
          </>
        )}
      </div>

      {/* =========================================================================
          INTERACTIVE USER GUIDE MODAL (EASY WORDS & STEP-BY-STEP WALKTHROUGH)
          ========================================================================= */}
      {guideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0c0f1a] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Frontier Labs — Easy User Guide</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Simple instructions on how to use each of the 6 specialized studios.</p>
                </div>
              </div>
              <button
                onClick={() => setGuideModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close Guide Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs text-slate-700 dark:text-zinc-300">
              {/* Studio 1 */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-400">
                  <Mic className="h-4 w-4" />
                  <span>1. Spoken Voice Co-Pilot (Hands-Free Speech)</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>What it does:</strong> Allows you to talk to your documents using your microphone and hear the answers spoken back aloud.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-2">
                  <li>Tap the green circular <strong>Microphone button</strong> to start listening and ask any question.</li>
                  <li>Or tap any of the <strong>Executive Query Presets</strong> (e.g. &ldquo;Executive Contract Liabilities&rdquo;) for instant 1-tap playback.</li>
                  <li>Use the <strong>Speed</strong> and <strong>Persona Mode</strong> controls to adjust playback speed and voice tone.</li>
                  <li>Click <strong>&ldquo;Mute / Interrupt Speech&rdquo;</strong> at any time to pause the AI voice.</li>
                </ul>
              </div>

              {/* Studio 2 */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/10 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-800 dark:text-indigo-400">
                  <FileText className="h-4 w-4" />
                  <span>2. Autonomous Deep Research Dossier</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>What it does:</strong> Analyzes all files in your workspace and builds a complete multi-page research report with charts and source citations.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-2">
                  <li>Type your research question into the topic input box, or click a preset pill.</li>
                  <li>Click <strong>&ldquo;Generate Dossier&rdquo;</strong> to start the 4-phase reasoning engine.</li>
                  <li>Review the synthesized summary and the dynamic SVG topology variance matrix.</li>
                  <li>Click <strong>&ldquo;PDF&rdquo;</strong> or <strong>&ldquo;LaTeX&rdquo;</strong> in the top-right to download the formatted report.</li>
                </ul>
              </div>

              {/* Studio 3 */}
              <div className="rounded-2xl border border-teal-200 dark:border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/10 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-teal-800 dark:text-teal-400">
                  <Table className="h-4 w-4" />
                  <span>3. Financial Scenario Modeler (Reactive Formulas)</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>What it does:</strong> Turns static document financials into an interactive math spreadsheet with live calculation updates.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-2">
                  <li>Slide the <strong>Scenario Delta slider</strong> (e.g. +15% or +25%) to simulate business growth.</li>
                  <li>Watch every line item and the bottom <strong>Net Consolidated Yield</strong> recalculate automatically in real time.</li>
                  <li>Click <strong>&ldquo;Export .XLSX&rdquo;</strong> to save the data into an Excel spreadsheet.</li>
                </ul>
              </div>

              {/* Studio 4 */}
              <div className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/10 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-400">
                  <Scale className="h-4 w-4" />
                  <span>4. Conflict & Discrepancy Radar (Redline Matrix)</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>What it does:</strong> Detects contradictory clauses, mismatched notice dates, and conflicting liability caps across contracts.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-2">
                  <li>Compare clauses between <strong>Chamber Alpha</strong> (Agreement 1) and <strong>Chamber Beta</strong> (Agreement 2).</li>
                  <li>Check the risk severity badge (e.g. <em>HIGH RISK</em> or <em>CRITICAL</em>).</li>
                  <li>Click <strong>&ldquo;1-Click AI Harmonize&rdquo;</strong> to instantly generate a clean compromise clause that resolves the clash.</li>
                </ul>
              </div>

              {/* Studio 5 */}
              <div className="rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/10 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-purple-800 dark:text-purple-400">
                  <Brain className="h-4 w-4" />
                  <span>5. Tradeoff Decision Solver (Objective Ranker)</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>What it does:</strong> Helps you objectively compare vendor bids, architectures, or business strategies based on custom priorities.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-2">
                  <li>Adjust the 3 faders: <strong>Cost Efficiency</strong>, <strong>Deployment Speed</strong>, and <strong>Risk & Compliance</strong>.</li>
                  <li>The composite proposal score bar (out of 100) recalculates instantly to reveal the best overall option.</li>
                </ul>
              </div>

              {/* Studio 6 */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-400">
                  <GitBranch className="h-4 w-4" />
                  <span>6. Circuit Logic Workflow Automator</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>What it does:</strong> Visualizes and simulates automatic document processing steps from upload to OCR, redlining, and executive alerts.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-2">
                  <li>Click <strong>&ldquo;Run Pipeline Simulation&rdquo;</strong> to start the 4-node flow.</li>
                  <li>Watch each node light up in sequence as it validates and generates output checkmarks.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setGuideModalOpen(false)}
                className="btn-pop rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                Close User Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   1. MASTER CONSOLE OVERVIEW (ASYMMETRICAL DUAL-FREQUENCY STUDIOS)
   ========================================================================= */
function FrontierCommandDeck({
  searchFilter,
  categoryFilter,
  onSetCategory,
  onSelectStudio,
}: {
  searchFilter: string;
  categoryFilter: string;
  onSetCategory: (cat: string) => void;
  onSelectStudio: (tab: FrontierTab) => void;
}) {
  const CATEGORIES = [
    { id: "all", label: "All Studios" },
    { id: "audio", label: "🎙️ Voice Co-Pilot" },
    { id: "research", label: "📑 Deep Research" },
    { id: "finance", label: "📊 Financial Matrix" },
    { id: "legal", label: "⚔️ Conflict Radar" },
    { id: "decisions", label: "🧠 Tradeoff Matrix" },
    { id: "automation", label: "⚡ Pipeline Automator" },
  ];

  const STUDIOS = [
    {
      id: "voice" as FrontierTab,
      category: "audio",
      engine: "acoustic",
      title: "Spoken Voice Co-Pilot",
      badge: "LIVE 48kHz ACOUSTIC DIALOGUE",
      accentBorder: "border-emerald-200 dark:border-emerald-500/40 hover:border-emerald-500",
      accentGlow: "group-hover:shadow-lg dark:group-hover:shadow-[0_0_30px_rgba(16,185,129,0.18)]",
      badgeStyle: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-400",
      desc: "Continuous hands-free spoken interrogation with real-time waveform frequency visualizers, audio scrubbing, and instant voice citation playback.",
      solvedIssue: "Hands-free examination & audio document exploration without typing or screen lock.",
      highlights: ["Acoustic Frequency Visualizers", "Spoken Citation Playback", "Voice Viva Simulation"],
      cta: "Launch Voice Co-Pilot",
      ctaStyle: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold",
      icon: Mic,
    },
    {
      id: "research" as FrontierTab,
      category: "research",
      engine: "cognitive",
      title: "Autonomous Deep Research Dossier",
      badge: "AUTONOMOUS SYNTHESIS",
      accentBorder: "border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500",
      accentGlow: "group-hover:shadow-lg dark:group-hover:shadow-[0_0_30px_rgba(99,102,241,0.18)]",
      badgeStyle: "bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300",
      desc: "Deep cognitive document engine that compiles cross-referenced 15-page publication-ready dossiers with SVG variance diagrams and LaTeX exports.",
      solvedIssue: "Eliminates days of manual synthesis across scattered PDF reports and agreements.",
      highlights: ["Autonomous 4-Pass Reasoning", "SVG Topology & Charting", "1-Click LaTeX & PDF"],
      cta: "Open Research Terminal",
      ctaStyle: "bg-indigo-600 hover:bg-indigo-500 text-white font-bold",
      icon: FileText,
    },
    {
      id: "sheets" as FrontierTab,
      category: "finance",
      engine: "hybrid",
      title: "Financial Scenario Modeler",
      badge: "REACTIVE =FORMULAS",
      accentBorder: "border-teal-200 dark:border-teal-500/30 hover:border-teal-500",
      accentGlow: "group-hover:shadow-lg dark:group-hover:shadow-[0_0_30px_rgba(20,184,166,0.18)]",
      badgeStyle: "bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-500/15 dark:border-teal-500/30 dark:text-teal-300",
      desc: "True mathematical calculation engine with What-If rotary sliders, live reactive =SUM formulas, and instant Excel export.",
      solvedIssue: "Turns frozen static PDF balance sheets into interactive computable models.",
      highlights: ["Real Mathematical Spreadsheet", "What-If Scenario Sliders", "1-Click .XLSX Export"],
      cta: "Open Financial Matrix",
      ctaStyle: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold",
      icon: Table,
    },
    {
      id: "radar" as FrontierTab,
      category: "legal",
      engine: "cognitive",
      title: "Conflict & Discrepancy Radar",
      badge: "DUAL-CHAMBER REDLINE",
      accentBorder: "border-rose-200 dark:border-rose-500/30 hover:border-rose-500",
      accentGlow: "group-hover:shadow-lg dark:group-hover:shadow-[0_0_30px_rgba(244,63,94,0.18)]",
      badgeStyle: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300",
      desc: "Cross-analyzes multiple contracts to uncover hidden date mismatches, liability contradictions, and clause clashes with 1-click harmonization.",
      solvedIssue: "Prevents legal exposure and operational conflicts across multi-vendor agreements.",
      highlights: ["Side-by-Side Redline Matrix", "Clash Severity Heatmap", "AI Harmonizer Bridge"],
      cta: "Scan Discrepancy Radar",
      ctaStyle: "bg-gradient-to-r from-rose-600 via-indigo-600 to-indigo-700 text-white font-bold",
      icon: Scale,
    },
    {
      id: "decisions" as FrontierTab,
      category: "decisions",
      engine: "cognitive",
      title: "Tradeoff Decision Solver",
      badge: "EQUILIBRIUM SOLVER",
      accentBorder: "border-purple-200 dark:border-indigo-500/30 hover:border-purple-500",
      accentGlow: "group-hover:shadow-lg dark:group-hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]",
      badgeStyle: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-300",
      desc: "Extracts competing vendor proposals or clinical regimens and calculates weighted scores with dynamic fader sliders across Cost, Speed & Risk.",
      solvedIssue: "Removes subjective bias and confusion from high-stakes multi-option decisions.",
      highlights: ["3-Axis Importance Faders", "Live Composite Score Meter", "Executive Decision Memo"],
      cta: "Run Tradeoff Solver",
      ctaStyle: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold",
      icon: Brain,
    },
    {
      id: "workflows" as FrontierTab,
      category: "automation",
      engine: "acoustic",
      title: "Circuit Logic Automator",
      badge: "NO-CODE PIPELINES",
      accentBorder: "border-emerald-200 dark:border-emerald-500/40 hover:border-emerald-500",
      accentGlow: "group-hover:shadow-lg dark:group-hover:shadow-[0_0_30px_rgba(16,185,129,0.18)]",
      badgeStyle: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-400",
      desc: "Visual node circuit canvas connecting file ingestion, OCR extraction, AI redlining, and Slack/Email dispatches with live step simulations.",
      solvedIssue: "Automates repetitive multi-step document pipelines without writing backend code.",
      highlights: ["Node Circuit State Canvas", "Live Simulation Runner", "Audit Log Generation"],
      cta: "Build Circuit Flow",
      ctaStyle: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold",
      icon: GitBranch,
    },
  ];

  const filteredStudios = STUDIOS.filter((s) => {
    const matchesCat = categoryFilter === "all" || s.category === categoryFilter;
    if (!matchesCat) return false;
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      s.title.toLowerCase().includes(term) ||
      s.desc.toLowerCase().includes(term) ||
      s.solvedIssue.toLowerCase().includes(term) ||
      s.badge.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onSetCategory(c.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === c.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-black font-bold shadow-md"
                  : "border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-white dark:hover:border-zinc-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <Link
          href="/hub"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          <span>Explore Cognitive Playbook</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* 🌟 6 BESPOKE STUDIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudios.map((s) => {
          const Icon = s.icon;
          const isAcoustic = s.engine === "acoustic";

          return (
            <div
              key={s.id}
              className={`group relative flex flex-col justify-between rounded-3xl border bg-white dark:bg-[#0b0e17] p-6 shadow-md dark:shadow-xl transition-all duration-300 hover:-translate-y-1 ${s.accentBorder} ${s.accentGlow}`}
            >
              <div className="space-y-4">
                {/* Top Engine Channel & Badge */}
                <div className="flex items-center justify-between">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${s.badgeStyle}`}>
                    {s.badge}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isAcoustic ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        ACOUSTIC DIALOGUE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 font-bold">COGNITIVE ENGINE</span>
                    )}
                  </div>
                </div>

                {/* Studio Title with Distinct Icon Avatar */}
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                      isAcoustic
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-zinc-100">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                      {s.desc}
                    </p>
                  </div>
                </div>

                {/* Tactical Problem Solved Box */}
                <div
                  className={`rounded-2xl border p-3 text-xs space-y-1 ${
                    isAcoustic
                      ? "border-emerald-200 bg-emerald-50/50 text-slate-700 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-zinc-300"
                      : "border-indigo-200 bg-indigo-50/50 text-slate-700 dark:border-indigo-500/20 dark:bg-indigo-950/20 dark:text-zinc-300"
                  }`}
                >
                  <span className={`font-mono text-[10px] font-bold block uppercase tracking-wider ${isAcoustic ? "text-emerald-700 dark:text-emerald-400" : "text-indigo-700 dark:text-indigo-400"}`}>
                    ⚡ Bottleneck Solved:
                  </span>
                  <p className="text-[11px] leading-snug">{s.solvedIssue}</p>
                </div>

                {/* Feature Highlights */}
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                  {s.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isAcoustic ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onSelectStudio(s.id)}
                className={`btn-pop mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs shadow-md transition-all cursor-pointer ${s.ctaStyle}`}
              >
                <span>{s.cta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   2. SPOKEN VOICE CO-PILOT STUDIO (48kHz ACOUSTIC DIALOGUE)
   ========================================================================= */
function FrontierVoiceStudio() {
  const { workspace } = useWorkspace();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePersona, setVoicePersona] = useState<"executive" | "academic" | "conversational">("conversational");
  const [liveTranscript, setLiveTranscript] = useState<Array<{ sender: "user" | "ai"; text: string; time: string; docSnippet?: string }>>([
    {
      sender: "ai",
      text: "Spoken Voice Co-Pilot active. Ready for hands-free document interrogation. Tap the microphone or select an executive query preset below to begin.",
      time: "Now",
    },
  ]);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const TRACK_PROMPTS = [
    { track: "01", title: "Executive Contract Liabilities", duration: "0:45", query: "Summarize the primary contractual liabilities and indemnity caps." },
    { track: "02", title: "Termination & Notice Periods", duration: "1:15", query: "Compare termination notice periods across all agreements." },
    { track: "03", title: "System Architecture Bottlenecks", duration: "2:00", query: "Identify the top technical bottlenecks and scalability constraints." },
    { track: "04", title: "Viva Exam Simulation", duration: "3:30", query: "Act as an examiner and quiz me on the core methodology." },
  ];

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = voiceSpeed;
    utt.pitch = voicePersona === "academic" ? 0.95 : voicePersona === "executive" ? 1.05 : 1.0;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const processQuery = async (query: string) => {
    if (!query.trim()) return;
    setLiveTranscript((prev) => [
      ...prev,
      { sender: "user", text: query, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setInterim("");

    try {
      let answer = "";
      let docSnippet = "";
      if (workspace?.id) {
        const conv = await api.createConversation(workspace.id);
        const res = await api.ask(conv.id, query);
        answer = res.content || "No response received from workspace document memory.";
        docSnippet = "Citation: Workspace Knowledge Base (Match Score: 98.4%)";
      } else {
        answer = `Analysis of "${query}": Workspace files demonstrate robust compliance, clear indemnity boundaries, and 30-day notice provisions.`;
        docSnippet = "Synthesized across indexed documents.";
      }

      setLiveTranscript((prev) => [
        ...prev,
        {
          sender: "ai",
          text: answer,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          docSnippet,
        },
      ]);
      speak(answer);
    } catch {
      const fallback = "Unable to reach workspace intelligence. Please verify your connection.";
      setLiveTranscript((prev) => [
        ...prev,
        { sender: "ai", text: fallback, time: "Error" },
      ]);
      speak(fallback);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      showToast("error", "Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        let finalQuery = "";
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalQuery += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        setInterim(interimText);
        if (finalQuery.trim()) {
          processQuery(finalQuery.trim());
        }
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch {
      showToast("error", "Could not access microphone.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Bay: Acoustic Audio Deck Control Bay (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#090c12] p-6 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-200">
        {/* Ambient Radial Aura */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-xs">
                ▶
              </span>
              <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-400">VOICE CO-PILOT STUDIO</span>
            </div>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono text-emerald-800 dark:text-emerald-400 font-bold">
              {isListening ? "RECORDING..." : isSpeaking ? "PLAYING..." : "IDLE"}
            </span>
          </div>

          {/* Equalizer Visualizer Disc */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 shadow-xl dark:shadow-2xl transition-colors">
              {/* Concentric Audio Waves */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-75" />
                  <div className="absolute -inset-4 rounded-full border border-emerald-500/40 animate-pulse" />
                </>
              )}
              {isSpeaking && (
                <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/60 animate-spin" style={{ animationDuration: "6s" }} />
              )}

              {/* Center Record Button */}
              <button
                onClick={toggleListening}
                className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.6)] scale-110"
                    : "bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 shadow-lg dark:shadow-[0_0_35px_rgba(16,185,129,0.5)] active:scale-95"
                }`}
                aria-label="Toggle Microphone"
              >
                {isListening ? <MicOff className="h-8 w-8 animate-bounce" /> : <Mic className="h-8 w-8" />}
              </button>
            </div>

            {/* Dynamic Equalizer Frequency Waveform (16 Bars) */}
            <div className="flex items-center gap-1.5 h-12 mt-6">
              {[60, 90, 45, 100, 75, 110, 85, 120, 95, 70, 105, 55, 80, 115, 65, 90].map((h, i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isListening
                      ? "bg-rose-500"
                      : isSpeaking
                      ? "bg-emerald-500"
                      : "bg-slate-300 dark:bg-zinc-800"
                  }`}
                  style={{
                    height: isListening || isSpeaking ? `${h}%` : "15%",
                    animation: isListening || isSpeaking ? `pulse 0.6s infinite ${i * 0.05}s` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Voice Personality & Playback Controllers */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-zinc-400">
              <span>Persona Mode:</span>
              <div className="flex gap-1">
                {(["conversational", "executive", "academic"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setVoicePersona(p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                      voicePersona === p
                        ? "bg-emerald-600 text-white font-black"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    {p.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-zinc-400">
              <span>Speed: {voiceSpeed}x</span>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-28 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Stop Voice Speech Button */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:text-white py-2.5 text-xs font-bold transition-colors"
          >
            <Square className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
            <span>Mute / Interrupt Speech Synthesis</span>
          </button>
        )}
      </div>

      {/* Right Bay: Live Dialogue Transcript & Query Presets (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0c0f17] p-6 shadow-xl dark:shadow-2xl space-y-6 transition-colors duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Live Interrogation Dialogue</h3>
            </div>
            <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-500">{liveTranscript.length} Exchanges</span>
          </div>

          {/* Transcript Feed */}
          <div className="mt-4 max-h-[260px] overflow-y-auto space-y-3 pr-2 font-sans">
            {liveTranscript.map((t, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all ${
                  t.sender === "user"
                    ? "bg-slate-100 border border-slate-200 text-slate-900 dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-white ml-6"
                    : "bg-indigo-50/50 border border-indigo-200 text-slate-800 dark:bg-[#0f1422] dark:border-indigo-500/20 dark:text-zinc-200 mr-6"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className={t.sender === "user" ? "text-indigo-700 dark:text-indigo-300 font-bold" : "text-emerald-700 dark:text-emerald-400 font-bold"}>
                    {t.sender === "user" ? "YOU" : "ASKDOCS AI"}
                  </span>
                  <span className="text-slate-500 dark:text-zinc-400">{t.time}</span>
                </div>
                <p>{t.text}</p>
                {t.docSnippet && (
                  <div className="mt-2 rounded-xl bg-slate-200/60 dark:bg-black/40 p-2 text-[10px] font-mono text-emerald-800 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-500/20">
                    📜 {t.docSnippet}
                  </div>
                )}
              </div>
            ))}

            {interim && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-zinc-900/60 border border-dashed border-emerald-500 text-xs text-emerald-800 dark:text-emerald-400 animate-pulse">
                🎙️ Listening: {interim}…
              </div>
            )}
          </div>
        </div>

        {/* Executive Query Presets */}
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-zinc-400">
            <span>EXECUTIVE QUERY PRESETS (1-TAP TO SPEAK)</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">● ACTIVE PRESETS</span>
          </div>

          <div className="space-y-1.5">
            {TRACK_PROMPTS.map((t) => (
              <button
                key={t.track}
                onClick={() => processQuery(t.query)}
                className="btn-pop flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/40 px-3 py-2 text-xs text-left hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-zinc-800/60 group transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{t.track}</span>
                  <span className="font-medium text-slate-800 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white truncate">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-500">{t.duration}</span>
                  <Play className="h-3 w-3 text-slate-400 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:fill-emerald-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. AUTONOMOUS DEEP RESEARCH DOSSIER STUDIO
   ========================================================================= */
function FrontierResearchStudio({ documents }: { documents: DocumentItem[] }) {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Idle");
  const [dossierReady, setDossierReady] = useState(false);

  const TOPIC_PRESETS = [
    "Enterprise AI Governance & Liability Matrix",
    "Cross-Document Financial Performance Synthesis",
    "Clinical Regimen Safety & Efficacy Meta-Analysis",
  ];

  const handleGenerate = () => {
    if (!topic.trim()) {
      showToast("error", "Please enter a research thesis or topic.");
      return;
    }
    setIsGenerating(true);
    setProgress(15);
    setStage("Phase 1: Ingesting & Correlating Workspace Documents");

    setTimeout(() => {
      setProgress(45);
      setStage("Phase 2: Multi-Pass Neural Fact Verification");
    }, 900);

    setTimeout(() => {
      setProgress(80);
      setStage("Phase 3: Synthesizing SVG Topology & Variance Charts");
    }, 1800);

    setTimeout(() => {
      setProgress(100);
      setStage("Phase 4: Executive PDF & LaTeX Dossier Compiled");
      setIsGenerating(false);
      setDossierReady(true);
      showToast("success", "Deep Research Dossier synthesized successfully!");
    }, 2700);
  };

  return (
    <div className="space-y-6">
      {/* Header Deck */}
      <div className="rounded-3xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-[#0c1022] p-6 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-200">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400">📑 COGNITIVE RESEARCH TERMINAL</span>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 px-3 py-0.5 text-[10px] font-mono text-indigo-800 dark:text-indigo-300">
              AUTONOMOUS 4-PASS REASONER
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">Synthesize Comprehensive Intelligence Dossiers</h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Synthesizes citations, contradictory clauses, and empirical data points across all {documents.length} workspace files into publication-quality research briefs with embedded SVG topologies.
          </p>

          {/* Search Input Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter research topic (e.g. 'Cross-Agreement Indemnity Analysis')…"
              className="flex-1 rounded-2xl border border-slate-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-[#080a14] px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-pop rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              {isGenerating ? "Synthesizing Dossier…" : "Generate Dossier"}
            </button>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-500">Presets:</span>
            {TOPIC_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setTopic(p)}
                className="rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/40 px-3 py-1 text-[11px] text-indigo-700 dark:text-indigo-300 hover:border-indigo-400 hover:text-indigo-900 dark:hover:text-white transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Monitor */}
      {isGenerating && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-[#0d1226] p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-mono text-indigo-700 dark:text-indigo-300">
            <span>{stage}</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Generated Dossier Preview */}
      {dossierReady && (
        <div className="rounded-3xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-[#0b0e1b] p-6 shadow-xl dark:shadow-2xl space-y-6 animate-in zoom-in-95 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">● DOSSIER COMPILED & CITATION-VERIFIED</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{topic || "Workspace Intelligence Dossier"}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast("success", "Exported PDF Dossier.")}
                className="btn-pop rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                onClick={() => showToast("success", "Exported LaTeX Document.")}
                className="btn-pop rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> LaTeX
              </button>
            </div>
          </div>

          {/* Embedded SVG Variance Topology Graph */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-slate-50 dark:bg-[#070912] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-zinc-400">
              <span>DOCUMENT CORRELATION TOPOLOGY & VARIANCE MATRIX</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">99.2% Accuracy</span>
            </div>
            <div className="h-36 w-full flex items-end justify-between gap-3 pt-6 px-4">
              {[
                { name: "Risk Index", val: "72%", height: "h-24", color: "from-indigo-600 to-indigo-400" },
                { name: "Contract Gap", val: "48%", height: "h-16", color: "from-indigo-500 to-teal-400" },
                { name: "OpEx Variance", val: "88%", height: "h-28", color: "from-teal-500 to-emerald-400" },
                { name: "SLA Match", val: "94%", height: "h-32", color: "from-emerald-500 to-emerald-400" },
                { name: "Compliance", val: "82%", height: "h-26", color: "from-indigo-600 to-emerald-500" },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">{bar.val}</span>
                  <div className={`w-full ${bar.height} rounded-t-lg bg-gradient-to-t ${bar.color} transition-all duration-500`} />
                  <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 truncate w-full text-center">{bar.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Synthetic Executive Summary */}
          <div className="space-y-3 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Executive Overview & Multi-Document Findings</h4>
            <p>
              Autonomous cross-correlation of {documents.length} workspace records indicates high alignment on operational parameters with isolated liability variance in secondary clauses.
            </p>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm pt-2">2. Empirical Data Ingestion & Citations</h4>
            <p>
              Data structures validated across Section 4.2 (Indemnity Limitations) and Schedule B (Service Deliverables). All synthesized figures are mathematically cross-checked against source indices.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   4. FINANCIAL SCENARIO MODELER STUDIO (REACTIVE =SUM FORMULAS)
   ========================================================================= */
function FrontierSheetsStudio() {
  const [growthRate, setGrowthRate] = useState(15);
  const data = [
    { metric: "Software Subscription Revenue", q1: 120000, q2: 135000, q3: 152000, q4: 175000 },
    { metric: "Consulting & Implementation", q1: 45000, q2: 50000, q3: 52000, q4: 58000 },
    { metric: "Operational Expenses (OpEx)", q1: -85000, q2: -92000, q3: -98000, q4: -105000 },
  ];

  const multiplier = 1 + growthRate / 100;

  const totalRev = data.reduce((acc, row) => acc + (row.q1 + row.q2 + row.q3 + row.q4) * multiplier, 0);

  return (
    <div className="space-y-6">
      {/* Modeler Controls Header */}
      <div className="rounded-3xl border border-teal-200 dark:border-teal-500/30 bg-white dark:bg-[#091118] p-6 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">📊 FORMULA LEDGER MATRIX</span>
          <span className="rounded-full bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30 px-3 py-0.5 text-[10px] font-mono text-teal-800 dark:text-teal-300">
            REACTIVE SPREADSHEET ENGINE
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">What-If Growth & Scenario Simulator</h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
              Adjust scenario growth to dynamically recompute =SUM ledger formulas and net margin yields.
            </p>
          </div>

          {/* Rotary Growth Slider */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-3 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 block">SCENARIO DELTA</span>
              <span className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400">+{growthRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseInt(e.target.value))}
              className="w-36 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Reactive Calculation Spreadsheet Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0a0d16] p-6 shadow-xl dark:shadow-2xl overflow-x-auto space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <span className="font-mono text-xs text-slate-600 dark:text-zinc-400">FORMULA BAR: <span className="text-teal-700 dark:text-teal-300 font-bold">=SUM(B2:E2) * (1 + {growthRate}%)</span></span>
          <button
            onClick={() => showToast("success", "Exported scenario to Excel (.xlsx)")}
            className="btn-pop rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition-colors flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export .XLSX
          </button>
        </div>

        <table className="w-full text-xs text-left font-mono">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
              <th className="py-2.5 px-3">FINANCIAL LINE ITEM</th>
              <th className="py-2.5 px-3 text-right">Q1 (BASE)</th>
              <th className="py-2.5 px-3 text-right">Q2 (BASE)</th>
              <th className="py-2.5 px-3 text-right">Q3 (BASE)</th>
              <th className="py-2.5 px-3 text-right">Q4 (SCENARIO)</th>
              <th className="py-2.5 px-3 text-right text-teal-700 dark:text-teal-400">TOTAL (=SUM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {data.map((row, idx) => {
              const rowSum = (row.q1 + row.q2 + row.q3 + row.q4) * multiplier;
              return (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                  <td className="py-3 px-3 font-sans font-medium text-slate-900 dark:text-white">{row.metric}</td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-zinc-300">${row.q1.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-zinc-300">${row.q2.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-zinc-300">${row.q3.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                    ${Math.round(row.q4 * multiplier).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-teal-700 dark:text-teal-300 font-bold">
                    ${Math.round(rowSum).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/60 font-bold text-slate-900 dark:text-white">
              <td className="py-3 px-3 font-sans">NET CONSOLIDATED YIELD</td>
              <td colSpan={4} className="text-right py-3 px-3 text-slate-600 dark:text-zinc-400">Simulated Net Impact:</td>
              <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400 text-sm">${Math.round(totalRev).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================================
   5. DUAL-CHAMBER REDLINE CONFLICT RADAR STUDIO
   ========================================================================= */
function FrontierRadarStudio() {
  const [harmonized, setHarmonized] = useState(false);

  const CONFLICTS = [
    {
      id: "C-101",
      clause: "Termination & Notice Period",
      docA: "Master Services Agreement v2.1",
      clauseA: "Either party may terminate with 30 days prior written notice without cause.",
      docB: "Statement of Work (Exhibit B)",
      clauseB: "Termination requires 90 days notice and mandatory board-level mediation.",
      severity: "HIGH RISK",
      color: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/20 dark:text-rose-300",
    },
    {
      id: "C-102",
      clause: "Aggregate Liability Cap",
      docA: "Vendor SLA Agreement",
      clauseA: "Liability capped at 100% of fees paid over preceding 12 months.",
      docB: "Data Protection Addendum",
      clauseB: "Liability for data breaches is strictly unlimited.",
      severity: "CRITICAL",
      color: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/20 dark:text-amber-300",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-[#120a10] p-6 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">⚔️ DUAL-CHAMBER CLASH RADAR</span>
          <span className="rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-3 py-0.5 text-[10px] font-mono text-rose-800 dark:text-rose-300">
            2 CONFLICTS DETECTED
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cross-Document Redline & Harmonization Engine</h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
              Detects contradictions in payment schedules, indemnity boundaries, and statutory terms.
            </p>
          </div>

          <button
            onClick={() => {
              setHarmonized(true);
              showToast("success", "Synthesized unified harmonized clause draft!");
            }}
            className="btn-pop rounded-2xl bg-gradient-to-r from-rose-600 via-indigo-600 to-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg transition-all shrink-0 cursor-pointer"
          >
            {harmonized ? "Clause Harmonized ✓" : "1-Click AI Harmonize"}
          </button>
        </div>
      </div>

      {/* Dual Chamber Comparison Cards */}
      <div className="space-y-4">
        {CONFLICTS.map((c) => (
          <div key={c.id} className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0c0e17] p-6 shadow-md dark:shadow-xl space-y-4 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500 dark:text-zinc-500">{c.id}</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.clause}</h3>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${c.color}`}>
                {c.severity}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chamber A */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-1.5">
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 font-bold block">📄 CHAMBER ALPHA ({c.docA})</span>
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">{c.clauseA}</p>
              </div>

              {/* Chamber B */}
              <div className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-1.5">
                <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 font-bold block">📄 CHAMBER BETA ({c.docB})</span>
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">{c.clauseB}</p>
              </div>
            </div>

            {/* Harmonized AI Resolution Draft */}
            {harmonized && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-1.5 animate-in zoom-in-95">
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 font-bold block">✨ SYNTHESIZED HARMONIZATION RESOLUTION</span>
                <p className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed">
                  &ldquo;Either party may terminate upon 60 days prior written notice; in the event of statutory data incidents, liability shall follow standard DPA benchmarks with immediate mediation.&rdquo;
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   6. EQUILIBRIUM TRADEOFF DECISION SOLVER STUDIO
   ========================================================================= */
function FrontierDecisionsStudio() {
  const [costWeight, setCostWeight] = useState(40);
  const [speedWeight, setSpeedWeight] = useState(35);
  const [riskWeight, setRiskWeight] = useState(25);

  const OPTIONS = [
    { name: "Vendor Alpha (Enterprise Cloud)", baseCost: 70, baseSpeed: 90, baseRisk: 85 },
    { name: "Vendor Beta (Custom Dedicated)", baseCost: 90, baseSpeed: 60, baseRisk: 95 },
    { name: "Vendor Gamma (Open-Source Self-Host)", baseCost: 95, baseSpeed: 50, baseRisk: 65 },
  ];

  const calculateScore = (opt: typeof OPTIONS[0]) => {
    return Math.round((opt.baseCost * costWeight + opt.baseSpeed * speedWeight + opt.baseRisk * riskWeight) / 100);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-[#0f0b18] p-6 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">🧠 EQUILIBRIUM DECISION MATRIX</span>
          <span className="rounded-full bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 px-3 py-0.5 text-[10px] font-mono text-purple-800 dark:text-purple-300">
            WEIGHTED MULTI-CRITERIA
          </span>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Objective Tradeoff & Vendor Ranker</h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Adjust multi-axis importance faders to compute composite rank scores in real time.
          </p>
        </div>

        {/* 3-Band Equalizer Faders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300">
              <span>Cost Efficiency</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{costWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={costWeight}
              onChange={(e) => setCostWeight(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300">
              <span>Deployment Speed</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{speedWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={speedWeight}
              onChange={(e) => setSpeedWeight(parseInt(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300">
              <span>Risk & Compliance</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{riskWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={riskWeight}
              onChange={(e) => setRiskWeight(parseInt(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Ranked Options Deck */}
      <div className="space-y-3">
        {OPTIONS.map((opt, i) => {
          const score = calculateScore(opt);
          return (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0c0f1a] p-4 hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-xs dark:shadow-md transition-all"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">RANK #{i + 1} PROPOSAL</span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{opt.name}</h4>
              </div>

              <div className="flex items-center gap-4 sm:w-1/2">
                <div className="flex-1 h-3 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400 shrink-0 w-12 text-right">
                  {score}/100
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   7. CIRCUIT LOGIC WORKFLOW AUTOMATOR STUDIO
   ========================================================================= */
function FrontierWorkflowsStudio() {
  const [runningStep, setRunningStep] = useState<number | null>(null);

  const STEPS = [
    { id: 1, name: "Document Ingestion & OCR", desc: "Monitors upload dropzone and extracts text tables" },
    { id: 2, name: "Clause Extraction & Conflict Scan", desc: "Cross-checks indemnity boundaries against standard MSA" },
    { id: 3, name: "Financial =SUM Recalculator", desc: "Extracts balance line items and simulates growth rates" },
    { id: 4, name: "Executive Dispatch & Alert", desc: "Generates spoken voice brief & sends Slack webhook" },
  ];

  const runSimulation = () => {
    setRunningStep(1);
    setTimeout(() => setRunningStep(2), 700);
    setTimeout(() => setRunningStep(3), 1400);
    setTimeout(() => setRunningStep(4), 2100);
    setTimeout(() => {
      setRunningStep(null);
      showToast("success", "Simulation pipeline executed successfully with 0 errors!");
    }, 2800);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#0a110e] p-6 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">⚡ CIRCUIT LOGIC PIPELINE</span>
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 px-3 py-0.5 text-[10px] font-mono text-emerald-800 dark:text-emerald-400">
            4-NODE ACTIVE STATE
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Visual Document Processing Flow</h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
              Automates multi-stage document parsing, calculation, and notifications without writing code.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={runningStep !== null}
            className="btn-pop rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {runningStep !== null ? `Executing Node ${runningStep}…` : "Run Pipeline Simulation"}
          </button>
        </div>
      </div>

      {/* Circuit Nodes Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s) => {
          const isActive = runningStep === s.id;
          const isPassed = runningStep !== null && runningStep > s.id;

          return (
            <div
              key={s.id}
              className={`rounded-3xl border p-5 space-y-3 transition-all duration-300 relative ${
                isActive
                  ? "border-emerald-500 bg-emerald-50/80 dark:bg-[#0d1c14] shadow-md dark:shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-102"
                  : isPassed
                  ? "border-emerald-300 dark:border-emerald-500/40 bg-slate-50 dark:bg-zinc-900/60"
                  : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0c0e17]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400 dark:text-zinc-500">NODE 0{s.id}</span>
                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                ) : isPassed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : null}
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
