"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FileCheck,
  FileSignature,
  FileText,
  MessagesSquare,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import type { PolicyGapItem } from "@/lib/types";

export default function PolicyRealityGapPage() {
  const { workspace } = useWorkspace();

  const [gaps, setGaps] = useState<PolicyGapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // SOP Generator Modal state
  const [draftingGap, setDraftingGap] = useState<PolicyGapItem | null>(null);
  const [generatedSOP, setGeneratedSOP] = useState<string>("");
  const [draftingBusy, setDraftingBusy] = useState<boolean>(false);
  const [copiedSOP, setCopiedSOP] = useState<boolean>(false);

  const loadGapData = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const initialGaps: PolicyGapItem[] = [
        {
          id: "gap-1",
          workspace_id: workspace.id,
          policy_title: "Customer Refund & Expenditure Threshold SOP",
          policy_clause: "All customer refunds exceeding $250 strictly require VP approval and 48-hour manager review.",
          actual_practice_snippet: "Teammates frequently approved $450-$700 instant refunds in Office Support chats without VP sign-off.",
          severity: "critical",
          description: "Operational deviation from financial controls. Unapproved discretionary refunds increase quarterly variance.",
          suggested_remedy: "Enforce automated @AskDocs approval limits or update SOP threshold to $500 for senior support leads.",
          status: "open",
          detected_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: workspace.id,
          policy_title: "Client Deliverable Turnaround Commitment (SLA)",
          policy_clause: "Custom analytical reports guaranteed to client within 5 business days of request receipt.",
          actual_practice_snippet: "Team promised 48-hour turnarounds to high-value enterprise accounts in direct client chats.",
          severity: "warning",
          description: "Over-promising turnaround speed without allocating additional engineering bandwidth.",
          suggested_remedy: "Establish tiered SLA policy: standard 5-day tier vs express 48-hour premium retainer tier.",
          status: "open",
          detected_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: "gap-3",
          workspace_id: workspace.id,
          policy_title: "Remote Work & Travel Expense Reimbursement Policy",
          policy_clause: "Hotel stays capped at $200/night; higher rates require pre-trip executive approval.",
          actual_practice_snippet: "Conference hotel bookings average $320/night during high-demand tech summits.",
          severity: "info",
          description: "Policy price ceilings are outdated relative to current major metropolitan inflation.",
          suggested_remedy: "Update travel handbook to dynamic geo-indexed lodging rates.",
          status: "open",
          detected_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ];

      setGaps(initialGaps);
    } catch (err) {
      console.error("Failed to load policy gap data:", err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void loadGapData();
  }, [loadGapData]);

  const handleScanGaps = async () => {
    if (!workspace || scanning) return;
    setScanning(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      alert("Policy vs. Reality Scan Complete! Analyzed workspace SOPs against team office messages.");
      await loadGapData();
    } catch {
      alert("Scan failed.");
    } finally {
      setScanning(false);
    }
  };

  const handleStatusChange = (gapId: string, status: "open" | "reconciled" | "dismissed") => {
    setGaps((prev) => prev.map((g) => (g.id === gapId ? { ...g, status } : g)));
  };

  const openSOPDraftModal = async (gap: PolicyGapItem) => {
    setDraftingGap(gap);
    setDraftingBusy(true);
    setCopiedSOP(false);

    // Simulate AI synthesis of formal SOP amendment
    setTimeout(() => {
      const generatedClause = `### Standard Operating Procedure (SOP) Amendment — Ref: ${gap.policy_title}
**Effective Date:** ${new Date().toLocaleDateString()}
**Governing Department:** Operations & Compliance Lead

#### 1. Purpose & Scope
This amendment harmonizes operational day-to-day practices with formal organizational policy regarding ${gap.policy_title}.

#### 2. Revised Operating Rule
> **Updated Clause:** ${gap.suggested_remedy}

#### 3. Delegation of Authority & Approval Thresholds
- **Standard Threshold:** Tier 1 actions up to $500 authorized for Senior Leads with recorded justification.
- **Escalation Threshold:** Deviations exceeding standard limits require verified in-chat approval via \`@AskDocs\` or direct VP sign-off.
- **Audit Logging:** All approvals are committed to the Immutable Decision Governance Ledger for SOC2 compliance.

#### 4. Verification & Review Cadence
This procedure is audited on a quarterly cadence by the Workspace Intelligence Auditor.`;

      setGeneratedSOP(generatedClause);
      setDraftingBusy(false);
    }, 600);
  };

  const copySOPText = () => {
    void navigator.clipboard.writeText(generatedSOP);
    setCopiedSOP(true);
    setTimeout(() => setCopiedSOP(false), 2000);
  };

  const openGapsCount = gaps.filter((g) => g.status === "open").length;
  const complianceRate = gaps.length === 0 ? 100 : Math.round(((gaps.length - openGapsCount) / gaps.length) * 100);

  const filteredGaps = gaps.filter((g) => {
    if (filterSeverity !== "all" && g.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.policy_title.toLowerCase().includes(q);
      const matchDesc = g.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to view Policy vs. Reality Gap Radar.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl dark:border-white/10 animate-gradient-shift">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl animate-float" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 backdrop-blur-md shadow-inner">
              <Radar className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span className="tracking-wider">OPERATIONAL DISCREPANCY RADAR</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              Document vs. Reality Gap Detector
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Compares what official company handbooks, SOPs, and contracts dictate against actual daily team chat practices to surface hidden legal & financial risks.
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            {/* Holographic Radar Scanner Animation Widget */}
            <div className="relative hidden sm:flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-black/40 backdrop-blur-md shadow-xl shadow-amber-500/20 overflow-hidden">
              <div className="absolute inset-2 rounded-full border border-amber-500/20" />
              <div className="absolute inset-5 rounded-full border border-amber-500/30" />
              <div className="absolute inset-8 rounded-full border border-amber-500/40" />
              <div className="absolute inset-0 origin-center animate-radar bg-gradient-to-tr from-amber-500/40 via-purple-500/20 to-transparent pointer-events-none" />
              <div className="relative z-10 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 shadow-md shadow-amber-400/80 animate-ping" />
              <Radar className="absolute z-10 h-5 w-5 text-amber-300" />
            </div>

            <button
              onClick={handleScanGaps}
              disabled={scanning}
              className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 disabled:opacity-50 transition-all duration-300 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${scanning ? "animate-spin" : "group-hover:rotate-180"}`} />
              <span>{scanning ? "Scanning Discrepancies…" : "Run Policy vs. Chat Scan"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Health & Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#15151c]/90 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Policy Alignment Rate</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{complianceRate}%</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              {openGapsCount === 0 ? "100% full compliance" : `${openGapsCount} active discrepancies`}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#15151c]/90 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Critical Risks</p>
            <p className="mt-1 text-3xl font-black text-red-600 dark:text-red-400">
              {gaps.filter((g) => g.severity === "critical" && g.status === "open").length}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Urgent financial/legal drift</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-inner">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#15151c]/90 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Reconciled Policies</p>
            <p className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {gaps.filter((g) => g.status === "reconciled").length}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Aligned with actual operations</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-inner">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search flagged discrepancies by policy title or operational drift…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 pl-11 pr-4 py-3 text-xs font-bold text-slate-900 outline-none backdrop-blur-md transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
          />
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-800 outline-none transition-all dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical Drift</option>
          <option value="warning">Warning Drift</option>
          <option value="info">Informational</option>
        </select>
      </div>

      {/* Gaps List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-10 w-10 animate-spin text-purple-600 mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider">Scanning Policy vs. Reality Discrepancies...</p>
          </div>
        ) : filteredGaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-12 text-center backdrop-blur-sm animate-in fade-in duration-300">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3 animate-bounce" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">Zero Policy Discrepancies Detected</h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
              Team discussions across Office Chats are completely aligned with written workspace handbooks, contracts, and SOPs.
            </p>
          </div>
        ) : (
          filteredGaps.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 dark:border-white/10 dark:bg-[#15151c]/95 transition-all duration-200 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                    item.severity === "critical"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                      : item.severity === "warning"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {item.policy_title}
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      Detected {new Date(item.detected_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    item.severity === "critical"
                      ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                      : item.severity === "warning"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                  }`}>
                    {item.severity} Drift
                  </span>
                  {item.status === "reconciled" && (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Reconciled
                    </span>
                  )}
                </div>
              </div>

              {/* Side by Side: Policy Written Rule vs Chat Reality */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-[#1a1a24]/80">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    <FileText className="h-3.5 w-3.5" /> Official Written SOP / Contract
                  </span>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 font-medium">
                    &ldquo;{item.policy_clause}&rdquo;
                  </p>
                </div>

                <div className="space-y-1.5 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-950/20">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <MessagesSquare className="h-3.5 w-3.5" /> Actual Daily Practice (Office Chat)
                  </span>
                  <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200 font-medium">
                    &ldquo;{item.actual_practice_snippet}&rdquo;
                  </p>
                </div>
              </div>

              {/* Remedy Recommendation */}
              <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-purple-600 dark:text-purple-300">
                    <Zap className="h-3.5 w-3.5 text-purple-500" />
                    <span>RECOMMENDED ALIGNMENT STRATEGY</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300">
                    {item.suggested_remedy}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => openSOPDraftModal(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate SOP Amendment</span>
                  </button>

                  {item.status === "open" ? (
                    <button
                      onClick={() => handleStatusChange(item.id, "reconciled")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Reconciled</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(item.id, "open")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      <span>Reopen Gap</span>
                    </button>
                  )}

                  <Link
                    href={`/chat?q=${encodeURIComponent(`Let's reconcile the operational policy gap "${item.policy_title}". Official rule: "${item.policy_clause}". Actual chat practice: "${item.actual_practice_snippet}". Suggested remedy: "${item.suggested_remedy}". Draft an updated SOP clause to align them.`)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 transition-all"
                    title="Audit in Chat"
                  >
                    <span>Discuss in AI Chat</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SOP Amendment Draft Modal */}
      {draftingGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#15151c] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  AI-Generated SOP Amendment Clause
                </h3>
              </div>
              <button
                onClick={() => setDraftingGap(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {draftingBusy ? (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                <p className="text-xs font-bold">Synthesizing SOP Amendment Text…</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {generatedSOP}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[11px] font-bold text-slate-400">
                    Ready to copy into your team handbook or policy repository.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copySOPText}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all cursor-pointer"
                    >
                      {copiedSOP ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedSOP ? "Copied" : "Copy SOP Amendment"}</span>
                    </button>
                    <button
                      onClick={() => {
                        handleStatusChange(draftingGap.id, "reconciled");
                        setDraftingGap(null);
                      }}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                    >
                      Apply & Reconcile
                    </button>
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
