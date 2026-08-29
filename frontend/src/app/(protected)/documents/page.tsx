"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  FileImage,
  File,
  Search,
  Upload,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";
import type { DocumentItem } from "@/lib/types";

const STATUS_CONFIG: Record<
  DocumentItem["status"],
  { bg: string; text: string; icon: typeof Clock; label: string }
> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    icon: Clock,
    label: "Pending",
  },
  processing: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    icon: Loader2,
    label: "Processing",
  },
  ready: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
    label: "Ready",
  },
  failed: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    icon: AlertCircle,
    label: "Failed",
  },
};

function getFileIcon(type: string) {
  if (type === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (type === "docx") return <FileText className="h-5 w-5 text-blue-500" />;
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(type))
    return <FileImage className="h-5 w-5 text-purple-500" />;
  if (["md", "txt"].includes(type)) return <File className="h-5 w-5 text-slate-500" />;
  return <File className="h-5 w-5 text-slate-400" />;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DocumentsPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [myRole, setMyRole] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      setDocs(await api.listDocuments(workspace.id));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // load + poll while processing
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const hasActive = docs.some(
      (d) => d.status === "pending" || d.status === "processing",
    );
    if (!hasActive) return;
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [docs, load]);

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

  const filtered = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.file_type.toLowerCase().includes(q),
    );
  }, [docs, search]);

  async function upload(files: FileList | null) {
    if (!workspace || !files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await api.uploadDocument(workspace.id, file);
      }
      await load();
      showToast("success", `${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      showToast("error", `Upload failed: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  async function remove(docId: string, title: string) {
    if (!workspace) return;
    try {
      await api.deleteDocument(workspace.id, docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      showToast("success", `"${title}" moved to trash`);
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  if (!workspace) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Create or select a workspace first.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Documents</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {docs.length} document{docs.length !== 1 ? "s" : ""} in this workspace
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
        onClick={() => fileInput.current?.click()}
        className={`mb-5 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/30"
            : "border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50 dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-indigo-400"
        }`}
      >
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,.docx,.md,.txt,.png,.jpg,.jpeg,.webp,.gif"
          hidden
          onChange={(e) => void upload(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-600">Uploading\u2026</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Drop files here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-400">
              PDF, DOCX, MD, TXT, PNG, JPG, WEBP, GIF \u00b7 Max 20 MB
            </p>
          </>
        )}
      </div>

      {/* Search */}
      {docs.length > 0 && (
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents\u2026"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:focus:border-indigo-500"
          />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#1a1a1a]"
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-slate-200 dark:bg-white/10" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-3 w-1/5 rounded bg-slate-100 dark:bg-white/5" />
                </div>
                <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" />
          {search ? (
            <p className="text-sm text-slate-500">No documents match &ldquo;{search}&rdquo;</p>
          ) : (
            <p className="text-sm text-slate-500">
              No documents yet. Upload your first one above to start asking questions.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((d) => {
            const sc = STATUS_CONFIG[d.status];
            const StatusIcon = sc.icon;
            return (
              <li
                key={d.id}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-sm dark:border-white/5 dark:bg-[#1a1a1a] dark:hover:border-white/10"
              >
                <div className="shrink-0">{getFileIcon(d.file_type)}</div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/documents/${workspace.id}/${d.id}`}
                    className="truncate text-sm font-medium text-slate-800 hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-400"
                  >
                    {d.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
                    <span className="uppercase font-semibold">{d.file_type}</span>
                    <span>\u00b7</span>
                    <span>{fmtSize(d.size_bytes)}</span>
                    {d.created_at && (
                      <>
                        <span>\u00b7</span>
                        <span>{timeAgo(d.created_at)}</span>
                      </>
                    )}
                    {d.error_msg && (
                      <>
                        <span>\u00b7</span>
                        <span className="text-red-500">{d.error_msg}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}
                  >
                    <StatusIcon
                      className={`h-3 w-3 ${d.status === "processing" ? "animate-spin" : ""}`}
                    />
                    {sc.label}
                  </span>
                  {myRole === "admin" && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Delete "${d.title}"?`)) void remove(d.id, d.title);
                      }}
                      className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
