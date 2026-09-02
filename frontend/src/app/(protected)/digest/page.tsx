"use client";

import { useEffect, useState, useCallback } from "react";
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
  Layers,
} from "lucide-react";

export default function WorkspaceDigestPage() {
  const { workspace } = useWorkspace();
  const [digests, setDigests] = useState<WorkspaceDigest[]>([]);
  const [activeDigest, setActiveDigest] = useState<WorkspaceDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      <div className="flex h-64 items-center justify-center text-gray-500">
        Please select a workspace to view AI digests.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner & Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 p-6 shadow-sm dark:border-indigo-950/40 dark:from-indigo-950/30 dark:via-gray-900 dark:to-purple-950/20 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" /> Proactive AI Intelligence
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            Workspace Executive Digest
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Automated weekly AI synthesis of documents, contract obligations, and key team takeaways.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
        >
          {generating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Synthesizing AI Digest...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate Fresh AI Digest
            </>
          )}
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeDigest ? activeDigest.document_count : 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Documents Analyzed</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeDigest ? activeDigest.contract_alerts_count : 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Contract Obligations</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeDigest ? activeDigest.key_takeaways?.length || 0 : 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Key Takeaways</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {activeDigest ? new Date(activeDigest.created_at).toLocaleDateString() : "N/A"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Last Digest Date</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : digests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No Weekly Digests Generated Yet
          </h3>
          <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Click the button above to generate your first AI Executive Workspace Digest synthesizing your team&apos;s documents and obligations.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Generate First Digest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* History Sidebar */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" /> Digest Timeline
            </h3>
            <div className="space-y-2">
              {digests.map((d) => {
                const isActive = activeDigest?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setActiveDigest(d)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                      isActive
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/30"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                    }`}
                  >
                    <div>
                      <div
                        className={`text-sm font-semibold ${
                          isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {d.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
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
            <div className="space-y-6 lg:col-span-3">
              {/* Key Takeaways Card */}
              {activeDigest.key_takeaways && activeDigest.key_takeaways.length > 0 && (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 p-6 shadow-sm dark:border-indigo-950/40 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/10">
                  <h4 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                    <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Key Strategic Takeaways
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {activeDigest.key_takeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Markdown Executive Summary */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {activeDigest.title}
                    </h2>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Generated on {new Date(activeDigest.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <Layers className="h-4 w-4" /> AI Synthesized Report
                  </div>
                </div>

                <div className="prose prose-indigo max-w-none dark:prose-invert text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
