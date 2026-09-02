"use client";

import { useEffect, useState, useCallback } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";
import { DocumentHealthIssue, WorkspaceHealthReport } from "@/lib/types";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  FileSearch,
  FileText,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

export default function DocumentHealthDashboardPage() {
  const { currentWorkspace } = useWorkspace();
  const [report, setReport] = useState<WorkspaceHealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const loadHealthData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    try {
      const data = await api.getWorkspaceHealth(currentWorkspace.id);
      setReport(data);
    } catch (err) {
      console.warn("Failed to load health report:", err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  const handleScan = async () => {
    if (!currentWorkspace?.id || scanning) return;
    setScanning(true);
    try {
      const updated = await api.scanWorkspaceHealth(currentWorkspace.id);
      setReport(updated);
    } catch (err) {
      alert("Health scan failed. Please check your workspace documents.");
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (issueId: string, status: "resolved" | "dismissed") => {
    if (!currentWorkspace?.id) return;
    try {
      await api.updateHealthIssue(currentWorkspace.id, issueId, status);
      await loadHealthData();
    } catch (err) {
      alert("Failed to update health issue status.");
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

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500 stroke-emerald-500 border-emerald-500 bg-emerald-500/10";
    if (score >= 60) return "text-amber-500 stroke-amber-500 border-amber-500 bg-amber-500/10";
    return "text-red-500 stroke-red-500 border-red-500 bg-red-500/10";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl dark:border-white/10">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md">
              <Activity className="h-3.5 w-3.5" />
              <span>INTELLIGENT DOCUMENT QUALITY ASSURANCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Document Health Score
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300">
              Automated audit of text extraction clarity, duplicate files, stale documents, and operational integrity.
            </p>
          </div>

          <button
            onClick={handleScan}
            disabled={scanning || !currentWorkspace}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
            <span>{scanning ? "Scanning Quality..." : "Scan Workspace Quality"}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Score Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#15151c] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Health Index</p>
            <p className={`text-3xl font-black ${getScoreColor(report?.health_score || 100).split(" ")[0]}`}>
              {loading ? "..." : `${report?.health_score || 100}%`}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Overall Workspace Quality</p>
          </div>
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${getScoreColor(report?.health_score || 100)}`}>
            <Activity className="h-7 w-7" />
          </div>
        </div>

        {/* Total Documents */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#15151c] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Analyzed Files</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{loading ? "..." : report?.total_documents || 0}</p>
            <p className="mt-1 text-[11px] text-slate-400">Active repository docs</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#15151c] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Critical Issues</p>
            <p className="text-3xl font-black text-red-600 dark:text-red-400">{loading ? "..." : report?.critical_issues_count || 0}</p>
            <p className="mt-1 text-[11px] text-slate-400">Action required</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Healthy Docs */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#15151c] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Healthy Files</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{loading ? "..." : report?.healthy_documents_count || 0}</p>
            <p className="mt-1 text-[11px] text-slate-400">100% extraction ready</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Issues Area */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-[#15151c] space-y-4">
        {/* Tabs & Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "all", label: "All Issues", count: issues.length },
              { id: "critical", label: "Critical", count: report?.critical_issues_count },
              { id: "warning", label: "Warnings", count: report?.warning_issues_count },
              { id: "info", label: "Audits", count: issues.filter((i) => i.severity === "info").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-300"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mb-2" />
            <p className="text-xs font-medium">Evaluating workspace document health...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center dark:border-white/10 dark:bg-white/5">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Workspace Health is Prime!</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
              No active quality issues detected. All files have clear text extraction and valid metadata.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-purple-500/30 dark:border-white/5 dark:bg-[#1a1a24] transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    issue.severity === "critical"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : issue.severity === "warning"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}>
                    {issue.issue_type === "duplicate_file" ? (
                      <Copy className="h-4 w-4" />
                    ) : issue.issue_type === "outdated_document" ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        issue.severity === "critical"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          : issue.severity === "warning"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{issue.title}</span>
                    </div>

                    <p className="mt-1 text-xs text-slate-600 dark:text-zinc-300">{issue.description}</p>

                    {issue.suggested_action && (
                      <p className="mt-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Zap className="h-3 w-3 inline shrink-0" />
                        <span>Action: {issue.suggested_action}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleResolve(issue.id, "resolved")}
                    className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => handleResolve(issue.id, "dismissed")}
                    className="rounded-xl bg-slate-200/60 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/20 transition-colors cursor-pointer"
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
