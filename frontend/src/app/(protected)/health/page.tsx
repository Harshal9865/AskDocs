"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-context";
import { useAudienceMode } from "@/lib/audience-mode-context";
import { api } from "@/lib/api";
import { WorkspaceHealthReport } from "@/lib/types";
import { showToast } from "@/components/Toast";
import { exportToPdf } from "@/lib/pdf-export";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

export default function DocumentHealthDashboardPage() {
  const { workspace } = useWorkspace();
  const { modeConfig } = useAudienceMode();
  const [report, setReport] = useState<WorkspaceHealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const loadHealthData = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    try {
      const data = await api.getWorkspaceHealth(workspace.id);
      setReport(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  const exportHealthAuditPDF = () => {
    if (!report) {
      showToast("error", "No health audit report available to export.");
      return;
    }
    exportToPdf({
      title: `${modeConfig.name} Document Health & Compliance Audit`,
      subtitle: `Automated Integrity & Domain Standards Scan • ${workspace?.name || "Workspace"}`,
      badge: `Health Score: ${report.health_score}/100 • ${report.issues?.length || 0} Identified Items`,
      workspaceName: workspace?.name,
      sections: [
        {
          heading: "Executive Integrity & Domain Audit Summary",
          type: "callout",
          content: `Audited <strong>${report.total_documents}</strong> total documents under <strong>${modeConfig.name}</strong> standards. Overall Health Score: <strong>${report.health_score}/100</strong>. Detected ${report.critical_issues_count} high-priority issues and ${report.warning_issues_count} advisories. Healthy files: ${report.healthy_documents_count}.`,
        },
        {
          heading: "Key Audit Findings & Discrepancies",
          type: "bullets",
          bullets: (report.issues || []).map(
            (iss, i) =>
              `<strong>Issue ${i + 1} (${iss.severity?.toUpperCase()} - ${iss.title}):</strong> ${iss.description}${iss.suggested_action ? `<br/><em>Action:</em> ${iss.suggested_action}` : ""}`
          ),
        },
      ],
    });
    showToast("success", "Preparing Health Audit PDF for print/download...");
  };

  const handleScan = async () => {
    if (!workspace?.id || scanning) return;
    setScanning(true);
    try {
      const updated = await api.scanWorkspaceHealth(workspace.id);
      setReport(updated);
      showToast("success", "Workspace health audit complete!");
    } catch {
      showToast("error", "Health scan failed. Please check your workspace documents.");
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (issueId: string, status: "resolved" | "dismissed") => {
    if (!workspace?.id) return;
    try {
      await api.updateHealthIssue(workspace.id, issueId, status);
      await loadHealthData();
      showToast("success", `Issue marked as ${status}.`);
    } catch {
      showToast("error", "Failed to update health issue status.");
    }
  };

  const issues = report?.issues || [];
  const filteredIssues = issues.filter((issue) => {
    if (activeTab === "all") return true;
    if (activeTab === "critical") return issue.severity === "critical";
    if (activeTab === "warning") return issue.severity === "warning";
    if (activeTab === "info") return issue.severity === "info";
    return true;
  });

  const score = report?.health_score ?? 100;
  const strokeDashoffset = 283 - (283 * score) / 100;

  const getScoreGradient = (val: number) => {
    if (val >= 85) return { stroke: "#10b981", badge: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30" };
    if (val >= 60) return { stroke: "#f59e0b", badge: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30" };
    return { stroke: "#ef4444", badge: "from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30" };
  };

  const scoreTheme = getScoreGradient(score);

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl dark:border-white/10">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 backdrop-blur-md shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span className="tracking-wider uppercase font-mono">{modeConfig.name} STANDARDS AUDITOR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              Document Health & Integrity
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Automated deep audit scanning citation accuracy, duplicate files, regulatory standards, and operational integrity with 1-click PDF compliance reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={exportHealthAuditPDF}
              disabled={!report}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Activity className="h-4 w-4" />
              <span>Download PDF Audit</span>
            </button>

            <button
              onClick={handleScan}
              disabled={scanning || !workspace}
              className="group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1db954] via-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-[#1db954]/25 hover:shadow-[#1db954]/45 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all duration-300 cursor-pointer shrink-0"
            >
              <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${scanning ? "animate-spin" : "group-hover:rotate-180"}`} />
              <span>{scanning ? "Auditing..." : "Scan Health"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Animated Radial Score Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#15151c]/90 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Health Score</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {loading ? "..." : `${score}%`}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Workspace Quality Index</p>
          </div>

          {/* SVG Circular Ring */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-white/5" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={scoreTheme.stroke}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <Activity className="absolute h-6 w-6 text-slate-700 dark:text-white" />
          </div>
        </div>

        {/* Total Documents */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#15151c]/90 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Analyzed Files</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{loading ? "..." : report?.total_documents || 0}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Active repository docs</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#15151c]/90 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Critical Issues</p>
            <p className="mt-1 text-3xl font-black text-red-600 dark:text-red-400">{loading ? "..." : report?.critical_issues_count || 0}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Action required</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-inner">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Healthy Docs */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#15151c]/90 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Healthy Files</p>
            <p className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">{loading ? "..." : report?.healthy_documents_count || 0}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">100% extraction ready</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Issues Area */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-5">
        {/* Tabs & Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "all", label: "All Issues", count: issues.length },
              { id: "critical", label: "Critical", count: report?.critical_issues_count },
              { id: "warning", label: "Warnings", count: report?.warning_issues_count },
              { id: "info", label: "Audits", count: issues.filter((i) => i.severity === "info").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-105"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-300"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-10 w-10 animate-spin text-purple-600 mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider">Evaluating repository document health...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-12 text-center backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-500 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 animate-bounce" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Workspace Document Quality is Prime!</h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
              No active document issues detected. All active files in your workspace have clean text extraction, clear metadata, and valid structure.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 hover:border-purple-500/40 hover:bg-white hover:shadow-lg hover:shadow-purple-500/5 dark:border-white/5 dark:bg-[#1a1a24]/60 dark:hover:bg-[#1f1f2e] transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                    issue.severity === "critical"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                      : issue.severity === "warning"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  }`}>
                    {issue.issue_type === "duplicate_file" ? (
                      <Copy className="h-5 w-5" />
                    ) : issue.issue_type === "outdated_document" ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        issue.severity === "critical"
                          ? "bg-red-500/15 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-500/30"
                          : issue.severity === "warning"
                          ? "bg-amber-500/15 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/15 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-500/30"
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {issue.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{issue.description}</p>

                    {issue.suggested_action && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <Zap className="h-3 w-3 shrink-0" />
                        <span>Action: {issue.suggested_action}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/chat?q=${encodeURIComponent(`We have a document quality/health issue titled "${issue.title}": ${issue.description}. Recommended action: ${issue.suggested_action || "Investigate"}. How should we fix or audit this?`)}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-all"
                    title="Ask AI to investigate this issue"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ask AI</span>
                  </Link>

                  <button
                    onClick={() => handleResolve(issue.id, "resolved")}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => handleResolve(issue.id, "dismissed")}
                    className="rounded-xl bg-slate-200/80 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
