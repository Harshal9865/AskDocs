"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FolderSync,
  GraduationCap,
  Headphones,
  Key,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  MessagesSquare,
  Play,
  Plug2,
  Presentation,
  Rocket,
  Scale,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Table,
  Terminal,
  UsersRound,
  Volume2,
  Webhook,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";

type CategoryFilter =
  | "all"
  | "ai"
  | "security"
  | "audio"
  | "docs"
  | "collab"
  | "cloud"
  | "legal";

interface FeatureCardData {
  id: string;
  category: CategoryFilter;
  title: string;
  badge: { text: string; color: string };
  icon: any;
  iconBg: string;
  desc: string;
  highlights: string[];
  href: string;
  actionText: string;
  metric?: string;
}

const FEATURES: FeatureCardData[] = [
  {
    id: "ai_chat",
    category: "ai",
    title: "AI Knowledge Chat & Multi-Doc Synthesis",
    badge: { text: "CORE AI", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    icon: Sparkles,
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    desc: "Universal deep reasoning across all uploaded PDFs, spreadsheets, and Word docs with exact chunk citations.",
    highlights: ["Top-8 Vector Cosine Retrieval", "Zero-Hallucination Source Citations", "Smart Context Deduplication (~40% token savings)"],
    href: "/chat",
    actionText: "Launch AI Chat",
    metric: "Sub-second citations",
  },
  {
    id: "enterprise_waf",
    category: "security",
    title: "Enterprise Application Firewall (WAF)",
    badge: { text: "ZERO-TRUST", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    icon: ShieldCheck,
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    desc: "Perimeter defense inspection scanning 100% of requests for SQL Injection, XSS, and unauthorized token probing.",
    highlights: ["Live SQLi & XSS Payload Filter", "Sliding-Window IP Rate Limiter", "Zero Model Training Guarantee (Enterprise Safe)"],
    href: "/settings",
    actionText: "View Security Status",
    metric: "100% Inspected",
  },
  {
    id: "gdrive_sync",
    category: "cloud",
    title: "Google Drive OAuth & Auto-Ingestion",
    badge: { text: "CLOUD SYNC", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    icon: FolderSync,
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    desc: "Direct integration with Google Cloud. Pick loose files from My Drive (Root) or preset folders without typing.",
    highlights: ["OAuth 2.0 Read-Only Scopes", "Selective File Picker Dialog", "Real-Time Webhook Auto-Fetch on upload"],
    href: "/integrations",
    actionText: "Open Cloud Hub",
    metric: "Zero typing needed",
  },
  {
    id: "audio_studio",
    category: "audio",
    title: "2-Host Audio Podcasts & Spoken Briefs",
    badge: { text: "AUDIO VOICE", color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
    icon: Headphones,
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    desc: "Transform complex documents into engaging conversational 2-host audio podcasts with spoken briefs.",
    highlights: ["Alex & Sam 2-Host Dialogue", "Custom Voice Speed & Pitch", "Downloadable MP3 Audio Broadcasts"],
    href: "/listen",
    actionText: "Generate Audio Brief",
    metric: "2-Host Voice Dialogue",
  },
  {
    id: "format_redact",
    category: "docs",
    title: "Format & Redact (HIPAA & NDA)",
    badge: { text: "COMPLIANCE", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    icon: FileCode,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    desc: "Automatically sanitize and redact SSNs, patient medical IDs, credit card numbers, and confidential names.",
    highlights: ["HIPAA Patient Shield", "Legal NDA Confidential Redaction", "One-Click Clean Document Export"],
    href: "/convert",
    actionText: "Redact Documents",
    metric: "100% PII Masking",
  },
  {
    id: "team_chats",
    category: "collab",
    title: "Team Chats & Synchronized Reactions",
    badge: { text: "COLLABORATION", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
    icon: MessagesSquare,
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    desc: "Real-time DMs and group chats with @AskDocs AI teammate, in-chat approval cards, and shared emoji reactions.",
    highlights: ["Database-Synced Emoji Reactions", "Interactive Action Approval Cards", "WhatsApp-Grade Audio Alerts"],
    href: "/chats",
    actionText: "Open Team Chats",
    metric: "Real-time sync",
  },
  {
    id: "contracts_tracker",
    category: "legal",
    title: "Contracts Tracker & Redline Diff",
    badge: { text: "LEGAL OPS", color: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
    icon: FileSignature,
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    desc: "Automated extraction of contract renewal deadlines, party obligations, penalty clauses, and redline visual diffs.",
    highlights: ["Automated 30-Day Notice Alerts", "Party Obligation Matrix", "Redline Clause Comparison"],
    href: "/contracts",
    actionText: "Track Contracts",
    metric: "Zero missed renewals",
  },
  {
    id: "study_studio",
    category: "ai",
    title: "Study Studio & Timed Exam Simulator",
    badge: { text: "ACADEMIC", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    icon: GraduationCap,
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    desc: "Generate active recall flashcards, practice quizzes, and full timed exam simulations from lecture slides.",
    highlights: ["Interactive Flashcards with Flip Physics", "Timed Exam Mode with Score Analytics", "Spaced Repetition Review Queue"],
    href: "/study-guide",
    actionText: "Start Studying",
    metric: "Active Recall",
  },
  {
    id: "memory_graph",
    category: "ai",
    title: "Deep Workspace Memory Graph",
    badge: { text: "ENTERPRISE", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
    icon: Brain,
    iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    desc: "Visual knowledge graph mapping entities, corporate decisions, citations, and relationships across all documents.",
    highlights: ["Interactive Node Connections", "Cross-Workspace Knowledge Linking", "Semantic Memory Clustering"],
    href: "/memory",
    actionText: "Explore Memory Graph",
    metric: "360° Insight",
  },
];

const ROADMAP = [
  {
    quarter: "Q1 2026",
    status: "Completed",
    statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    title: "Core AI & Multimodal Vision",
    items: [
      "Gemini 2.5 Flash RAG vector pipeline",
      "Multimodal OCR vision table extraction",
      "Token-efficient caching & smart chunk compression",
    ],
  },
  {
    quarter: "Q2 2026",
    status: "Live in Production",
    statusColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    title: "Enterprise Perimeter & Cloud Connectors",
    items: [
      "Enterprise Application Firewall (WAF) & Zero-Trust Matrix",
      "Google Drive OAuth 2.0 selective folder ingestion",
      "Real-time synchronized team chat reactions & approvals",
    ],
  },
  {
    quarter: "Q3 2026",
    status: "In Active Development",
    statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    title: "Collaborative Canvas & Document Diff",
    items: [
      "Infinite collaborative canvas with visual mind maps",
      "Side-by-side visual PDF diff with clause risk analyzer",
      "2-Way hands-free spoken voice dialogue mode",
    ],
  },
  {
    quarter: "Q4 2026",
    status: "Upcoming Roadmap",
    statusColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    title: "Automated Compliance & Mobile Ecosystem",
    items: [
      "Autonomous HIPAA / ISO 27001 audit score generator",
      "Native Progressive Web App (PWA) with offline reader",
      "Multi-tenant Enterprise SSO (Okta, Azure AD, SAML)",
    ],
  },
];

export default function InnovationHubPage() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [simulatedPII, setSimulatedPII] = useState("Patient John Doe (SSN: 992-12-8841) was diagnosed with hypertension on 08/24/2026. Contact: john.doe@email.com.");
  const [redactedResult, setRedactedResult] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const filteredFeatures = FEATURES.filter((f) => {
    const matchCategory = activeCategory === "all" || f.category === activeCategory;
    const matchQuery =
      !searchQuery.trim() ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchQuery;
  });

  const handleSimulateRedaction = async () => {
    setIsSimulating(true);
    await new Promise((r) => setTimeout(r, 600));
    setRedactedResult(
      simulatedPII
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "███-██-████ [REDACTED SSN]")
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "████@████.com [REDACTED EMAIL]")
        .replace(/John Doe/g, "████ ███ [PATIENT NAME REDACTED]")
    );
    setIsSimulating(false);
    showToast("success", "Instant PII Redaction simulation complete!");
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Radiant Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#120e24] via-[#1a1438] to-[#0f172a] p-6 sm:p-10 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-40 w-40 rounded-full bg-cyan-600/15 blur-2xl" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3.5 py-1 text-xs font-bold text-purple-300 backdrop-blur-md">
            <Rocket className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>AskDocs Innovation & Capability Hub</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Explore Every Superpower Inside{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              AskDocs
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
            From Enterprise Application Firewalls and Google Drive OAuth connectors to 2-host audio podcasts and token-efficient multi-document AI synthesis—discover how AskDocs elevates your institutional productivity.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/chat"
              className="btn-pop inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:opacity-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Try AI Chat</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/pricing"
              className="btn-pop inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-white/10 backdrop-blur-md cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Explore Plan Limits</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-touch">
          {[
            { id: "all", label: "All Upgrades", icon: Layers },
            { id: "ai", label: "AI & RAG", icon: Sparkles },
            { id: "security", label: "Security & WAF", icon: ShieldCheck },
            { id: "audio", label: "Audio Podcasts", icon: Headphones },
            { id: "docs", label: "Document Ops", icon: FileText },
            { id: "collab", label: "Team Chats", icon: MessagesSquare },
            { id: "cloud", label: "Cloud Connectors", icon: FolderSync },
            { id: "legal", label: "Contracts", icon: Scale },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as CategoryFilter)}
                className={`btn-pop shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative shrink-0 sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-1.5 pl-8.5 pr-3 text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-white/5 dark:text-white transition-colors"
          />
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className="pop-spring group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-purple-300 hover:shadow-xl dark:border-white/10 dark:bg-[#151326] dark:hover:border-purple-500/40"
            >
              <div className="space-y-3.5">
                {/* Header with Icon and Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feat.iconBg} shadow-xs`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${feat.badge.color}`}>
                    {feat.badge.text}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                  {feat.highlights.map((hl, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-zinc-300 font-medium">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                {feat.metric && (
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
                    {feat.metric}
                  </span>
                )}
                <Link
                  href={feat.href}
                  className="btn-pop ml-auto inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
                >
                  <span>{feat.actionText}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Live Sandbox Simulator: HIPAA Redaction & Security Test */}
      <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-7 dark:border-white/10 dark:bg-white/[0.02] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <EyeOff className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Interactive Sandbox: Test Real-Time PII & HIPAA Redaction
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Experience how AskDocs automatically sanitizes confidential institutional data before AI processing.
              </p>
            </div>
          </div>
          <button
            onClick={handleSimulateRedaction}
            disabled={isSimulating}
            className="btn-pop hidden sm:inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isSimulating ? "Sanitizing…" : "Execute Redaction Test"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Raw Document Input (with PII & SSN)
            </label>
            <textarea
              rows={3}
              value={simulatedPII}
              onChange={(e) => setSimulatedPII(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 font-mono text-xs outline-none focus:border-amber-500 dark:border-white/10 dark:bg-[#1a1728] dark:text-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Sanitized Output (Ready for Vector Vault)
            </label>
            <div className="min-h-[76px] rounded-2xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-[#1a1728] dark:text-zinc-200">
              {redactedResult ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{redactedResult}</span>
              ) : (
                <span className="text-slate-400 dark:text-zinc-500 italic">Click "Execute Redaction Test" to see automated sanitization...</span>
              )}
            </div>
          </div>
        </div>

        <div className="sm:hidden">
          <button
            onClick={handleSimulateRedaction}
            disabled={isSimulating}
            className="btn-pop w-full flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isSimulating ? "Sanitizing…" : "Execute Redaction Test"}</span>
          </button>
        </div>
      </div>

      {/* Product Roadmap & Changelog Timeline */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-[#131122] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Rocket className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Product Roadmap & Continuous Innovation Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Track our active development milestones, completed deployments, and upcoming enterprise capabilities.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROADMAP.map((rm, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-white/5 dark:bg-white/[0.02] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {rm.quarter}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${rm.statusColor}`}>
                  {rm.status}
                </span>
              </div>

              <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {rm.title}
              </h4>

              <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-zinc-300">
                {rm.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-500 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
