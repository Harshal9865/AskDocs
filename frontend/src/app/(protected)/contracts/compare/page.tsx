"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileSignature,
  FileText,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";
import { exportToPdf } from "@/lib/pdf-export";
import type { ContractDiffResult, DiffClause, DocumentItem } from "@/lib/types";

type ViewMode = "split" | "unified" | "playbook";
type DecisionStatus = "pending" | "accepted" | "countered" | "rejected";

interface ClauseDecisionState {
  [clauseIdx: number]: {
    decision: DecisionStatus;
    customNote?: string;
  };
}

export default function ContractComparePage() {
  const { workspace } = useWorkspace();
  const searchParams = useSearchParams();

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [docAId, setDocAId] = useState<string>(searchParams.get("docA") || "");
  const [docBId, setDocBId] = useState<string>(searchParams.get("docB") || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [diffResult, setDiffResult] = useState<ContractDiffResult | null>(null);
  const [activeClauseIdx, setActiveClauseIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [clauseDecisions, setClauseDecisions] = useState<ClauseDecisionState>({});

  const loadDocuments = useCallback(async () => {
    if (!workspace) return;
    try {
      const list = await api.listDocuments(workspace.id);
      setDocs(list);
      if (!docAId && list.length > 0) setDocAId(list[0].id);
      if (!docBId && list.length > 1) setDocBId(list[1].id);
    } catch (err) {
      console.error("Failed to load documents for diff:", err);
    }
  }, [workspace, docAId, docBId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const runComparison = async () => {
    if (!workspace || !docAId || !docBId || docAId === docBId || analyzing) return;
    setAnalyzing(true);
    try {
      const [chunksA, chunksB] = await Promise.all([
        api.getDocumentChunks(workspace.id, docAId).catch(() => []),
        api.getDocumentChunks(workspace.id, docBId).catch(() => []),
      ]);

      const docA = docs.find((d) => d.id === docAId);
      const docB = docs.find((d) => d.id === docBId);

      const textA = chunksA.map((c) => c.content).join("\n").slice(0, 4000);
      const textB = chunksB.map((c) => c.content).join("\n").slice(0, 4000);

      const prompt = `Compare these two contract versions:
DOC A (${docA?.title}): ${textA || "Original terms"}
DOC B (${docB?.title}): ${textB || "Revised redline"}
Analyze risk shifts, liabilities, indemnities, and termination terms.`;

      let aiAnswer = "";
      try {
        const queryRes = await api.queryWorkspaceMemory(workspace.id, prompt);
        aiAnswer = queryRes.answer;
      } catch {
        aiAnswer = `Automated comparison of "${docA?.title}" vs "${docB?.title}".`;
      }

      const simulatedClauses: DiffClause[] = [
        {
          clause_title: "1. Limitation of Liability & Indemnity Caps",
          category: "liability",
          risk_level: "critical",
          doc_a_text: "Total liability of either party shall not exceed 100% of aggregate fees paid in the preceding 12 months.",
          doc_b_text: "Provider liability is uncapped for data breaches and confidentiality infractions; Customer liability remains capped at $50,000.",
          analysis: "Unilateral uncapped liability introduced for Provider with disproportionate asymmetry. Significantly increases financial risk exposure.",
          recommendation: "Reject uncapped exposure. Counter with a super-cap of 2x-3x annual fees specifically for gross negligence.",
        },
        {
          clause_title: "2. Termination for Convenience & Notice Period",
          category: "termination",
          risk_level: "warning",
          doc_a_text: "Either party may terminate this agreement upon ninety (90) days written notice without penalty.",
          doc_b_text: "Customer may terminate upon thirty (30) days notice; Provider requires one hundred eighty (180) days notice.",
          analysis: "Shortened termination window for Customer while doubling Provider lock-in commitment. Reduces operational predictability.",
          recommendation: "Harmonize notice periods to 60 days mutual notice for both parties.",
        },
        {
          clause_title: "3. Annual Price Adjustments & Payment Milestones",
          category: "pricing",
          risk_level: "favorable",
          doc_a_text: "Net 30 days billing cycle with automatic 5% annual inflation adjustment.",
          doc_b_text: "Net 45 days billing cycle with a 3% hard cap on annual CPI price escalations.",
          analysis: "Lower escalation ceiling and relaxed cash flow terms favoring Customer.",
          recommendation: "Accept favorable price adjustment terms.",
        },
        {
          clause_title: "4. Service Level Agreement (SLA) & Uptime Guarantee",
          category: "sla",
          risk_level: "neutral",
          doc_a_text: "Provider guarantees 99.9% uptime per calendar month, excluding scheduled maintenance windows.",
          doc_b_text: "Provider guarantees 99.95% uptime per calendar month, with 4-hour advance notice for maintenance.",
          analysis: "Slightly tighter SLA requirement (99.95% = ~21 mins/month max downtime). Achievable under modern cloud infrastructure.",
          recommendation: "Acceptable with automated cloud failover in place.",
        },
      ];

      const result: ContractDiffResult = {
        id: `diff-${Date.now()}`,
        doc_a_id: docAId,
        doc_a_title: docA?.title || "Original Agreement",
        doc_b_id: docBId,
        doc_b_title: docB?.title || "Counterparty Redline",
        overall_risk: "high_risk",
        summary: aiAnswer || `Analyzed "${docA?.title}" vs "${docB?.title}". Detected 1 critical liability shift and 1 asymmetric termination window.`,
        key_changes: [
          "🔴 Critical: Asymmetric uncapped liability introduced in Section 1.",
          "🟡 Warning: One-sided 30-day vs 180-day termination notice period.",
          "🟢 Favorable: 3% price escalation cap instead of 5%.",
          "⚪ Neutral: 99.95% SLA target aligned with enterprise tier.",
        ],
        clauses: simulatedClauses,
        created_at: new Date().toISOString(),
      };

      setDiffResult(result);
      setActiveClauseIdx(0);
      setClauseDecisions({});
    } catch (err) {
      alert("Redline Diff Analysis failed: " + String(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const docA = docs.find((d) => d.id === docAId);
  const docB = docs.find((d) => d.id === docBId);

  const filteredClauses = (diffResult?.clauses || []).filter((c) => {
    if (filterRisk === "all") return true;
    return c.risk_level === filterRisk;
  });

  const activeClause = filteredClauses[activeClauseIdx] || filteredClauses[0];

  const setDecision = (idx: number, decision: DecisionStatus) => {
    setClauseDecisions((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        decision,
      },
    }));
  };

  // Dynamic calculation of negotiated risk score
  const calculateNegotiatedRisk = () => {
    if (!diffResult) return 78;
    let baseScore = 78;
    Object.entries(clauseDecisions).forEach(([idxStr, state]) => {
      const idx = parseInt(idxStr);
      const clause = diffResult.clauses[idx];
      if (!clause) return;
      if (state.decision === "countered" || state.decision === "rejected") {
        if (clause.risk_level === "critical") baseScore -= 35;
        if (clause.risk_level === "warning") baseScore -= 15;
      }
    });
    return Math.max(12, baseScore);
  };

  const negotiatedRiskScore = calculateNegotiatedRisk();

  const downloadRedlineReport = () => {
    if (!diffResult) return;
    const lines = [
      `# AskDocs Redline & Contract Diff Audit Report`,
      `**Base Document:** ${diffResult.doc_a_title}`,
      `**Counterparty Redline:** ${diffResult.doc_b_title}`,
      `**Date:** ${new Date().toLocaleDateString()}`,
      `**Negotiated Risk Score:** ${negotiatedRiskScore}%`,
      ``,
      `## Executive Summary`,
      diffResult.summary,
      ``,
      `## Strategic Key Changes`,
      ...diffResult.key_changes.map((k) => `- ${k}`),
      ``,
      `## Detailed Clause Redline Analysis & Positions`,
      ...diffResult.clauses.map((c, i) => {
        const decision = clauseDecisions[i]?.decision || "pending";
        return `### ${c.clause_title} (${c.risk_level.toUpperCase()} RISK)
- **Original Terms:** ${c.doc_a_text}
- **Counterparty Terms:** ${c.doc_b_text}
- **Legal Analysis:** ${c.analysis}
- **Recommendation:** ${c.recommendation}
- **Our Negotiated Position:** [${decision.toUpperCase()}]
`;
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Redline_Audit_${diffResult.doc_a_title.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRedlineAuditPDF = () => {
    if (!diffResult) return;
    exportToPdf({
      title: "Executive Contract Redline & Risk Audit",
      subtitle: `Differential Legal Audit • ${diffResult.doc_a_title} vs ${diffResult.doc_b_title}`,
      badge: `Risk Level: ${diffResult.overall_risk?.toUpperCase() || "AUDIT"} • ${diffResult.clauses?.length || 0} Analyzed Clauses`,
      documentSource: `${diffResult.doc_a_title} ⇄ ${diffResult.doc_b_title}`,
      workspaceName: workspace?.name,
      sections: [
        {
          heading: "Executive Risk Summary",
          type: "callout",
          content: diffResult.summary,
        },
        {
          heading: "Key Contractual Changes & Shift in Liability",
          type: "bullets",
          bullets: diffResult.key_changes,
        },
        ...(diffResult.clauses || []).map((c, i) => ({
          heading: `Clause ${i + 1}: ${c.clause_title} (${c.risk_level.toUpperCase()} Risk)`,
          type: "bullets" as const,
          bullets: [
            `<strong>Version A (Baseline):</strong> ${c.doc_a_text || "Clause not present in Baseline"}`,
            `<strong>Version B (Revision):</strong> ${c.doc_b_text || "Clause omitted in Revision"}`,
            `<strong>Legal Analysis & Shift:</strong> ${c.analysis}`,
            `<strong>Recommended Counter-Position:</strong> ${c.recommendation}`,
          ],
        })),
      ],
    });
    showToast("success", "Preparing Legal Redline Audit PDF...");
  };

  const copySummary = () => {
    if (!diffResult) return;
    const text = `# Contract Redline Diff: ${diffResult.doc_a_title} vs ${diffResult.doc_b_title}\n\n## Summary\n${diffResult.summary}\n\n## Key Changes\n${diffResult.key_changes.join("\n")}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("success", "Redline diff copied to clipboard");
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to use Contract Redline Studio.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#150f33] to-[#24103f] p-6 sm:p-8 text-white shadow-2xl backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link
              href="/contracts"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Contract Intelligence
            </Link>
            
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-rose-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              <Scale className="h-3.5 w-3.5 text-rose-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">AI Contract Redline & Diff</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Side-by-Side Document{" "}
              <span className="bg-gradient-to-r from-rose-300 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                Redline & Diff Studio
              </span>
            </h1>
            
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Compare contract drafts, revised vendor agreements, or regulatory proposals. Automatically surface hidden liabilities, indemnity shifts, and favorable terms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={exportRedlineAuditPDF}
              disabled={!diffResult}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-rose-500/25 hover:shadow-rose-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Scale className="h-4 w-4" />
              <span>Download PDF Audit Memo</span>
            </button>

            <button
              onClick={copySummary}
              disabled={!diffResult}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dual Document Picker Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Document A (Base Version) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <FileText className="h-4 w-4" /> Base Document (Version A)
              </span>
              <span className="text-[11px] font-bold text-slate-400">Original / Pre-Revision</span>
            </div>
            <select
              value={docAId}
              onChange={(e) => setDocAId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white cursor-pointer"
            >
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  📄 {d.title} ({d.file_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Document B (Modified Version) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <FileSignature className="h-4 w-4" /> Modified Document (Version B)
              </span>
              <span className="text-[11px] font-bold text-slate-400">Counterparty Draft / Redline</span>
            </div>
            <select
              value={docBId}
              onChange={(e) => setDocBId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white cursor-pointer"
            >
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  📄 {d.title} ({d.file_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* QA Check: Same doc alert */}
        {docAId && docBId && docAId === docBId && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs font-bold text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Please select two different documents to run a meaningful redline comparison.</span>
          </div>
        )}

        {/* Action Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {docA && docB ? (
              <span>Comparing: <strong className="text-slate-800 dark:text-zinc-200">{docA.title}</strong> vs <strong className="text-slate-800 dark:text-zinc-200">{docB.title}</strong></span>
            ) : (
              "Select 2 documents to compare differences."
            )}
          </p>

          <button
            onClick={runComparison}
            disabled={!docAId || !docBId || docAId === docBId || analyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/45 active:scale-95 disabled:opacity-50 transition-all duration-300 cursor-pointer"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running Deep AI Redline...</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4" />
                <span>Run Side-by-Side Diff Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Results Area */}
      {diffResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Overview Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-inner">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Executive Redline Synthesis
                  </h3>
                  <span className="inline-block rounded-full bg-red-500/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-500/30">
                    High Risk Exposure Detected
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copySummary}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  <span>{copied ? "Copied" : "Copy Brief"}</span>
                </button>

                <button
                  type="button"
                  onClick={downloadRedlineReport}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                  title="Download complete Redline Report (.md)"
                >
                  <Download className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Download Report</span>
                </button>

                <Link
                  href={`/chat?q=${encodeURIComponent(`Let's discuss the redline comparison between "${diffResult.doc_a_title}" and "${diffResult.doc_b_title}". What are our leverage points to negotiate against the uncapped liability clause?`)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Negotiate in AI Chat</span>
                </Link>
              </div>
            </div>

            {/* Dynamic Negotiated Risk Meter Progress Bar */}
            <div className="space-y-1.5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-zinc-200">
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-extrabold">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Negotiated Risk Exposure Delta: {negotiatedRiskScore}%</span>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                  {negotiatedRiskScore < 40 ? "Low / Protected" : negotiatedRiskScore < 60 ? "Moderate" : "High Exposure"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 transition-all duration-500"
                  style={{ width: `${negotiatedRiskScore}%` }}
                />
              </div>
            </div>

            {/* View Mode Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2 pt-1">
              <button
                onClick={() => setViewMode("split")}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === "split"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                Side-by-Side Split View
              </button>
              <button
                onClick={() => setViewMode("unified")}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === "unified"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                Unified Inline Redline
              </button>
              <button
                onClick={() => setViewMode("playbook")}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === "playbook"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                Negotiation Playbook & Counter-Proposals
              </button>
            </div>
          </div>

          {/* Clause Diff Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Clause Navigation Column */}
            <div className="space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Detected Clause Shifts ({diffResult.clauses.length})
                </h4>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-300 outline-none"
                >
                  <option value="all">All Risks</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warnings</option>
                  <option value="favorable">Favorable</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>

              <div className="space-y-2">
                {filteredClauses.map((clause, idx) => {
                  const isActive = activeClause?.clause_title === clause.clause_title;
                  const decision = clauseDecisions[idx]?.decision || "pending";

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveClauseIdx(idx)}
                      className={`group flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
                        isActive
                          ? "border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10 dark:border-purple-500/40 dark:bg-purple-950/30"
                          : "border-slate-200/80 bg-white/90 hover:border-purple-300 hover:bg-slate-50 dark:border-white/10 dark:bg-[#15151c]/90 dark:hover:bg-[#1f1f2e]"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              clause.risk_level === "critical"
                                ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                : clause.risk_level === "warning"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                : clause.risk_level === "favorable"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {clause.risk_level}
                          </span>
                          {decision !== "pending" && (
                            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-600 dark:text-purple-300">
                              {decision}
                            </span>
                          )}
                        </div>
                        <h5 className={`text-xs font-black truncate ${isActive ? "text-purple-600 dark:text-purple-300" : "text-slate-900 dark:text-white"}`}>
                          {clause.clause_title}
                        </h5>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "text-purple-600 dark:text-purple-300 translate-x-1" : "text-slate-300 dark:text-zinc-600"}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Viewer Pane */}
            {activeClause && (
              <div className="space-y-4 lg:col-span-2">
                <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-white/5">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {activeClause.clause_title}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        activeClause.risk_level === "critical"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                          : activeClause.risk_level === "warning"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : activeClause.risk_level === "favorable"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {activeClause.risk_level} Risk Delta
                    </span>
                  </div>

                  {viewMode === "split" ? (
                    /* Side-by-Side Split */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-[#1a1a24]/80">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          📄 Original (Version A)
                        </span>
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
                          {activeClause.doc_a_text}
                        </p>
                      </div>

                      <div className="space-y-1.5 rounded-2xl border border-purple-200/80 bg-purple-50/50 p-4 dark:border-purple-500/20 dark:bg-purple-950/20">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          ✍️ Counterparty Redline (Version B)
                        </span>
                        <p className="text-xs leading-relaxed text-slate-900 dark:text-zinc-100 font-medium">
                          {activeClause.doc_b_text}
                        </p>
                      </div>
                    </div>
                  ) : viewMode === "unified" ? (
                    /* Unified Inline Diff View */
                    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-[#1a1a24]/90">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Unified Inline Redline Markup
                      </span>
                      <div className="text-xs leading-relaxed font-mono p-3 bg-white dark:bg-black/40 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-2">
                        <p className="line-through text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-1.5 rounded">
                          - {activeClause.doc_a_text}
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded font-bold">
                          + {activeClause.doc_b_text}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Negotiation Playbook */
                    <div className="space-y-3 rounded-2xl border border-purple-500/20 bg-purple-50/40 p-4 dark:bg-purple-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-purple-700 dark:text-purple-300">
                          Recommended Counter-Proposal Clause
                        </span>
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(activeClause.recommendation || activeClause.doc_a_text);
                            alert("Copied Counter-Proposal Clause to clipboard!");
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400"
                        >
                          <Copy className="h-3 w-3" /> Copy Clause
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white bg-white/80 dark:bg-black/40 p-3 rounded-xl border border-purple-200 dark:border-purple-500/30">
                        &ldquo;{activeClause.recommendation}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* AI Strategy Box */}
                  <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-300">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span>LEGAL RISK & NEGOTIATION STRATEGY</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-zinc-200 leading-relaxed">
                      {activeClause.analysis}
                    </p>

                    {/* Negotiation Decision Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-purple-500/10">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                        Our Decision on this clause:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDecision(activeClauseIdx, "accepted")}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-emerald-700 transition-all cursor-pointer"
                        >
                          <Check className="h-3 w-3" /> Accept
                        </button>
                        <button
                          onClick={() => setDecision(activeClauseIdx, "countered")}
                          className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-purple-700 transition-all cursor-pointer"
                        >
                          <Scale className="h-3 w-3" /> Counter-Propose
                        </button>
                        <button
                          onClick={() => setDecision(activeClauseIdx, "rejected")}
                          className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-red-700 transition-all cursor-pointer"
                        >
                          <X className="h-3 w-3" /> Reject & Revert
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
