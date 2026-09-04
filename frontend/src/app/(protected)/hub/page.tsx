"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Check,
  Copy,
  EyeOff,
  FileCode,
  FileSignature,
  FileText,
  GitBranch,
  GraduationCap,
  Headphones,
  Layers,
  MessagesSquare,
  Mic,
  Presentation,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Table,
  Terminal,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { showToast } from "@/components/Toast";

type CategoryFilter =
  | "all"
  | "frontier"
  | "ai"
  | "security"
  | "audio"
  | "docs"
  | "collab"
  | "legal";

interface FeatureCardData {
  id: string;
  category: CategoryFilter;
  title: string;
  badge: { text: string; color: string };
  icon: LucideIcon;
  iconBg: string;
  glowColor: string;
  desc: string;
  highlights: string[];
  href: string;
  actionText: string;
  metric?: string;
  demoSnippet?: string;
}

const FEATURES: FeatureCardData[] = [
  {
    id: "frontier_voice",
    category: "frontier",
    title: "🎙️ Spoken Voice Co-Pilot",
    badge: { text: "FRONTIER", color: "bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300" },
    icon: Mic,
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    glowColor: "group-hover:shadow-violet-500/20 group-hover:border-violet-400/50",
    desc: "Hands-free continuous 2-way spoken dialogue with real-time speech recognition, spoken citations, and instant interruption tolerance.",
    highlights: ["Live Web Speech API Voice Engine", "Real-Time Equalizer Waveforms", "Interruption-Tolerant Dialogue"],
    href: "/frontier?tab=voice",
    actionText: "Open Voice Co-Pilot",
    metric: "2-Way Hands-Free",
    demoSnippet: `// Spoken Voice Co-Pilot Speech Loop
User: "What are the primary data breach indemnities in Section 4?"
AI (Spoken): "Under Exhibit B, liability for data protection breaches is uncapped."`,
  },
  {
    id: "frontier_research",
    category: "frontier",
    title: "📑 Deep Research Dossier Engine",
    badge: { text: "FRONTIER", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300" },
    icon: FileText,
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    glowColor: "group-hover:shadow-blue-500/20 group-hover:border-blue-400/50",
    desc: "Autonomous multi-pass research engine synthesizing repository files into 15-page publication-ready reports with inline SVG charts and LaTeX source.",
    highlights: ["Autonomous Multi-Page Report Synthesis", "Inline Empirical Variance Bar Graphs", "1-Click PDF & LaTeX Export"],
    href: "/frontier?tab=research",
    actionText: "Open Research Studio",
    metric: "15-Page Dossiers",
    demoSnippet: `// Autonomous Research Synthesis Query
const dossier = await askDocs.synthesizeDossier({
  topic: "Enterprise Risk & Architecture Assessment 2026",
  format: ["PDF", "LaTeX"],
  includeCharts: true
});`,
  },
  {
    id: "frontier_sheets",
    category: "frontier",
    title: "📊 Live Financial & Scenario Modeler",
    badge: { text: "FRONTIER", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300" },
    icon: Table,
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/20 group-hover:border-emerald-400/50",
    desc: "In-browser live spreadsheet with real mathematical formulas (=SUM), What-If growth simulation sliders, and Excel CSV export.",
    highlights: ["Real Mathematical Formula Solver", "Interactive What-If Growth Sliders", "1-Click .CSV / .XLSX Export"],
    href: "/frontier?tab=sheets",
    actionText: "Open Financial Modeler",
    metric: "Live Calculations",
    demoSnippet: `// Real-Time What-If Financial Simulation
Growth Rate: +15%
Base Revenue: $225,000 | Projected: $258,750
Net Margin: $204,750 (Recalculated in 0.1ms)`,
  },
  {
    id: "frontier_radar",
    category: "frontier",
    title: "⚔️ Multi-Doc Conflict & Discrepancy Radar",
    badge: { text: "FRONTIER", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300" },
    icon: Scale,
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    glowColor: "group-hover:shadow-rose-500/20 group-hover:border-rose-400/50",
    desc: "Cross-document contradiction detector highlighting clause discrepancies, notice period clashes, and generating 1-click harmonization amendments.",
    highlights: ["Clause Clash Comparison Matrix", "Exposure Severity Badges", "1-Click AI Harmonization"],
    href: "/frontier?tab=radar",
    actionText: "Open Conflict Radar",
    metric: "Auto-Clash Detection",
    demoSnippet: `// Conflict Radar Discrepancy Detected
Doc A (MSA): "30 days prior written notice."
Doc B (SLA): "60 days minimum notice required."
Proposal: Harmonize to 45 days mutual notice.`,
  },
  {
    id: "frontier_decisions",
    category: "frontier",
    title: "🧠 Executive Decision & Tradeoff Solver",
    badge: { text: "FRONTIER", color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/80 dark:text-fuchsia-300" },
    icon: Brain,
    iconBg: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
    glowColor: "group-hover:shadow-fuchsia-500/20 group-hover:border-fuchsia-400/50",
    desc: "Multi-criteria weighted solver with importance sliders (Cost vs Speed vs Compliance), ranked composite scoring, and recommendation memos.",
    highlights: ["Interactive Importance Weight Sliders", "Ranked Composite Score Meters", "Executive Decision Memo Export"],
    href: "/frontier?tab=decisions",
    actionText: "Open Decision Solver",
    metric: "Weighted Matrix",
    demoSnippet: `// Weighted Multi-Criteria Decision Solver
Weights: Cost (40%) + Speed (30%) + Compliance (30%)
#1 Recommendation: Vendor Alpha (Score: 81/100)`,
  },
  {
    id: "frontier_workflows",
    category: "frontier",
    title: "⚡ Visual Workflow Automator",
    badge: { text: "FRONTIER", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300" },
    icon: GitBranch,
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    glowColor: "group-hover:shadow-amber-500/20 group-hover:border-amber-400/50",
    desc: "Node-based canvas automating routine document triage, OCR table extraction, compliance checking, and team chat alerts.",
    highlights: ["Visual 4-Node Pipeline Flow", "Live Step Execution Simulation", "Team Chat Action Approvals"],
    href: "/frontier?tab=workflows",
    actionText: "Open Workflow Automator",
    metric: "No-Code Pipelines",
    demoSnippet: `// Automated Workflow Pipeline
[Upload PDF] -> [OCR Table Extraction] -> [Redline Radar] -> [Notify Team Chat]`,
  },
  {
    id: "ai_chat",
    category: "ai",
    title: "AI Knowledge Chat & Multi-Doc Synthesis",
    badge: { text: "CORE AI", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300" },
    icon: Sparkles,
    iconBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    glowColor: "group-hover:shadow-purple-500/20 group-hover:border-purple-400/50",
    desc: "Universal deep reasoning across all uploaded PDFs, spreadsheets, and Word docs with exact chunk citations.",
    highlights: ["Top-8 Vector Cosine Retrieval", "Zero-Hallucination Source Citations", "Smart Context Deduplication (~40% token savings)"],
    href: "/chat",
    actionText: "Launch AI Chat",
    metric: "Sub-second citations",
    demoSnippet: `// AskDocs Vector Retrieval Query
const answer = await askDocs.query({
  workspaceId: "ws-9912",
  prompt: "Synthesize section 4 indemnification obligations across all 3 vendor contracts",
  topK: 8,
  temperature: 0.2
});`,
  },
  {
    id: "enterprise_waf",
    category: "security",
    title: "Enterprise Application Firewall (WAF)",
    badge: { text: "ZERO-TRUST", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300" },
    icon: ShieldCheck,
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/20 group-hover:border-emerald-400/50",
    desc: "Perimeter defense inspection scanning 100% of requests for SQL Injection, XSS, and unauthorized token probing.",
    highlights: ["Live SQLi & XSS Payload Filter", "Sliding-Window IP Rate Limiter", "Zero Model Training Guarantee (Enterprise Safe)"],
    href: "/settings",
    actionText: "View Security Status",
    metric: "100% Inspected",
    demoSnippet: `// Enterprise WAF Request Interceptor
POST /api/v1/query HTTP/1.1
X-AskDocs-Tenant: tenant-corp-01
X-WAF-Inspection: PASSED (0.2ms)
Payload-Integrity: 100% Sanitized`,
  },
  {
    id: "slide_studio",
    category: "docs",
    title: "Slide Deck Studio & PowerPoint Mode",
    badge: { text: "PRESENTATIONS", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300" },
    icon: Presentation,
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    glowColor: "group-hover:shadow-blue-500/20 group-hover:border-blue-400/50",
    desc: "Convert multi-document sources into executive 16:9 slide decks with fullscreen PowerPoint presenter mode (F5) and Gamma AI export.",
    highlights: ["Interactive F5 Presentation Mode", "1-Click Gamma AI Bridge", "Printable Vector PDF & HTML Web Decks"],
    href: "/slides",
    actionText: "Open Slide Studio",
    metric: "16:9 Fullscreen Presenter",
    demoSnippet: `// 1-Click Slide Synthesis & Gamma Bridge
const deck = await askDocs.generateSlides({
  sources: ["Q3_Financials.pdf", "Engineering_Roadmap.docx"],
  theme: "Spotify Obsidian Dark",
  gammaBridge: true
});`,
  },
  {
    id: "audio_studio",
    category: "audio",
    title: "2-Host Audio Podcasts & Spoken Briefs",
    badge: { text: "AUDIO VOICE", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300" },
    icon: Headphones,
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    glowColor: "group-hover:shadow-rose-500/20 group-hover:border-rose-400/50",
    desc: "Transform complex documents into engaging conversational 2-host audio podcasts with spoken briefs.",
    highlights: ["Alex & Sam 2-Host Dialogue", "Custom Voice Speed & Pitch", "Downloadable MP3 Audio Broadcasts"],
    href: "/listen",
    actionText: "Generate Audio Brief",
    metric: "2-Host Voice Dialogue",
    demoSnippet: `// 2-Host Conversational Audio Synthesis
Alex (Host A): "Looking at the Q3 audit report, operating expenses dropped by 18%."
Sam (Host B): "Exactly! Driven primarily by automated cloud document deduplication."`,
  },
  {
    id: "format_redact",
    category: "docs",
    title: "Format & Redact (HIPAA & NDA)",
    badge: { text: "COMPLIANCE", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300" },
    icon: FileCode,
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    glowColor: "group-hover:shadow-amber-500/20 group-hover:border-amber-400/50",
    desc: "Automatically sanitize and redact SSNs, patient medical IDs, credit card numbers, and confidential names.",
    highlights: ["HIPAA Patient Shield", "Legal NDA Confidential Redaction", "One-Click Clean Document Export"],
    href: "/convert",
    actionText: "Redact Documents",
    metric: "100% PII Masking",
    demoSnippet: `// Automated HIPAA Sanitization Output
Before: "Patient Jane Roe (DOB: 12/04/1988) tested positive for protocol A."
After:  "Patient [REDACTED_NAME] (DOB: [REDACTED_DOB]) tested positive for protocol A."`,
  },
  {
    id: "team_chats",
    category: "collab",
    title: "Team Chats & Synchronized Reactions",
    badge: { text: "COLLABORATION", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300" },
    icon: MessagesSquare,
    iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    glowColor: "group-hover:shadow-indigo-500/20 group-hover:border-indigo-400/50",
    desc: "Real-time DMs and group chats with @AskDocs AI teammate, in-chat approval cards, and shared emoji reactions.",
    highlights: ["Database-Synced Emoji Reactions", "Interactive Action Approval Cards", "WhatsApp-Grade Audio Alerts"],
    href: "/chats",
    actionText: "Open Team Chats",
    metric: "Real-time sync",
    demoSnippet: `// In-Chat Interactive Approval Card
@AskDocs: "Expense request for $1,250 submitted by Alex."
[Button: Approve 🟢] [Button: Reject 🔴]
-> Synced with live PostgreSQL reactions table.`,
  },
  {
    id: "contracts_tracker",
    category: "legal",
    title: "Contracts Tracker & Redline Diff",
    badge: { text: "LEGAL OPS", color: "bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300" },
    icon: FileSignature,
    iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    glowColor: "group-hover:shadow-teal-500/20 group-hover:border-teal-400/50",
    desc: "Automated extraction of contract renewal deadlines, party obligations, penalty clauses, and redline visual diffs.",
    highlights: ["Automated 30-Day Notice Alerts", "Party Obligation Matrix", "Redline Clause Comparison"],
    href: "/contracts",
    actionText: "Track Contracts",
    metric: "Zero missed renewals",
    demoSnippet: `// Contract Alert Extraction
Contract: "Enterprise Master Services Agreement v2.1"
Renewal Due: Nov 15, 2026 (Notice Deadline: Oct 15)
Obligation: 99.95% SLA Uptime Warranty ($5,000 penalty limit)`,
  },
  {
    id: "study_studio",
    category: "ai",
    title: "Study Studio & Timed Exam Simulator",
    badge: { text: "ACADEMIC", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300" },
    icon: GraduationCap,
    iconBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    glowColor: "group-hover:shadow-purple-500/20 group-hover:border-purple-400/50",
    desc: "Generate active recall flashcards, practice quizzes, and full timed exam simulations from lecture slides.",
    highlights: ["Interactive Flashcards with Flip Physics", "Timed Exam Mode with Score Analytics", "Spaced Repetition Review Queue"],
    href: "/study-guide",
    actionText: "Start Studying",
    metric: "Active Recall",
    demoSnippet: `// Flashcard Generation from Lecture PDF
Front: "What is the primary difference between L1 and L2 vector caching?"
Back: "L1 operates in volatile memory for active sessions; L2 persists deduplicated chunk hashes."`,
  },
  {
    id: "memory_graph",
    category: "ai",
    title: "Deep Workspace Memory Graph",
    badge: { text: "ENTERPRISE", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300" },
    icon: Brain,
    iconBg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    glowColor: "group-hover:shadow-cyan-500/20 group-hover:border-cyan-400/50",
    desc: "Visual knowledge graph mapping entities, corporate decisions, citations, and relationships across all documents.",
    highlights: ["Interactive Node Connections", "Cross-Workspace Knowledge Linking", "Semantic Memory Clustering"],
    href: "/memory",
    actionText: "Explore Memory Graph",
    metric: "360° Insight",
    demoSnippet: `// Workspace Entity Relationship Matrix
Node [Contract MSA v2] --related_to--> Node [SOP Policy 4.2]
Node [Vendor Acme]     --obligation--> Node [Renewal Notice 30-Day]`,
  },
];

const ROADMAP = [
  {
    quarter: "Q1 2026",
    status: "Completed",
    statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
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
    statusColor: "text-purple-500 bg-purple-500/10 border-purple-500/30",
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
    statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/30",
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
    statusColor: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    title: "Automated Compliance & Mobile Ecosystem",
    items: [
      "Autonomous HIPAA / ISO 27001 audit score generator",
      "Native Progressive Web App (PWA) with offline reader",
      "Multi-tenant Enterprise SSO (Okta, Azure AD, SAML)",
    ],
  },
];

export default function InnovationHubPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<FeatureCardData | null>(null);
  const [simulatedPII, setSimulatedPII] = useState("Patient John Doe (SSN: 992-12-8841) was diagnosed with hypertension on 08/24/2026. Contact: john.doe@email.com.");
  const [redactedResult, setRedactedResult] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

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
    await new Promise((r) => setTimeout(r, 650));
    setRedactedResult(
      simulatedPII
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "███-██-████ [REDACTED SSN]")
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "████@████.com [REDACTED EMAIL]")
        .replace(/John Doe/g, "████ ███ [PATIENT NAME REDACTED]")
    );
    setIsSimulating(false);
    showToast("success", "Instant PII Redaction simulation complete!");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
    showToast("success", "Code snippet copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Radiant Floating Mesh Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#110e24] via-[#1a1438] to-[#0f172a] p-6 sm:p-10 text-white shadow-2xl transition-all duration-300">
        {/* Animated Radial Ambient Orbs */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-600/25 blur-3xl animate-pulse" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl animate-pulse [animation-delay:1.5s]" />
        <div className="absolute right-1/3 bottom-0 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl animate-pulse [animation-delay:2.5s]" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/20 px-3.5 py-1 text-xs font-bold text-purple-200 backdrop-blur-md shadow-xs animate-in slide-in-from-top-2 duration-300">
            <Rocket className="h-3.5 w-3.5 text-purple-300 animate-bounce" />
            <span>AskDocs Innovation & Capability Hub</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Explore Every Superpower Inside{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
              AskDocs
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
            From Enterprise Application Firewalls and PowerPoint presentation studios to 2-host audio podcasts and token-efficient multi-document AI synthesis—discover how AskDocs elevates your institutional productivity.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/chat"
              className="btn-pop group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              <span>Launch AI Chat</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/pricing"
              className="btn-pop group inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-white/10 hover:border-white/30 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-400 transition-transform group-hover:scale-110" />
              <span>Explore Plan Limits</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ✦ Frontier Labs Cognitive Playbook & Notes Showcase Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#0a1a14] via-[#0d231b] to-[#07130e] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
        <div className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-teal-500/15 blur-3xl animate-pulse" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-200 backdrop-blur-md">
                <Rocket className="h-3.5 w-3.5 text-emerald-300" />
                <span>Frontier Labs Cognitive Playbook (v3.0)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                What Can You Do in Frontier Labs?
              </h2>
              <p className="text-xs text-zinc-300 max-w-2xl">
                Frontier Labs is AskDocs&apos; dedicated autonomous studio suite engineered to solve complex cognitive bottlenecks: spoken voice interrogation, live spreadsheet modeling, and multi-doc contradiction detection.
              </p>
            </div>

            <Link
              href="/frontier"
              className="btn-pop shrink-0 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-black shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <span>Launch Frontier Labs</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* 6 Frontier Studio Quick Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs">
            <Link href="/frontier?tab=voice" className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1 hover:bg-white/10 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Mic className="h-4 w-4" />
                <span>1. Spoken Voice Co-Pilot</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Hands-free spoken 2-way dialogue with real-time waveform visualization, live transcript, and spoken citations.
              </p>
            </Link>

            <Link href="/frontier?tab=research" className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1 hover:bg-white/10 hover:border-blue-500/40 transition-all">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <FileText className="h-4 w-4" />
                <span>2. Deep Research Dossier</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Synthesizes repository documents into 15-page publication-ready reports with inline SVG charts and LaTeX export.
              </p>
            </Link>

            <Link href="/frontier?tab=sheets" className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1 hover:bg-white/10 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Table className="h-4 w-4" />
                <span>3. Live Financial Modeler</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                In-browser spreadsheet with real mathematical =SUM formulas, What-If growth sliders, and Excel CSV export.
              </p>
            </Link>

            <Link href="/frontier?tab=radar" className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1 hover:bg-white/10 hover:border-rose-500/40 transition-all">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <Scale className="h-4 w-4" />
                <span>4. Conflict & Discrepancy Radar</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Cross-document contradiction scanner with Clause Clash matrix and 1-click AI harmonization amendments.
              </p>
            </Link>

            <Link href="/frontier?tab=decisions" className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1 hover:bg-white/10 hover:border-fuchsia-500/40 transition-all">
              <div className="flex items-center gap-2 font-bold text-fuchsia-300">
                <Brain className="h-4 w-4" />
                <span>5. Decision Tradeoff Solver</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Weighted multi-criteria decision solver with importance sliders (Cost vs Speed vs Compliance) and recommendation memos.
              </p>
            </Link>

            <Link href="/frontier?tab=workflows" className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1 hover:bg-white/10 hover:border-amber-500/40 transition-all">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <GitBranch className="h-4 w-4" />
                <span>6. Visual Workflow Automator</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                No-code node canvas automating document intake, OCR extraction, redline scanning, and team chat alerts.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar & Search with Motion Transitions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-touch">
          {[
            { id: "all", label: "All Upgrades", icon: Layers },
            { id: "frontier", label: "✦ Frontier Labs", icon: Rocket },
            { id: "ai", label: "AI & RAG", icon: Sparkles },
            { id: "security", label: "Security & WAF", icon: ShieldCheck },
            { id: "audio", label: "Audio Podcasts", icon: Headphones },
            { id: "docs", label: "Presentations & Docs", icon: Presentation },
            { id: "collab", label: "Team Chats", icon: MessagesSquare },
            { id: "legal", label: "Contracts", icon: Scale },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as CategoryFilter)}
                className={`btn-pop shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-102"
                    : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:border-purple-200 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:border-white/20"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 transition-transform ${active ? "rotate-6" : ""}`} />
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
            placeholder="Search superpowers…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-1.5 pl-8.5 pr-3 text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all shadow-2xs focus:shadow-md"
          />
        </div>
      </div>

      {/* Feature Showcase Grid with Staggered Hover Glows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className={`pop-spring group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#151326] ${feat.glowColor}`}
            >
              <div className="space-y-3.5">
                {/* Header with Icon and Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feat.iconBg} shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
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

              {/* Bottom Action Footer with Quick Preview Drawer Trigger */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFeature(feat)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-purple-600 dark:text-zinc-500 dark:hover:text-purple-400 transition-colors cursor-pointer"
                >
                  <Terminal className="h-3 w-3" />
                  <span>Interactive Blueprint</span>
                </button>

                <Link
                  href={feat.href}
                  className="btn-pop inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-600 hover:text-white dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md"
                >
                  <span>{feat.actionText}</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Live Sandbox Simulator: HIPAA Redaction & Security Test */}
      <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-7 dark:border-white/10 dark:bg-white/[0.02] space-y-4 shadow-sm transition-all hover:border-amber-400/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs animate-pulse">
              <EyeOff className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Interactive Sandbox: Test Real-Time PII & HIPAA Redaction</span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">Live Demo</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Experience how AskDocs automatically sanitizes confidential institutional data before AI processing.
              </p>
            </div>
          </div>
          <button
            onClick={handleSimulateRedaction}
            disabled={isSimulating}
            className="btn-pop hidden sm:inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Sanitizing in Real-Time…" : "Execute Redaction Test"}</span>
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
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 font-mono text-xs outline-none focus:border-amber-500 dark:border-white/10 dark:bg-[#1a1728] dark:text-white transition-all shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Sanitized Output (Ready for Vector Vault)
            </label>
            <div className={`min-h-[76px] rounded-2xl border p-3 font-mono text-xs transition-all shadow-2xs ${
              isSimulating
                ? "border-amber-400 bg-amber-50/50 text-amber-700 animate-pulse dark:bg-amber-950/30 dark:text-amber-300"
                : "border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-[#1a1728] dark:text-zinc-200"
            }`}>
              {isSimulating ? (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>Inspecting pattern matching for SSN, PII, and medical entities...</span>
                </div>
              ) : redactedResult ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{redactedResult}</span>
              ) : (
                <span className="text-slate-400 dark:text-zinc-500 italic">Click &quot;Execute Redaction Test&quot; to see automated sanitization...</span>
              )}
            </div>
          </div>
        </div>

        <div className="sm:hidden">
          <button
            onClick={handleSimulateRedaction}
            disabled={isSimulating}
            className="btn-pop w-full flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 cursor-pointer"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Sanitizing in Real-Time…" : "Execute Redaction Test"}</span>
          </button>
        </div>
      </div>

      {/* Product Roadmap & Changelog Timeline with Status Pulses */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-[#131122] space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-xs">
              <Rocket className="h-5 w-5 animate-pulse" />
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
              className="pop-spring rounded-2xl border border-slate-100 bg-slate-50/60 p-4.5 dark:border-white/5 dark:bg-white/[0.02] space-y-3 transition-all hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {rm.quarter}
                </span>
                <span className={`relative flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${rm.statusColor}`}>
                  {rm.status === "Live in Production" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
                  )}
                  <span>{rm.status}</span>
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

      {/* Interactive Blueprint Modal Dialog */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-purple-500/30 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151326] animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${selectedFeature.iconBg}`}>
                  <selectedFeature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedFeature.title}
                  </h3>
                  <span className={`inline-block mt-0.5 rounded-full px-2 py-0.2 text-[9px] font-black uppercase tracking-wider ${selectedFeature.badge.color}`}>
                    {selectedFeature.badge.text}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              {selectedFeature.desc}
            </p>

            {selectedFeature.demoSnippet && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-400">
                    Integration Blueprint & Payload
                  </span>
                  <button
                    onClick={() => copyCode(selectedFeature.demoSnippet!)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    {copiedSnippet ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSnippet ? "Copied" : "Copy Payload"}</span>
                  </button>
                </div>
                <pre className="rounded-2xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-[11px] text-purple-300 overflow-x-auto dark:border-white/10 dark:bg-black/80">
                  <code>{selectedFeature.demoSnippet}</code>
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setSelectedFeature(null)}
                className="btn-pop rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5 cursor-pointer"
              >
                Close Blueprint
              </button>
              <Link
                href={selectedFeature.href}
                className="btn-pop inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-500 cursor-pointer"
              >
                <span>{selectedFeature.actionText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
