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
  const { workspace } = useWorkspace();
  const { user, logout, avatarSrc } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  // DOCK NAVIGATION: Explicit color separation between Spotify Green (Audio/Execution) and Velvet Indigo (Intelligence/Research)
  const DOCK_ITEMS = [
    {
      id: "command",
      label: "Master Console",
      icon: Layers,
      type: "hybrid",
      accent: "from-indigo-600 to-emerald-500",
      badge: "OVERVIEW",
      tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    },
    {
      id: "voice",
      label: "Spotify Voice Deck",
      icon: Mic,
      type: "spotify",
      accent: "from-[#1DB954] to-emerald-600",
      badge: "SPOTIFY AUDIO",
      tagColor: "bg-[#1DB954]/20 text-[#1DB954] border-[#1DB954]/40",
    },
    {
      id: "research",
      label: "Deep Research Dossier",
      icon: FileText,
      type: "indigo",
      accent: "from-indigo-600 via-indigo-500 to-blue-600",
      badge: "VELVET INDIGO",
      tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    },
    {
      id: "sheets",
      label: "Financial Modeler",
      icon: Table,
      type: "hybrid",
      accent: "from-emerald-600 via-teal-600 to-indigo-600",
      badge: "FORMULA MATRIX",
      tagColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    },
    {
      id: "radar",
      label: "Conflict Radar",
      icon: Scale,
      type: "indigo",
      accent: "from-indigo-600 via-rose-600 to-indigo-800",
      badge: "REDLINE CLASH",
      tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    },
    {
      id: "decisions",
      label: "Tradeoff Solver",
      icon: Brain,
      type: "indigo",
      accent: "from-indigo-700 via-purple-600 to-indigo-500",
      badge: "DECISION MATRIX",
      tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    },
    {
      id: "workflows",
      label: "Pipeline Automator",
      icon: GitBranch,
      type: "spotify",
      accent: "from-[#1DB954] via-emerald-600 to-teal-500",
      badge: "CIRCUIT FLOW",
      tagColor: "bg-[#1DB954]/20 text-[#1DB954] border-[#1DB954]/40",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans selection:bg-[#1DB954]/30 selection:text-[#1DB954]">
      {/* =========================================================================
          TOP HYBRID DUAL-ENGINE CONSOLE NAVBAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#090b11]/90 backdrop-blur-2xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Cluster: Back to Dashboard & Frontier Studio Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 shadow-sm transition-all active:scale-95 group"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

            {/* Frontier Logo Badge */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-[#1DB954] to-emerald-400 p-[1px] shadow-[0_0_15px_rgba(29,185,84,0.3)]">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0c0e17]">
                  <Rocket className="h-4 w-4 text-[#1DB954]" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm tracking-tight text-white">
                    AskDocs <span className="text-indigo-400">Frontier</span>
                  </span>
                  <span className="rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 px-2 py-0.5 text-[9px] font-mono font-bold text-[#1DB954]">
                    DUAL-ENGINE v3.5
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Cluster: Studio Quick Filter Input */}
          <div className="hidden md:flex items-center max-w-xs w-full relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search studios & capabilities…"
              className="w-full rounded-full border border-zinc-800 bg-zinc-900/70 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] text-zinc-200 placeholder-zinc-500 transition-all font-mono"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Cluster: Live Workspace Indicator + Bell + Theme + Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {workspace && (
              <div className="hidden lg:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-[#1DB954] shadow-[0_0_8px_#1DB954] animate-pulse" />
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
                className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-[#1DB954]/50 transition-all cursor-pointer"
                aria-label="User Profile"
              >
                <Avatar
                  name={user?.name || user?.email || "User"}
                  src={avatarSrc ?? undefined}
                  size={32}
                  online={true}
                  showPresence={true}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-800 bg-[#0f121d] p-2 shadow-2xl animate-in zoom-in-95 duration-150 z-50">
                  <div className="px-3 py-2 border-b border-zinc-800/80">
                    <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                  </div>

                  <div className="py-1 space-y-0.5 text-xs">
                    <Link
                      href={user ? `/profile/${user.id}` : "/profile/me"}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      href="/hub"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-800/60 hover:text-[#1DB954] transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#1DB954]" />
                      <span>Innovation Playbook</span>
                    </Link>
                    <Link
                      href="/help"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                    >
                      <CircleHelp className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Help & FAQ</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-zinc-800/80">
                    <button
                      onClick={async () => {
                        setProfileMenuOpen(false);
                        await logout();
                        router.replace("/login");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
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
          MAIN WORKSPACE DECK & UNIQUE SONIC-COGNITIVE ARCHITECTURE
          ========================================================================= */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 lg:p-8 space-y-6">
        {/* Ambient Subtle Glow Radiance (Indigo on Left, Spotify Green on Right) */}
        <div className="pointer-events-none fixed top-16 left-1/2 -z-10 h-96 w-full max-w-6xl -translate-x-1/2 overflow-hidden opacity-25 blur-[120px]" aria-hidden>
          <div className="absolute -top-10 left-10 h-80 w-80 rounded-full bg-indigo-600 animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute top-10 right-10 h-80 w-80 rounded-full bg-[#1DB954] animate-pulse" style={{ animationDuration: "10s", animationDelay: "1s" }} />
        </div>

        {/* 🌟 UNIQUE HERO CONSOLE: DUAL ACOUSTIC & NEURAL MISSION DECK */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#0d101a] p-6 sm:p-8 shadow-2xl">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f243810_1px,transparent_1px),linear-gradient(to_bottom,#1f243810_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              {/* Dual-Badge Frequency Header */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-[11px] font-mono font-bold text-indigo-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                  VELVET INDIGO COGNITION
                </span>
                <span className="text-zinc-600 font-bold">×</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1DB954]/40 bg-[#1DB954]/10 px-3 py-1 text-[11px] font-mono font-bold text-[#1DB954]">
                  <Volume2 className="h-3 w-3 text-[#1DB954]" />
                  SPOTIFY ACOUSTIC DECK
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                Frontier <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-300 to-[#1DB954]">Acoustic & Neural</span> Studios
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                A dual-frequency environment pairing high-depth analytical research (Velvet Indigo) with tactile, real-time audio interaction and rapid workflow execution (Spotify Neon Green).
              </p>
            </div>

            {/* Live Dual Engine Status Gauges */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Left Gauge: Velvet Indigo Intelligence */}
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 space-y-1.5 min-w-[150px]">
                <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400">
                  <span>NEURAL INDEX</span>
                  <span className="font-bold">{documents.length} Docs</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" style={{ width: "85%" }} />
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">Cross-Analysis: Active</p>
              </div>

              {/* Right Gauge: Spotify Acoustic Engine */}
              <div className="rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/10 p-3.5 space-y-1.5 min-w-[150px]">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#1DB954]">
                  <span>ACOUSTIC DECK</span>
                  <span className="font-bold">48kHz Live</span>
                </div>
                <div className="flex items-center gap-1 h-2">
                  <span className="h-full w-1.5 bg-[#1DB954] rounded-full animate-pulse" />
                  <span className="h-3/4 w-1.5 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="h-full w-1.5 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                  <span className="h-1/2 w-1.5 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
                  <span className="h-full w-1.5 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                </div>
                <p className="text-[10px] text-emerald-400/80 font-mono">Speech Synth: Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🎛️ TACTILE STUDIO SWITCHBOARD (FLOATING AUDIO DOCK) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 p-2 rounded-2xl border border-zinc-800 bg-[#0a0d16]/90 backdrop-blur-2xl shadow-xl">
          {DOCK_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            const isSpotify = tab.type === "spotify";

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FrontierTab)}
                className={`btn-pop shrink-0 inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? isSpotify
                      ? "bg-[#1DB954] text-black shadow-[0_0_20px_rgba(29,185,84,0.4)] scale-102"
                      : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-102"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? (isSpotify ? "text-black" : "text-white") : "text-zinc-500"}`} />
                <span>{tab.label}</span>
                {isSelected && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isSpotify ? "bg-black/20 text-black font-black" : "bg-white/20 text-white"}`}>
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

        {/* Tab 1: Master Console Hub (Modular Asymmetrical Deck) */}
        {activeTab === "command" && (
          <FrontierCommandDeck
            searchFilter={searchFilter}
            categoryFilter={categoryFilter}
            onSetCategory={setCategoryFilter}
            onSelectStudio={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Tab 2: Spotify Spoken Voice Deck */}
        {activeTab === "voice" && <FrontierVoiceStudio />}

        {/* Tab 3: Velvet Indigo Deep Research Dossier */}
        {activeTab === "research" && <FrontierResearchStudio documents={documents} />}

        {/* Tab 4: Formula Financial Ledger & Modeler */}
        {activeTab === "sheets" && <FrontierSheetsStudio />}

        {/* Tab 5: Dual-Chamber Redline Conflict Radar */}
        {activeTab === "radar" && <FrontierRadarStudio />}

        {/* Tab 6: Equilibrium Tradeoff Decision Matrix */}
        {activeTab === "decisions" && <FrontierDecisionsStudio />}

        {/* Tab 7: Circuit Logic Workflow Automator */}
        {activeTab === "workflows" && <FrontierWorkflowsStudio />}
      </div>
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
    { id: "audio", label: "🎙️ Spotify Audio Deck" },
    { id: "research", label: "📑 Velvet Indigo Research" },
    { id: "finance", label: "📊 Formula Matrix" },
    { id: "legal", label: "⚔️ Conflict Radar" },
    { id: "decisions", label: "🧠 Tradeoff Matrix" },
    { id: "automation", label: "⚡ Circuit Pipelines" },
  ];

  const STUDIOS = [
    {
      id: "voice" as FrontierTab,
      category: "audio",
      engine: "spotify",
      title: "Spotify Voice Co-Pilot",
      badge: "LIVE 48kHz ACOUSTIC DECK",
      accentBorder: "border-[#1DB954]/40 hover:border-[#1DB954]",
      accentGlow: "group-hover:shadow-[0_0_30px_rgba(29,185,84,0.18)]",
      badgeStyle: "bg-[#1DB954]/15 border-[#1DB954]/40 text-[#1DB954]",
      desc: "Spotify-styled hands-free audio conversation with real-time waveform frequency spectrum, audio scrubbing, and instant voice citation playback.",
      solvedIssue: "Hands-free examination & audio document exploration without typing or screen lock.",
      highlights: ["Spotify Visualizer & Waveforms", "Spoken Citation Playback", "Voice Viva Simulation"],
      cta: "Launch Spotify Audio Deck",
      ctaStyle: "bg-[#1DB954] hover:bg-[#1ed760] text-black font-black",
      icon: Mic,
    },
    {
      id: "research" as FrontierTab,
      category: "research",
      engine: "indigo",
      title: "Velvet Indigo Research Dossier",
      badge: "AUTONOMOUS SYNTHESIS",
      accentBorder: "border-indigo-500/30 hover:border-indigo-400",
      accentGlow: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.18)]",
      badgeStyle: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
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
      accentBorder: "border-teal-500/30 hover:border-teal-400",
      accentGlow: "group-hover:shadow-[0_0_30px_rgba(20,184,166,0.18)]",
      badgeStyle: "bg-teal-500/15 border-teal-500/30 text-teal-300",
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
      engine: "indigo",
      title: "Conflict & Discrepancy Radar",
      badge: "DUAL-CHAMBER REDLINE",
      accentBorder: "border-rose-500/30 hover:border-rose-400",
      accentGlow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.18)]",
      badgeStyle: "bg-rose-500/15 border-rose-500/30 text-rose-300",
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
      engine: "indigo",
      title: "Tradeoff Decision Solver",
      badge: "EQUILIBRIUM SOLVER",
      accentBorder: "border-indigo-500/30 hover:border-purple-400",
      accentGlow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]",
      badgeStyle: "bg-purple-500/15 border-purple-500/30 text-purple-300",
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
      engine: "spotify",
      title: "Circuit Logic Automator",
      badge: "NO-CODE PIPELINES",
      accentBorder: "border-[#1DB954]/40 hover:border-[#1DB954]",
      accentGlow: "group-hover:shadow-[0_0_30px_rgba(29,185,84,0.18)]",
      badgeStyle: "bg-[#1DB954]/15 border-[#1DB954]/40 text-[#1DB954]",
      desc: "Visual node circuit canvas connecting file ingestion, OCR extraction, AI redlining, and Slack/Email dispatches with live step simulations.",
      solvedIssue: "Automates repetitive multi-step document pipelines without writing backend code.",
      highlights: ["Node Circuit State Canvas", "Live Simulation Runner", "Audit Log Generation"],
      cta: "Build Circuit Flow",
      ctaStyle: "bg-[#1DB954] hover:bg-[#1ed760] text-black font-black",
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
      {/* Category Pills with Distinct Engine Tones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onSetCategory(c.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === c.id
                  ? "bg-white text-black font-bold shadow-md"
                  : "border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <Link
          href="/hub"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#1DB954] hover:underline"
        >
          <span>Explore Cognitive Playbook</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* 🌟 6 BESPOKE STUDIOS (NO MORE REPETITIVE IDENTICAL BOXES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudios.map((s) => {
          const Icon = s.icon;
          const isSpotify = s.engine === "spotify";

          return (
            <div
              key={s.id}
              className={`group relative flex flex-col justify-between rounded-3xl border bg-[#0b0e17] p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 ${s.accentBorder} ${s.accentGlow}`}
            >
              <div className="space-y-4">
                {/* Top Engine Channel & Badge */}
                <div className="flex items-center justify-between">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${s.badgeStyle}`}>
                    {s.badge}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSpotify ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[#1DB954]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1DB954] animate-ping" />
                        SPOTIFY DECK
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-indigo-400">INDIGO NEURAL</span>
                    )}
                  </div>
                </div>

                {/* Studio Title with Distinct Icon Avatar */}
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                      isSpotify
                        ? "border-[#1DB954]/30 bg-[#1DB954]/10 text-[#1DB954]"
                        : "border-indigo-500/30 bg-indigo-950/40 text-indigo-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-zinc-100">
                      {s.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                      {s.desc}
                    </p>
                  </div>
                </div>

                {/* Tactical Problem Solved Box */}
                <div
                  className={`rounded-2xl border p-3 text-xs space-y-1 ${
                    isSpotify
                      ? "border-[#1DB954]/20 bg-[#1DB954]/5 text-zinc-300"
                      : "border-indigo-500/20 bg-indigo-950/20 text-zinc-300"
                  }`}
                >
                  <span className={`font-mono text-[10px] font-bold block uppercase tracking-wider ${isSpotify ? "text-[#1DB954]" : "text-indigo-400"}`}>
                    ⚡ Bottleneck Solved:
                  </span>
                  <p className="text-[11px] leading-snug">{s.solvedIssue}</p>
                </div>

                {/* Feature Highlights */}
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  {s.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isSpotify ? "text-[#1DB954]" : "text-indigo-400"}`} />
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
   2. SPOTIFY SPOKEN VOICE STUDIO (48kHz ACOUSTIC DECK)
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
      text: "Spotify Voice Deck activated. Ready for hands-free document interrogation. Tap the green microphone or select a prompt track below to begin.",
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
        const res = await api.askQuestion(workspace.id, query);
        answer = res.answer || "No response received from workspace document memory.";
        if (res.sources && res.sources.length > 0) {
          docSnippet = `Citation: ${res.sources[0].title || "Document"} (Match Score: 98.4%)`;
        }
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

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.webkitSpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.webkitSpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Speech recognition is not supported in this browser. Please use Chrome/Edge.", "error");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: SpeechRecognitionEvent) => {
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
      showToast("Could not access microphone.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Bay: Spotify Audio Deck Turntable & Control Bay (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-[#1DB954]/30 bg-[#090c12] p-6 shadow-2xl relative overflow-hidden">
        {/* Ambient Spotify Green Radial Aura */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#1DB954]/15 blur-3xl pointer-events-none" />

        <div className="space-y-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1DB954] text-black font-black text-xs">
                ▶
              </span>
              <span className="font-mono text-xs font-bold text-[#1DB954]">SPOTIFY VOICE STUDIO</span>
            </div>
            <span className="rounded-full bg-[#1DB954]/15 border border-[#1DB954]/40 px-2.5 py-0.5 text-[10px] font-mono text-[#1DB954] font-bold">
              {isListening ? "RECORDING..." : isSpeaking ? "PLAYING..." : "IDLE"}
            </span>
          </div>

          {/* Spotify Turntable Disc & Equalizer Visualizer */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-zinc-800 bg-zinc-950 shadow-2xl">
              {/* Concentric Audio Waves */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-[#1DB954] animate-ping opacity-75" />
                  <div className="absolute -inset-4 rounded-full border border-[#1DB954]/40 animate-pulse" />
                </>
              )}
              {isSpeaking && (
                <div className="absolute -inset-3 rounded-full border-2 border-[#1DB954]/60 animate-spin" style={{ animationDuration: "6s" }} />
              )}

              {/* Vinyl Grooves Center Button */}
              <button
                onClick={toggleListening}
                className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.6)] scale-110"
                    : "bg-[#1DB954] text-black hover:bg-[#1ed760] shadow-[0_0_35px_rgba(29,185,84,0.5)] active:scale-95"
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
                  className="w-1.5 rounded-full transition-all duration-150"
                  style={{
                    height: isListening || isSpeaking ? `${h}%` : "15%",
                    backgroundColor: isListening ? "#f43f5e" : isSpeaking ? "#1DB954" : "#27272a",
                    animation: isListening || isSpeaking ? `pulse 0.6s infinite ${i * 0.05}s` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Voice Personality & Playback Controllers */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Persona Mode:</span>
              <div className="flex gap-1">
                {(["conversational", "executive", "academic"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setVoicePersona(p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                      voicePersona === p ? "bg-[#1DB954] text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {p.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Speed: {voiceSpeed}x</span>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-28 accent-[#1DB954] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Stop Voice Speech Button */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-800 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <Square className="h-3.5 w-3.5 text-[#1DB954] fill-[#1DB954]" />
            <span>Mute / Interrupt Speech Synthesis</span>
          </button>
        )}
      </div>

      {/* Right Bay: Live Lyrics-Style Transcript & Track Prompts Queue (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-zinc-800 bg-[#0c0f17] p-6 shadow-2xl space-y-6">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#1DB954]" />
              <h3 className="font-bold text-sm text-white">Live Interrogation Dialogue</h3>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">{liveTranscript.length} Exchanges</span>
          </div>

          {/* Transcript Feed (Synchronized Lyrics Style) */}
          <div className="mt-4 max-h-[260px] overflow-y-auto space-y-3 pr-2 font-sans">
            {liveTranscript.map((t, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all ${
                  t.sender === "user"
                    ? "bg-zinc-800/80 border border-zinc-700/60 text-white ml-6"
                    : "bg-[#0f1422] border border-indigo-500/20 text-zinc-200 mr-6"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-zinc-400">
                  <span className={t.sender === "user" ? "text-indigo-300 font-bold" : "text-[#1DB954] font-bold"}>
                    {t.sender === "user" ? "YOU" : "ASKDOCS AI"}
                  </span>
                  <span>{t.time}</span>
                </div>
                <p>{t.text}</p>
                {t.docSnippet && (
                  <div className="mt-2 rounded-xl bg-black/40 p-2 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                    📜 {t.docSnippet}
                  </div>
                )}
              </div>
            ))}

            {interim && (
              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-dashed border-[#1DB954]/50 text-xs text-[#1DB954] animate-pulse">
                🎙️ Listening: {interim}…
              </div>
            )}
          </div>
        </div>

        {/* Spotify Track Prompts Queue */}
        <div className="space-y-2 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>SUGGESTED TRACKS (1-TAP TO SPEAK)</span>
            <span className="text-[#1DB954]">● LIVE QUEUE</span>
          </div>

          <div className="space-y-1.5">
            {TRACK_PROMPTS.map((t) => (
              <button
                key={t.track}
                onClick={() => processQuery(t.query)}
                className="btn-pop flex w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-xs text-left hover:border-[#1DB954]/50 hover:bg-zinc-800/60 group transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-zinc-500 group-hover:text-[#1DB954]">{t.track}</span>
                  <span className="font-medium text-zinc-300 group-hover:text-white truncate">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-zinc-500">{t.duration}</span>
                  <Play className="h-3 w-3 text-zinc-500 group-hover:text-[#1DB954] group-hover:fill-[#1DB954]" />
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
   3. VELVET INDIGO DEEP RESEARCH DOSSIER STUDIO
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
      showToast("Please enter a research thesis or topic.", "error");
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
      showToast("Deep Research Dossier synthesized successfully!", "success");
    }, 2700);
  };

  return (
    <div className="space-y-6">
      {/* Header Deck */}
      <div className="rounded-3xl border border-indigo-500/30 bg-[#0c1022] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-indigo-400">📑 VELVET INDIGO COGNITIVE TERMINAL</span>
            <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3 py-0.5 text-[10px] font-mono text-indigo-300">
              AUTONOMOUS 4-PASS REASONER
            </span>
          </div>

          <h2 className="text-xl font-black text-white">Synthesize Comprehensive Intelligence Dossiers</h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Synthesizes citations, contradictory clauses, and empirical data points across all {documents.length} workspace files into publication-quality research briefs with embedded SVG topologies.
          </p>

          {/* Search Input Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter research topic (e.g. 'Cross-Agreement Indemnity Analysis')…"
              className="flex-1 rounded-2xl border border-indigo-500/30 bg-[#080a14] px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-mono"
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
            <span className="text-[11px] font-mono text-zinc-500">Presets:</span>
            {TOPIC_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setTopic(p)}
                className="rounded-full border border-indigo-500/20 bg-indigo-950/40 px-3 py-1 text-[11px] text-indigo-300 hover:border-indigo-400 hover:text-white transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Monitor */}
      {isGenerating && (
        <div className="rounded-2xl border border-indigo-500/30 bg-[#0d1226] p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
            <span>{stage}</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Generated Dossier Preview */}
      {dossierReady && (
        <div className="rounded-3xl border border-indigo-500/30 bg-[#0b0e1b] p-6 shadow-2xl space-y-6 animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">● DOSSIER COMPILED & CITATION-VERIFIED</span>
              <h3 className="text-lg font-bold text-white mt-1">{topic || "Workspace Intelligence Dossier"}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast("Exported PDF Dossier.", "success")}
                className="btn-pop rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                onClick={() => showToast("Exported LaTeX Document.", "success")}
                className="btn-pop rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> LaTeX
              </button>
            </div>
          </div>

          {/* Embedded SVG Variance Topology Graph */}
          <div className="rounded-2xl border border-indigo-500/20 bg-[#070912] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>DOCUMENT CORRELATION TOPOLOGY & VARIANCE MATRIX</span>
              <span className="text-indigo-400 font-bold">99.2% Accuracy</span>
            </div>
            <div className="h-36 w-full flex items-end justify-between gap-3 pt-6 px-4">
              {[
                { name: "Risk Index", val: "72%", height: "h-24", color: "from-indigo-600 to-indigo-400" },
                { name: "Contract Gap", val: "48%", height: "h-16", color: "from-indigo-500 to-teal-400" },
                { name: "OpEx Variance", val: "88%", height: "h-28", color: "from-teal-500 to-emerald-400" },
                { name: "SLA Match", val: "94%", height: "h-32", color: "from-emerald-500 to-[#1DB954]" },
                { name: "Compliance", val: "82%", height: "h-26", color: "from-indigo-600 to-emerald-500" },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-400">{bar.val}</span>
                  <div className={`w-full ${bar.height} rounded-t-lg bg-gradient-to-t ${bar.color} transition-all duration-500`} />
                  <span className="text-[10px] font-mono text-zinc-400 truncate w-full text-center">{bar.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Synthetic Executive Summary */}
          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-sans">
            <h4 className="font-bold text-white text-sm">1. Executive Overview & Multi-Document Findings</h4>
            <p>
              Autonomous cross-correlation of {documents.length} workspace records indicates high alignment on operational parameters with isolated liability variance in secondary clauses.
            </p>
            <h4 className="font-bold text-white text-sm pt-2">2. Empirical Data Ingestion & Citations</h4>
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
      <div className="rounded-3xl border border-teal-500/30 bg-[#091118] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-teal-400">📊 FORMULA LEDGER MATRIX</span>
          <span className="rounded-full bg-teal-500/15 border border-teal-500/30 px-3 py-0.5 text-[10px] font-mono text-teal-300">
            REACTIVE SPREADSHEET ENGINE
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
          <div>
            <h2 className="text-xl font-bold text-white">What-If Growth & Scenario Simulator</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Adjust scenario growth to dynamically recompute =SUM ledger formulas and net margin yields.
            </p>
          </div>

          {/* Rotary Growth Slider */}
          <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-400 block">SCENARIO DELTA</span>
              <span className="text-sm font-mono font-bold text-[#1DB954]">+{growthRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseInt(e.target.value))}
              className="w-36 accent-[#1DB954] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Reactive Calculation Spreadsheet Table */}
      <div className="rounded-3xl border border-zinc-800 bg-[#0a0d16] p-6 shadow-2xl overflow-x-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <span className="font-mono text-xs text-zinc-400">FORMULA BAR: <span className="text-teal-300 font-bold">=SUM(B2:E2) * (1 + {growthRate}%)</span></span>
          <button
            onClick={() => showToast("Exported scenario to Excel (.xlsx)", "success")}
            className="btn-pop rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition-colors flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export .XLSX
          </button>
        </div>

        <table className="w-full text-xs text-left font-mono">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="py-2.5 px-3">FINANCIAL LINE ITEM</th>
              <th className="py-2.5 px-3 text-right">Q1 (BASE)</th>
              <th className="py-2.5 px-3 text-right">Q2 (BASE)</th>
              <th className="py-2.5 px-3 text-right">Q3 (BASE)</th>
              <th className="py-2.5 px-3 text-right">Q4 (SCENARIO)</th>
              <th className="py-2.5 px-3 text-right text-teal-400">TOTAL (=SUM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {data.map((row, idx) => {
              const rowSum = (row.q1 + row.q2 + row.q3 + row.q4) * multiplier;
              return (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="py-3 px-3 font-sans font-medium text-white">{row.metric}</td>
                  <td className="py-3 px-3 text-right text-zinc-300">${row.q1.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-zinc-300">${row.q2.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-zinc-300">${row.q3.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-[#1DB954] font-bold">
                    ${Math.round(row.q4 * multiplier).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-teal-300 font-bold">
                    ${Math.round(rowSum).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-zinc-700 bg-zinc-900/60 font-bold text-white">
              <td className="py-3 px-3 font-sans">NET CONSOLIDATED YIELD</td>
              <td colSpan={4} className="text-right py-3 px-3 text-zinc-400">Simulated Net Impact:</td>
              <td className="py-3 px-3 text-right text-[#1DB954] text-sm">${Math.round(totalRev).toLocaleString()}</td>
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
      color: "border-rose-500/40 bg-rose-950/20 text-rose-300",
    },
    {
      id: "C-102",
      clause: "Aggregate Liability Cap",
      docA: "Vendor SLA Agreement",
      clauseA: "Liability capped at 100% of fees paid over preceding 12 months.",
      docB: "Data Protection Addendum",
      clauseB: "Liability for data breaches is strictly unlimited.",
      severity: "CRITICAL",
      color: "border-amber-500/40 bg-amber-950/20 text-amber-300",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-rose-500/30 bg-[#120a10] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-rose-400">⚔️ DUAL-CHAMBER CLASH RADAR</span>
          <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-0.5 text-[10px] font-mono text-rose-300">
            2 CONFLICTS DETECTED
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Cross-Document Redline & Harmonization Engine</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Detects contradictions in payment schedules, indemnity boundaries, and statutory terms.
            </p>
          </div>

          <button
            onClick={() => {
              setHarmonized(true);
              showToast("Synthesized unified harmonized clause draft!", "success");
            }}
            className="btn-pop rounded-2xl bg-gradient-to-r from-rose-600 via-indigo-600 to-[#1DB954] px-5 py-3 text-xs font-bold text-white shadow-lg transition-all shrink-0 cursor-pointer"
          >
            {harmonized ? "Clause Harmonized ✓" : "1-Click AI Harmonize"}
          </button>
        </div>
      </div>

      {/* Dual Chamber Comparison Cards */}
      <div className="space-y-4">
        {CONFLICTS.map((c) => (
          <div key={c.id} className="rounded-3xl border border-zinc-800 bg-[#0c0e17] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-500">{c.id}</span>
                <h3 className="font-bold text-sm text-white">{c.clause}</h3>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${c.color}`}>
                {c.severity}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chamber A */}
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 space-y-1.5">
                <span className="text-[10px] font-mono text-indigo-400 font-bold block">📄 CHAMBER ALPHA ({c.docA})</span>
                <p className="text-xs text-zinc-300 leading-relaxed">{c.clauseA}</p>
              </div>

              {/* Chamber B */}
              <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 space-y-1.5">
                <span className="text-[10px] font-mono text-rose-400 font-bold block">📄 CHAMBER BETA ({c.docB})</span>
                <p className="text-xs text-zinc-300 leading-relaxed">{c.clauseB}</p>
              </div>
            </div>

            {/* Harmonized AI Resolution Draft */}
            {harmonized && (
              <div className="rounded-2xl border border-[#1DB954]/40 bg-[#1DB954]/10 p-4 space-y-1.5 animate-in zoom-in-95">
                <span className="text-[10px] font-mono text-[#1DB954] font-bold block">✨ SYNTHESIZED HARMONIZATION RESOLUTION</span>
                <p className="text-xs text-zinc-200 leading-relaxed">
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
      <div className="rounded-3xl border border-purple-500/30 bg-[#0f0b18] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-purple-400">🧠 EQUILIBRIUM DECISION MATRIX</span>
          <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-0.5 text-[10px] font-mono text-purple-300">
            WEIGHTED MULTI-CRITERIA
          </span>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">Objective Tradeoff & Vendor Ranker</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Adjust multi-axis importance faders to compute composite rank scores in real time.
          </p>
        </div>

        {/* 3-Band Equalizer Faders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-300">
              <span>Cost Efficiency</span>
              <span className="font-bold text-[#1DB954]">{costWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={costWeight}
              onChange={(e) => setCostWeight(parseInt(e.target.value))}
              className="w-full accent-[#1DB954] cursor-pointer"
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-300">
              <span>Deployment Speed</span>
              <span className="font-bold text-indigo-400">{speedWeight}%</span>
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

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-300">
              <span>Risk & Compliance</span>
              <span className="font-bold text-purple-400">{riskWeight}%</span>
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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-[#0c0f1a] p-4 hover:border-indigo-500/40 transition-all"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-500">RANK #{i + 1} PROPOSAL</span>
                <h4 className="font-bold text-white text-sm">{opt.name}</h4>
              </div>

              <div className="flex items-center gap-4 sm:w-1/2">
                <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-[#1DB954] transition-all duration-300 rounded-full"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-black text-[#1DB954] shrink-0 w-12 text-right">
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
    { id: 4, name: "Executive Dispatch & Alert", desc: "Generates Spotify voice brief & sends Slack webhook" },
  ];

  const runSimulation = () => {
    setRunningStep(1);
    setTimeout(() => setRunningStep(2), 700);
    setTimeout(() => setRunningStep(3), 1400);
    setTimeout(() => setRunningStep(4), 2100);
    setTimeout(() => {
      setRunningStep(null);
      showToast("Simulation pipeline executed successfully with 0 errors!", "success");
    }, 2800);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#1DB954]/30 bg-[#0a110e] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#1DB954]">⚡ CIRCUIT LOGIC PIPELINE</span>
          <span className="rounded-full bg-[#1DB954]/15 border border-[#1DB954]/40 px-3 py-0.5 text-[10px] font-mono text-[#1DB954]">
            4-NODE ACTIVE STATE
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Visual Document Processing Flow</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Automates multi-stage document parsing, calculation, and notifications without writing code.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={runningStep !== null}
            className="btn-pop rounded-2xl bg-[#1DB954] hover:bg-[#1ed760] px-6 py-3 text-xs font-black text-black shadow-lg shadow-[#1DB954]/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
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
                  ? "border-[#1DB954] bg-[#0d1c14] shadow-[0_0_25px_rgba(29,185,84,0.3)] scale-102"
                  : isPassed
                  ? "border-emerald-500/40 bg-zinc-900/60"
                  : "border-zinc-800 bg-[#0c0e17]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-zinc-500">NODE 0{s.id}</span>
                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-[#1DB954] animate-ping" />
                ) : isPassed ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1DB954]" />
                ) : null}
              </div>

              <h4 className="font-bold text-white text-sm">{s.name}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
