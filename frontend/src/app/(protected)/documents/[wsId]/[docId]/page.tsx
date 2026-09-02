"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  FileImage,
  File,
  Clock,
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
  FileSignature,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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
  const { user } = useAuth();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [chunkSearch, setChunkSearch] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  const targetWsId = params.wsId || workspace?.id;

  // Auto-sync active workspace if URL param points to another workspace the user belongs to
  useEffect(() => {
    if (params.wsId && workspaces.length > 0 && workspace?.id !== params.wsId) {
      const match = workspaces.find((w) => w.id === params.wsId);
      if (match) {
        select(match);
      }
    }
  }, [params.wsId, workspaces, workspace?.id, select]);

  const load = useCallback(async () => {
    if (!targetWsId || !params.docId) return;
    try {
      const d = await api.getDocument(targetWsId, params.docId);
      setDoc(d);
      setChunks(await api.getDocumentChunks(targetWsId, d.id));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [targetWsId, params.docId]);

  useEffect(() => {
    void load();
  }, [load]);

  // poll while processing
  useEffect(() => {
    if (!doc || (doc.status !== "pending" && doc.status !== "processing")) return;
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [doc, load]);

  // resolve role
  useEffect(() => {
    if (!targetWsId || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const members = await api.listMembers(targetWsId);
        if (!cancelled) {
          setMyRole(members.find((m) => m.email === user.email)?.role ?? null);
        }
      } catch {
        if (!cancelled) setMyRole(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetWsId, user]);

  async function handleDelete() {
    if (!targetWsId || !doc) return;
    try {
      await api.deleteDocument(targetWsId, doc.id);
      showToast("success", `"${doc.title}" moved to trash`);
      router.push("/documents");
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  function handleCopyAll() {
    if (chunks.length === 0) return;
    const fullText = chunks.map((c) => `--- Chunk #${c.ordinal} ---\n${c.content}`).join("\n\n");
    void navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    showToast("success", "All document chunks copied to clipboard");
    setTimeout(() => setCopiedAll(false), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-24 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-8 w-2/3 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="flex gap-3">
            <div className="h-7 w-20 rounded-full bg-slate-100 dark:bg-white/5" />
            <div className="h-7 w-24 rounded-full bg-slate-100 dark:bg-white/5" />
          </div>
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#151522]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#13111f]">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <p className="mb-3 text-sm font-semibold text-red-600">
          {error ?? "Document not found."}
        </p>
        <Link
          href="/documents"
          className="inline-flex items-center gap-1 text-sm font-bold text-purple-600 hover:underline"
        >
          ← Back to documents
        </Link>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Pending" },
    processing: { icon: Loader2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", label: "Processing" },
    ready: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", label: "Ready" },
    failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", label: "Failed" },
  }[doc.status];
  const StatusIcon = statusConfig.icon;

  const totalTokens = chunks.reduce((acc, c) => acc + (c.token_count || 0), 0);
  const filteredChunks = chunks.filter((c) =>
    !chunkSearch.trim() || c.content.toLowerCase().includes(chunkSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-purple-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href={`/chat?q=${encodeURIComponent(`Summarize key points from "${doc.title}" and identify critical obligations or takeaways.`)}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" /> Ask AI About This Doc
          </Link>
          {doc.file_type === "pdf" && (
            <Link
              href="/contracts"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:border-white/10 dark:bg-white/5 dark:text-indigo-400 transition-all"
              title="Audit in Contract Intelligence"
            >
              <FileSignature className="h-3.5 w-3.5" /> Audit Contract
            </Link>
          )}
        </div>
      </div>

      {/* Main Document Details Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/95">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/50 shadow-xs">
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
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusConfig.bg} ${statusConfig.color}`}
                >
                  <StatusIcon
                    className={`h-3 w-3 ${doc.status === "processing" ? "animate-spin" : ""}`}
                  />
                  {statusConfig.label}
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
          <ul className="space-y-2.5">
            {filteredChunks.map((c) => (
              <ChunkCard key={c.id} chunk={c} highlight={chunkSearch} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChunkCard({ chunk }: { chunk: ChunkItem; highlight?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const truncated = chunk.content.length > 320;
  const display = expanded || !truncated
    ? chunk.content
    : chunk.content.slice(0, 320) + "…";

  function copyChunk() {
    void navigator.clipboard.writeText(chunk.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <li className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-purple-200 dark:border-white/5 dark:bg-[#13111f]/90 dark:hover:border-purple-500/20">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
          <span>Chunk #{chunk.ordinal}</span>
          <span className="text-slate-400 dark:text-zinc-500">· ~{chunk.token_count} tokens</span>
        </span>

        <div className="flex items-center gap-2">
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
    </li>
  );
}
