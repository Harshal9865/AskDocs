"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";
import { MemoryGraphOut, WorkspaceMemory } from "@/lib/types";
import { showToast } from "@/components/Toast";
import { exportToPdf } from "@/lib/pdf-export";
import {
  Brain,
  Calendar,
  CheckCircle2,
  FileSignature,
  FileText,
  Network,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  X,
  Zap,
  Copy,
} from "lucide-react";

export default function InstitutionalMemoryPage() {
  const { workspace } = useWorkspace();
  const [graphData, setGraphData] = useState<MemoryGraphOut | null>(null);
  const [memories, setMemories] = useState<WorkspaceMemory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [querying, setQuerying] = useState<boolean>(false);
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Transcript Ingestion Modal State
  const [transcriptModalOpen, setTranscriptModalOpen] = useState<boolean>(false);
  const [transcriptTitle, setTranscriptTitle] = useState<string>("");
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [ingesting, setIngesting] = useState<boolean>(false);

  const loadMemoryData = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    try {
      const [graph, memList] = await Promise.all([
        api.getWorkspaceMemoryGraph(workspace.id),
        api.getWorkspaceMemories(workspace.id),
      ]);
      setGraphData(graph);
      setMemories(memList);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    loadMemoryData();
  }, [loadMemoryData]);

  const exportMemoryLogPDF = () => {
    if (memories.length === 0) {
      showToast("error", "No organizational memories found to export.");
      return;
    }
    exportToPdf({
      title: "Permanent Institutional Memory & Decision Log",
      subtitle: `Enterprise Knowledge Graph • ${workspace?.name || "Workspace"}`,
      badge: `${memories.length} Permanent Records Indexed`,
      workspaceName: workspace?.name,
      sections: [
        {
          heading: "Executive Knowledge Summary",
          type: "callout",
          content: `This log records temporal organizational decisions, key agreements, policy exceptions, and team facts automatically preserved in the AskDocs Knowledge Graph.`,
        },
        ...memories.map((m, i) => ({
          heading: `Memory Record ${i + 1}: ${m.title || "Indexed Context"} (${m.source_type.toUpperCase()})`,
          type: "bullets" as const,
          bullets: [
            `<strong>Core Principle / Finding:</strong> ${m.summary}`,
            `<strong>Relevance / Entities:</strong> ${(m.entities || []).join(", ") || "General Workspace Context"}`,
            `<strong>Recorded Date:</strong> ${new Date(m.created_at).toLocaleDateString()}`,
          ],
        })),
      ],
    });
    showToast("success", "Preparing Memory Log PDF for print/download...");
  };

  const handleSearchMemory = async () => {
    if (!workspace?.id || !query.trim() || querying) return;
    setQuerying(true);
    try {
      const res = await api.queryWorkspaceMemory(workspace.id, query.trim());
      setQueryAnswer(res.answer);
      showToast("success", "Memory synthesis complete");
    } catch {
      showToast("error", "Failed to query workspace memory.");
    } finally {
      setQuerying(false);
    }
  };

  const handleIngestTranscript = async () => {
    if (!workspace?.id || !transcriptTitle.trim() || !transcriptText.trim() || ingesting) return;
    setIngesting(true);
    try {
      const newMem = await api.ingestMeetingTranscript(
        workspace.id,
        transcriptTitle.trim(),
        transcriptText.trim()
      );
      setMemories((prev) => [newMem, ...prev]);
      setTranscriptModalOpen(false);
      setTranscriptTitle("");
      setTranscriptText("");
      await loadMemoryData();
      showToast("success", "Meeting transcript ingested and graph updated!");
    } catch {
      showToast("error", "Failed to process meeting transcript.");
    } finally {
      setIngesting(false);
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (activeFilter === "all") return true;
    return m.source_type === activeFilter;
  });

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to view Institutional Memory.
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
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 backdrop-blur-md shadow-inner">
              <Brain className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span className="tracking-wider">PERMANENT ORGANIZATIONAL BRAIN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              Institutional Memory & Knowledge Graph
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Permanently index workspace decisions, policy exceptions, and document relationships.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={exportMemoryLogPDF}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Brain className="h-4 w-4" />
              <span>Download PDF Log</span>
            </button>

            <button
              onClick={() => setTranscriptModalOpen(true)}
              className="group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1db954] via-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-[#1db954]/25 hover:shadow-[#1db954]/45 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              <span>Add Transcript</span>
            </button>

            <button
              onClick={loadMemoryData}
              disabled={loading}
              className="flex items-center justify-center rounded-2xl bg-slate-800/80 p-2.5 text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Sync Mind Map"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Decision Timeline Search Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 sm:p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Ask Institutional Memory: e.g. What were the key decisions made regarding Client X last month?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchMemory()}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 pl-11 pr-4 py-3 text-xs font-bold text-slate-900 outline-none backdrop-blur-md transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
            />
          </div>
          <button
            onClick={handleSearchMemory}
            disabled={!query.trim() || querying}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            {querying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Querying Memory…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Query Memory
              </>
            )}
          </button>
        </div>

        {/* Suggested Queries Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Suggested Queries:
          </span>
          {[
            "Key decisions from recent meetings",
            "What approvals were granted this month?",
            "Roadmap priorities & timeline commitments",
            "Contract exceptions & special terms",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuery(prompt);
              }}
              className="rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 hover:border-purple-300 hover:bg-white hover:text-purple-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-purple-500/30 dark:hover:text-purple-400 transition-all cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* AI Decision Answer Banner */}
        {queryAnswer && (
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-5 shadow-lg backdrop-blur-md animate-in fade-in duration-300 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-300">
              <Zap className="h-4 w-4 text-purple-500" />
              <span>INSTITUTIONAL MEMORY TIMELINE ANSWER</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {queryAnswer}
            </p>
          </div>
        )}
      </div>

      {/* Visual Knowledge Mind Map */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#131220] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
            <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span>Workspace Knowledge Mind Map</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {graphData?.nodes?.length || 0} Connected Nodes
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider">Mapping Workspace Knowledge Nodes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {graphData?.nodes.map((node) => (
              <div
                key={node.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  node.type === "root"
                    ? "border-purple-500 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20"
                    : node.type === "document"
                    ? "border-slate-200/80 bg-slate-50/60 hover:border-indigo-500/40 dark:border-white/10 dark:bg-[#1f1f2e]"
                    : node.type === "contract"
                    ? "border-slate-200/80 bg-slate-50/60 hover:border-amber-500/40 dark:border-white/10 dark:bg-[#1f1f2e]"
                    : "border-slate-200/80 bg-slate-50/60 hover:border-emerald-500/40 dark:border-white/10 dark:bg-[#1f1f2e]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      node.type === "root"
                        ? "bg-white/20 text-white"
                        : node.type === "document"
                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : node.type === "contract"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {node.type === "document" ? (
                        <FileText className="h-4 w-4" />
                      ) : node.type === "contract" ? (
                        <FileSignature className="h-4 w-4" />
                      ) : node.type === "decision" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </div>

                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      node.type === "root" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-300"
                    }`}>
                      {node.type}
                    </span>
                  </div>

                  <h4 className={`text-xs font-black truncate ${node.type === "root" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {node.label}
                  </h4>
                  <p className={`mt-1 text-[11px] leading-relaxed line-clamp-2 ${node.type === "root" ? "text-purple-100" : "text-slate-500 dark:text-zinc-400"}`}>
                    {node.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Memory Records List */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "all", label: "All Memory Records", count: memories.length },
              { id: "decision", label: "Decisions & Approvals", count: memories.filter((m) => m.source_type === "decision").length },
              { id: "contract", label: "Contract Obligations", count: memories.filter((m) => m.source_type === "contract").length },
              { id: "chat", label: "Meeting Transcripts & Calls", count: memories.filter((m) => m.source_type === "chat").length },
              { id: "document", label: "Document Syntheses", count: memories.filter((m) => m.source_type === "document").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeFilter === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-105"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${activeFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-300"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Items */}
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-purple-500/30 bg-purple-500/5 p-12 text-center backdrop-blur-sm animate-in fade-in duration-300">
            <Brain className="h-10 w-10 text-purple-500 mb-3 animate-bounce" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Memory Records Indexed Yet</h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
              Click &quot;Add Meeting Transcript&quot; above to ingest call summaries, or execute chat approvals in Office Chats to populate memory records automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 hover:border-purple-500/40 hover:bg-white hover:shadow-lg hover:shadow-purple-500/5 dark:border-white/5 dark:bg-[#1a1a24]/60 dark:hover:bg-[#1f1f2e] transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {mem.title}
                    </span>
                    <span className="inline-block rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-600 dark:text-purple-300 border border-purple-500/30">
                      {mem.source_type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{mem.summary}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-purple-500" />
                      <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                    </span>
                    {mem.entities?.map((ent, idx) => (
                      <span key={idx} className="flex items-center gap-1 rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-zinc-300">
                        <Tag className="h-3 w-3 text-purple-500" />
                        <span>{ent}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(`${mem.title}\n\n${mem.summary}`);
                      alert("Copied memory record to clipboard");
                    }}
                    className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-500 hover:bg-purple-50 hover:text-purple-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-all cursor-pointer"
                    title="Copy record"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <Link
                    href={`/chat?q=${encodeURIComponent(`Provide full context and analyze the decision "${mem.title}": ${mem.summary}`)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-all"
                    title="Ask AI in Chat"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ask AI</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Meeting Transcript */}
      {transcriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-[#15151c]/95 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Add Meeting Transcript / Call Notes</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Gemini will extract key decisions & index into memory</p>
                </div>
              </div>
              <button
                onClick={() => setTranscriptModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">Meeting / Call Title:</label>
              <input
                type="text"
                placeholder="e.g. Client X Strategy & SLA Alignment Meeting"
                value={transcriptTitle}
                onChange={(e) => setTranscriptTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none dark:border-white/15 dark:bg-[#1f1f2e] dark:text-white"
              />
            </div>

            {/* Transcript Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">Paste Transcript / Notes:</label>
              <textarea
                rows={5}
                placeholder="Paste call notes, Zoom transcript, or meeting minutes here…"
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs font-medium text-slate-800 outline-none dark:border-white/15 dark:bg-[#1f1f2e] dark:text-white leading-relaxed resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                onClick={() => setTranscriptModalOpen(false)}
                className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!transcriptTitle.trim() || !transcriptText.trim() || ingesting}
                onClick={handleIngestTranscript}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {ingesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Indexing Transcript…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Ingest into Memory
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
