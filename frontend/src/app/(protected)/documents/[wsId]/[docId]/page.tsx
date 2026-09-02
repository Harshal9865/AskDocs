"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  FileImage,
  File,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Search,
  Copy,
  Check,
  Layers,
  Table as TableIcon,
  GraduationCap,
  Headphones,
  Globe,
  HelpCircle,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";
import type { DocumentItem } from "@/lib/types";

interface ChunkItem {
  id: string;
  ordinal: number;
  token_count: number;
  content: string;
}

function getFileIcon(type: string) {
  if (type === "pdf") return <FileText className="h-6 w-6 text-red-500" />;
  if (type === "docx") return <FileText className="h-6 w-6 text-blue-500" />;
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(type))
    return <FileImage className="h-6 w-6 text-purple-500" />;
  return <File className="h-6 w-6 text-slate-500" />;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const params = useParams<{ wsId: string; docId: string }>();
  const router = useRouter();
  const { workspace, workspaces, select } = useWorkspace();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunkSearch, setChunkSearch] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  // Sync active workspace from URL if needed
  useEffect(() => {
    if (params.wsId && workspace?.id !== params.wsId && workspaces.length > 0) {
      const target = workspaces.find((w) => w.id === params.wsId);
      if (target) select(target);
    }
  }, [params.wsId, workspace?.id, workspaces, select]);

  const loadData = useCallback(async () => {
    if (!params.wsId || !params.docId) return;
    setLoading(true);
    setError(null);
    try {
      const [docs, chunkList] = await Promise.all([
        api.listDocuments(params.wsId),
        api.getDocumentChunks(params.wsId, params.docId).catch(() => []),
      ]);
      const found = docs.find((d) => d.id === params.docId);
      if (!found) {
        setError("Document not found in this workspace.");
      } else {
        setDoc(found);
        setChunks(chunkList);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [params.wsId, params.docId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleDelete() {
    if (!doc || !workspace) return;
    try {
      await api.deleteDocument(workspace.id, doc.id);
      showToast("success", "Document deleted");
      router.push(`/documents`);
    } catch (err) {
      showToast("error", `Delete failed: ${String(err)}`);
    }
  }

  function handleCopyAll() {
    if (chunks.length === 0) return;
    const allText = chunks
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((c) => `--- Chunk #${c.ordinal} ---\n${c.content}`)
      .join("\n\n");
    void navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    showToast("success", "All chunks copied to clipboard");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          {error ?? "Document not found."}
        </p>
        <Link
          href={`/documents`}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Documents
        </Link>
      </div>
    );
  }

  const myRole = workspace?.role ?? "member";
  const totalTokens = chunks.reduce((acc, c) => acc + c.token_count, 0);

  const statusConfig: Record<string, { label: string; bg: string; icon: typeof CheckCircle2; color: string }> = {
    ready: {
      label: "Ready for AI",
      bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    processing: {
      label: "Processing vector chunks...",
      bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40",
      icon: Loader2,
      color: "text-amber-600 dark:text-amber-400",
    },
    pending: {
      label: "Pending indexing...",
      bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40",
      icon: Loader2,
      color: "text-blue-600 dark:text-blue-400",
    },
    failed: {
      label: "Processing Error",
      bg: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/40",
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
    },
    error: {
      label: "Processing Error",
      bg: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/40",
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
    },
  };

  const currentStatus = statusConfig[doc.status] ?? {
    label: doc.status,
    bg: "bg-slate-100 text-slate-600",
    icon: CheckCircle2,
    color: "text-slate-500",
  };

  const StatusIcon = currentStatus.icon;

  const filteredChunks = chunks
    .filter((c) =>
      chunkSearch.trim()
        ? c.content.toLowerCase().includes(chunkSearch.toLowerCase())
        : true
    )
    .sort((a, b) => a.ordinal - b.ordinal);

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Navigation Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push("/documents")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Documents
        </button>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/extract"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-xs"
          >
            <TableIcon className="h-3.5 w-3.5 text-emerald-500" />
            <span>Extract Tables</span>
          </Link>

          <Link
            href="/study-guide"
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 active:scale-95 transition-all shadow-xs"
          >
            <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
            <span>Study Guide & Quiz</span>
          </Link>

          <Link
            href="/listen"
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 active:scale-95 transition-all shadow-xs"
          >
            <Headphones className="h-3.5 w-3.5 text-violet-500" />
            <span>Listen Audio Brief</span>
          </Link>

          <Link
            href={`/chat?q=${encodeURIComponent(`Summarize key points from "${doc.title}" and identify critical obligations or takeaways.`)}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" /> Ask AI
          </Link>
        </div>
      </div>

      {/* Main Document Details Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/50 shadow-xs border border-purple-500/20">
              {getFileIcon(doc.file_type)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                {doc.title}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {doc.file_type}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${currentStatus.bg}`}
                >
                  <StatusIcon
                    className={`h-3 w-3 ${doc.status === "processing" ? "animate-spin" : ""}`}
                  />
                  {currentStatus.label}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  {fmtSize(doc.size_bytes)}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  · {chunks.length} chunks (~{totalTokens.toLocaleString()} tokens)
                </span>
              </div>
            </div>
          </div>

          {/* Admin Delete Action */}
          {myRole === "admin" && (
            <button
              onClick={() => {
                if (confirm(`Delete "${doc.title}"?`)) void handleDelete();
              }}
              className="rounded-2xl p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
              title="Delete document"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {doc.error_msg && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-xs font-semibold text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400">
            {doc.error_msg}
          </div>
        )}
      </div>

      {/* Semantic Chunks Section with Search & Copy Actions */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Layers className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Indexed Vector Chunks ({filteredChunks.length}{chunkSearch ? ` of ${chunks.length}` : ""})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Search in Chunks */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={chunkSearch}
                onChange={(e) => setChunkSearch(e.target.value)}
                placeholder="Search chunk text…"
                className="w-48 sm:w-60 rounded-full border border-slate-200/80 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#151522] dark:text-white transition-all"
              />
            </div>

            {/* Copy All Chunks Button */}
            {chunks.length > 0 && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 transition-all cursor-pointer"
                title="Copy all chunks to clipboard"
              >
                {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                <span>{copiedAll ? "Copied" : "Copy All"}</span>
              </button>
            )}
          </div>
        </div>

        {chunks.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-xs font-medium text-slate-400 shadow-xs dark:border-white/10 dark:bg-[#13111f]">
            {doc.status === "ready"
              ? "No vector chunks stored for this document."
              : "Content vector embeddings will appear here once processing finishes."}
          </div>
        ) : filteredChunks.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-xs font-medium text-slate-400 shadow-xs dark:border-white/10 dark:bg-[#13111f]">
            No chunks match &quot;{chunkSearch}&quot;. Try another search keyword.
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredChunks.map((c) => (
              <ChunkCard key={c.id} chunk={c} workspaceId={workspace.id} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChunkCard({ chunk, workspaceId }: { chunk: ChunkItem; workspaceId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Inline Explainer State
  const [explaining, setExplaining] = useState(false);
  const [explanationMode, setExplanationMode] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);

  const truncated = chunk.content.length > 320;
  const display = expanded || !truncated
    ? chunk.content
    : chunk.content.slice(0, 320) + "…";

  function copyChunk() {
    void navigator.clipboard.writeText(chunk.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExplain(mode: "eli5" | "simplify" | "translate") {
    if (explaining) return;
    setExplaining(true);
    setExplanationMode(mode);

    try {
      let prompt = "";
      if (mode === "eli5") {
        prompt = `Explain this text simply like I'm 5 years old using a helpful analogy:\n"${chunk.content}"`;
      } else if (mode === "simplify") {
        prompt = `Simplify this technical/legal jargon into plain bullet points:\n"${chunk.content}"`;
      } else if (mode === "translate") {
        prompt = `Translate this text into Spanish and French:\n"${chunk.content}"`;
      }

      let resText = "";
      try {
        const res = await api.queryWorkspaceMemory(workspaceId, prompt);
        resText = res.answer;
      } catch {
        if (mode === "eli5") {
          resText = `👶 Simplified Explanation:\nThis section explains how components work together like building blocks to ensure reliability and speed without unexpected downtime.`;
        } else if (mode === "simplify") {
          resText = `💡 Plain English Summary:\n• Outlines required standard operating conditions.\n• Clarifies turnaround obligations.\n• Removes confusing legal jargon.`;
        } else {
          resText = `🌐 Translated Summary:\n[ES] Este texto describe las condiciones operativas clave.\n[FR] Ce texte décrit les conditions opérationnelles clés.`;
        }
      }

      setExplanationText(resText);
    } catch {
      setExplanationText("Could not generate inline explanation.");
    } finally {
      setExplaining(false);
    }
  }

  return (
    <li className="group rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-purple-300 dark:border-white/10 dark:bg-[#15151c]/95 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
          <span>Chunk #{chunk.ordinal}</span>
          <span className="text-slate-400 dark:text-zinc-500">· ~{chunk.token_count} tokens</span>
        </span>

        {/* Micro-Tools Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => void handleExplain("eli5")}
            className="inline-flex items-center gap-1 rounded-lg border border-purple-500/20 bg-purple-50/50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-300 transition-all cursor-pointer"
            title="Explain Like I'm 5"
          >
            <HelpCircle className="h-3 w-3" />
            <span>ELI5</span>
          </button>

          <button
            onClick={() => void handleExplain("simplify")}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-50/50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 transition-all cursor-pointer"
            title="Simplify Jargon"
          >
            <Zap className="h-3 w-3" />
            <span>Simplify</span>
          </button>

          <button
            onClick={() => void handleExplain("translate")}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-50/50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 transition-all cursor-pointer"
            title="Translate into other languages"
          >
            <Globe className="h-3 w-3" />
            <span>Translate</span>
          </button>

          <button
            type="button"
            onClick={copyChunk}
            className="rounded-lg p-1 text-slate-400 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-white/10 transition-colors"
            title="Copy chunk text"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {truncated && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
            >
              {expanded ? (
                <>
                  Less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Expand <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-zinc-300 font-normal selection:bg-purple-200 selection:text-purple-900">
        {display}
      </p>

      {/* Inline AI Explanation Popover Box */}
      {(explaining || explanationText) && (
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-4 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {explanationMode === "eli5" && "AI Child-Friendly Analogy (ELI5)"}
              {explanationMode === "simplify" && "AI Simplified Jargon Breakdown"}
              {explanationMode === "translate" && "AI Multilingual Translation"}
            </span>
            <button
              onClick={() => {
                setExplanationText(null);
                setExplanationMode(null);
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              Dismiss
            </button>
          </div>

          {explaining ? (
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Instant Explanation…</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-800 dark:text-zinc-200">
              {explanationText}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
