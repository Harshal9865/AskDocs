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
  if (type === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (type === "docx") return <FileText className="h-5 w-5 text-blue-500" />;
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(type))
    return <FileImage className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-slate-500" />;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const params = useParams<{ wsId: string; docId: string }>();
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      const d = await api.getDocument(workspace.id, params.docId);
      setDoc(d);
      setChunks(await api.getDocumentChunks(workspace.id, d.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace, params.docId]);

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
    if (!workspace || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const members = await api.listMembers(workspace.id);
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
  }, [workspace, user]);

  async function handleDelete() {
    if (!workspace || !doc) return;
    try {
      await api.deleteDocument(workspace.id, doc.id);
      showToast("success", `"${doc.title}" moved to trash`);
      router.push("/documents");
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-6 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
          <div className="flex gap-3">
            <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-white/5" />
            <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-white/5" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#1a1a1a]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
        <p className="mb-3 text-sm font-medium text-red-600">
          {error ?? "Document not found."}
        </p>
        <Link
          href="/documents"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          \u2190 Back to documents
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

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-zinc-400 dark:hover:bg-white/5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <div className="flex items-start gap-3">
          {getFileIcon(doc.file_type)}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-slate-800 dark:text-zinc-100">
              {doc.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-white/10 dark:text-zinc-400">
                {doc.file_type}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
              >
                <StatusIcon
                  className={`h-3 w-3 ${doc.status === "processing" ? "animate-spin" : ""}`}
                />
                {statusConfig.label}
              </span>
              <span className="text-xs text-slate-400">{fmtSize(doc.size_bytes)}</span>
              <span className="text-xs text-slate-400">{chunks.length} chunks</span>
            </div>
          </div>
          {myRole === "admin" && (
            <button
              onClick={() => {
                if (confirm(`Delete "${doc.title}"?`)) void handleDelete();
              }}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              title="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {doc.error_msg && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            {doc.error_msg}
          </div>
        )}
      </div>

      {/* Chunks */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
          Indexed content ({chunks.length} chunk{chunks.length !== 1 ? "s" : ""})
        </h2>
        {chunks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
            {doc.status === "ready"
              ? "No chunks stored."
              : "Content appears here once processing finishes."}
          </div>
        ) : (
          <ul className="space-y-2">
            {chunks.map((c) => (
              <ChunkCard key={c.id} chunk={c} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChunkCard({ chunk }: { chunk: ChunkItem }) {
  const [expanded, setExpanded] = useState(false);
  const truncated = chunk.content.length > 300;
  const display = expanded || !truncated
    ? chunk.content
    : chunk.content.slice(0, 300) + "\u2026";

  return (
    <li className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#1a1a1a]">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
          Chunk #{chunk.ordinal} \u00b7 ~{chunk.token_count} tokens
        </span>
        {truncated && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 hover:text-indigo-500"
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
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
        {display}
      </p>
    </li>
  );
}
