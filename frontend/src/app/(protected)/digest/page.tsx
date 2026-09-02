"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";
import { WorkspaceDigest } from "@/lib/types";
import {
  FileSpreadsheet,
  Sparkles,
  Calendar,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  RefreshCw,
  TrendingUp,
  Award,
  Clock,
  Copy,
  Check,
} from "lucide-react";

export default function WorkspaceDigestPage() {
  const { workspace } = useWorkspace();
  const [digests, setDigests] = useState<WorkspaceDigest[]>([]);
  const [activeDigest, setActiveDigest] = useState<WorkspaceDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadDigests = useCallback(async () => {
    if (!workspace) return;
    try {
      setLoading(true);
      const data = await api.getWorkspaceDigests(workspace.id);
      setDigests(data);
      if (data.length > 0) {
        setActiveDigest(data[0]);
      } else {
        setActiveDigest(null);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void loadDigests();
  }, [loadDigests]);

  const handleGenerate = async () => {
    if (!workspace || generating) return;
    try {
      setGenerating(true);
      const newDigest = await api.generateWorkspaceDigest(workspace.id);
      setDigests((prev) => [newDigest, ...prev]);
      setActiveDigest(newDigest);
    } catch {
      alert("Failed to generate AI digest. Please check your workspace documents.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (digestId: string) => {
    if (!workspace || deletingId) return;
    if (!confirm("Are you sure you want to delete this weekly digest?")) return;
    try {
      setDeletingId(digestId);
      await api.deleteWorkspaceDigest(workspace.id, digestId);
      const updated = digests.filter((d) => d.id !== digestId);
      setDigests(updated);
      if (activeDigest?.id === digestId) {
        setActiveDigest(updated[0] || null);
      }
    } catch {
      alert("Failed to delete digest.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to view AI digests.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl dark:border-white/10">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 backdrop-blur-md shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span className="tracking-wider">PROACTIVE AI EXECUTIVE DIGEST</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              Workspace Weekly Digest
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Automated weekly AI synthesis of workspace documents, contract obligations, and key strategic team takeaways.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 disabled:opacity-50 transition-all duration-300 cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${generating ? "animate-spin" : "group-hover:rotate-180"}`} />
            <span>{generating ? "Synthesizing AI Digest..." : "Generate Fresh AI Digest"}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Analyzed Docs */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#15151c]/90 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Documents Analyzed</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{activeDigest ? activeDigest.document_count : 0}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Active repository files</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Obligations Alert */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#15151c]/90 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Contract Obligations</p>
            <p className="mt-1 text-3xl font-black text-amber-600 dark:text-amber-400">{activeDigest ? activeDigest.contract_alerts_count : 0}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Tracked commitments</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Takeaways Count */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#15151c]/90 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Key Takeaways</p>
            <p className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">{activeDigest ? activeDigest.key_takeaways?.length || 0 : 0}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Strategic takeaways</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Last Digest Date */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#15151c]/90 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Last Digest Date</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              {activeDigest ? new Date(activeDigest.created_at).toLocaleDateString() : "N/A"}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Generated timestamp</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-inner">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center text-slate-400">
          <RefreshCw className="h-10 w-10 animate-spin text-purple-600 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading AI Executive Digests...</p>
        </div>
      ) : digests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-purple-500/30 bg-purple-500/5 p-12 text-center backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-500/20 text-purple-500 shadow-xl shadow-purple-500/20">
            <FileSpreadsheet className="h-8 w-8 animate-bounce" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-400 animate-ping" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">No Executive Weekly Digests Generated Yet</h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
            Synthesize an AI Executive Workspace Digest summarizing active documents, contract obligations, and key strategic takeaways.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/30 hover:from-purple-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> Generate First Digest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* History Sidebar */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 px-1">
              <Calendar className="h-4 w-4 text-purple-500" /> Digest Timeline
            </h3>
            <div className="space-y-2.5">
              {digests.map((d) => {
                const isActive = activeDigest?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setActiveDigest(d)}
                    className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
                      isActive
                        ? "border-purple-500 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent shadow-lg shadow-purple-500/10 dark:border-purple-500/50 dark:bg-purple-950/30"
                        : "border-slate-200/80 bg-white/90 hover:border-purple-400/40 hover:bg-slate-50 dark:border-white/10 dark:bg-[#15151c]/90 dark:hover:bg-[#1f1f2e]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div
                        className={`text-xs font-extrabold transition-colors ${
                          isActive ? "text-purple-600 dark:text-purple-300" : "text-slate-900 dark:text-white group-hover:text-purple-600"
                        }`}
                      >
                        {d.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-zinc-400">
                        <span>{new Date(d.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{d.document_count} files</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(d.id);
                      }}
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Digest Content View */}
          {activeDigest && (
            <div className="space-y-6 lg:col-span-3 animate-in fade-in duration-300">
              {/* Key Takeaways Card */}
              {activeDigest.key_takeaways && activeDigest.key_takeaways.length > 0 && (
                <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-6 shadow-xl backdrop-blur-xl dark:border-purple-500/30 dark:bg-[#15151c]/90">
                  <h4 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Key Strategic Takeaways
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {activeDigest.key_takeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Markdown Executive Summary */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-white/5">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {activeDigest.title}
                    </h2>
                    <div className="mt-1 text-xs text-slate-400">
                      Generated on {new Date(activeDigest.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          `# ${activeDigest.title}\n\n${activeDigest.summary_markdown}`
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                      title="Copy Executive Report"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                      <span>{copied ? "Copied" : "Copy Report"}</span>
                    </button>

                    <Link
                      href={`/chat?q=${encodeURIComponent(`Let's discuss the latest workspace executive digest "${activeDigest.title}". What are the biggest risks and action priorities?`)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                      title="Discuss Digest in AI Chat"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Discuss with AI</span>
                    </Link>
                  </div>
                </div>

                <div className="prose prose-indigo max-w-none dark:prose-invert text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-zinc-200 whitespace-pre-wrap">
                  {activeDigest.summary_markdown}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
