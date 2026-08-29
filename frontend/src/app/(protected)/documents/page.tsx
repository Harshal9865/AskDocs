"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";
import type { DocumentItem } from "@/lib/types";

const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<
  DocumentItem["status"],
  { bg: string; text: string; icon: typeof Clock; label: string }
> = {
  pending: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: Clock, label: "Pending" },
  processing: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", icon: Loader2, label: "Processing" },
  ready: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2, label: "Ready" },
  failed: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", icon: AlertCircle, label: "Failed" },
};

type SortKey = "date" | "name" | "size" | "status";

interface UploadItem {
  id: number;
  file: File;
  status: "queued" | "uploading" | "done" | "failed";
  error?: string;
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

const CONCURRENCY = 3;

export default function DocumentsPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();
  const getInitialView = () => {
    if (typeof window === "undefined") return "workspace" as const;
    return new URLSearchParams(window.location.search).get("view") === "mine" ? "mine" as const : "workspace" as const;
  };
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [viewMode, setViewMode] = useState<"workspace" | "mine">(getInitialView());

  // upload state
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadId = useRef(0);

  const load = useCallback(async () => {
    try {
      if (viewMode === "mine") {
        const mine = await api.listMyDocuments();
        setDocs(mine);
        setTotalCount(mine.length);
      } else {
        if (!workspace) return;
        const docsResult = await api.listDocuments(workspace.id);
        let count = docsResult.length;
        try {
          const c = await api.documentCount(workspace.id);
          count = c.count;
        } catch {
          // fallback: use list length if count endpoint not yet deployed (old backend)
        }
        setDocs(docsResult);
        setTotalCount(count);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace, viewMode]);

  // sync viewMode from URL (?view=mine) on popstate
  useEffect(() => {
    const onPop = () => {
      const v = new URLSearchParams(window.location.search).get("view") === "mine" ? "mine" as const : "workspace" as const;
      setViewMode((prev) => (prev !== v ? v : prev));
      setPage(0);
      setSelected(new Set());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // poll while processing
  useEffect(() => {
    const hasActive = docs.some((d) => d.status === "pending" || d.status === "processing");
    if (!hasActive) return;
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [docs, load]);

  // resolve role
  useEffect(() => {
    if (!workspace || !user || viewMode === "mine") {
      setMyRole(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const members = await api.listMembers(workspace.id);
        if (!cancelled) setMyRole(members.find((m) => m.email === user.email)?.role ?? null);
      } catch {
        if (!cancelled) setMyRole(null);
      }
    })();
    return () => { cancelled = true; };
  }, [workspace, user, viewMode]);

  // parallel upload
  async function runUploadQueue(queue: UploadItem[]) {
    if (!workspace) return;
    const wsId = workspace.id;
    let idx = 0;
    async function next() {
      while (idx < queue.length) {
        const item = queue[idx++];
        setUploadQueue((q) => q.map((x) => x.id === item.id ? { ...x, status: "uploading" } : x));
        try {
          await api.uploadDocument(wsId, item.file);
          setUploadQueue((q) => q.map((x) => x.id === item.id ? { ...x, status: "done" } : x));
        } catch (err) {
          setUploadQueue((q) => q.map((x) => x.id === item.id ? { ...x, status: "failed", error: (err as Error).message } : x));
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => next()));
    await load();
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const items: UploadItem[] = Array.from(fileList).map((file) => ({
      id: ++uploadId.current,
      file,
      status: "queued",
    }));
    setUploadQueue(items);
    setUploading(true);
    void runUploadQueue(items).then(() => {
      const done = items.filter((i) => i.status === "done").length;
      const failed = items.filter((i) => i.status === "failed").length;
      if (failed === 0) {
        showToast("success", `${done} file${done > 1 ? "s" : ""} uploaded`);
      } else {
        showToast("error", `${done} uploaded, ${failed} failed`);
      }
      setUploading(false);
      setTimeout(() => setUploadQueue([]), 3000);
    });
  }

  async function remove(docId: string, title: string) {
    const wsId = workspace?.id ?? docs.find((d) => d.id === docId)?.workspace_id;
    if (!wsId) return;
    try {
      await api.deleteDocument(wsId, docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      setTotalCount((c) => c - 1);
      showToast("success", `"${title}" moved to trash`);
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  async function retryDoc(docId: string) {
    const wsId = workspace?.id ?? docs.find((d) => d.id === docId)?.workspace_id;
    if (!wsId) return;
    try {
      await api.retryDocument(wsId, docId);
      setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: "pending", error_msg: null } : d));
      showToast("success", "Reprocessing document");
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  async function bulkDelete() {
    if (!workspace || selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} document${selected.size > 1 ? "s" : ""}?`)) return;
    setBulkBusy(true);
    try {
      await api.bulkDeleteDocuments(workspace.id, Array.from(selected));
      setDocs((prev) => prev.filter((d) => !selected.has(d.id)));
      setTotalCount((c) => c - selected.size);
      setSelected(new Set());
      showToast("success", `${selected.size} document${selected.size > 1 ? "s" : ""} moved to trash`);
    } catch (err) {
      showToast("error", (err as Error).message);
    } finally {
      setBulkBusy(false);
    }
  }

  const filtered = useMemo(() => {
    let result = docs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) => d.title.toLowerCase().includes(q) || d.file_type.toLowerCase().includes(q),
      );
    }
    result = [...result].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "size") return b.size_bytes - a.size_bytes;
      if (sort === "status") return a.status.localeCompare(b.status);
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });
    return result;
  }, [docs, search, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const allOnPageSelected = paged.length > 0 && paged.every((d) => selected.has(d.id));

  function toggleSelectAll() {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((d) => next.delete(d.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((d) => next.add(d.id));
        return next;
      });
    }
  }

  function switchView(v: "workspace" | "mine") {
    setViewMode(v);
    setPage(0);
    setSelected(new Set());
    const params = new URLSearchParams(window.location.search);
    if (v === "mine") params.set("view", "mine");
    else params.delete("view");
    const qs = params.toString();
    router.replace(qs ? `/documents?${qs}` : "/documents");
  }

  function docHref(d: DocumentItem) {
    const wsId = d.workspace_id || workspace?.id;
    return wsId ? `/documents/${wsId}/${d.id}` : "#";
  }

  if (!workspace && viewMode === "workspace") {
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
          <h1 className="text-xl font-bold">{viewMode === "mine" ? "My Uploads" : "Documents"}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {viewMode === "mine"
              ? `${totalCount} document${totalCount !== 1 ? "s" : ""} you uploaded`
              : `${totalCount} document${totalCount !== 1 ? "s" : ""} in this workspace`}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-[#1a1a1a]">
          <button
            onClick={() => switchView("workspace")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "workspace"
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-white/5"
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => switchView("mine")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "mine"
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-white/5"
            }`}
          >
            My Uploads
          </button>
        </div>
      </div>

      {/* Upload zone - only in workspace mode */}
      {viewMode === "workspace" && (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && fileInput.current?.click()}
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
          onChange={(e) => { handleFiles(e.target.files); if (e.target) e.target.value = ""; }}
        />
        {uploadQueue.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              Uploading {uploadQueue.filter((i) => i.status === "done").length}/{uploadQueue.length}
            </div>
            <div className="mx-auto max-w-sm space-y-1">
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs dark:bg-white/5">
                  <div className="min-w-0 flex-1 truncate">{item.file.name}</div>
                  {item.status === "queued" && <Clock className="h-3 w-3 text-slate-400" />}
                  {item.status === "uploading" && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
                  {item.status === "done" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                  {item.status === "failed" && <AlertCircle className="h-3 w-3 text-red-500" />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Drop files here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-400">
              PDF (incl. scanned/handwritten), DOCX, MD, TXT, PNG, JPG, WEBP, GIF · Max 20 MB
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Scanned & handwritten PDFs are auto-transcribed with Gemini — may take 10-20s per page
            </p>
          </>
        )}
      </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}

      {docs.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search documents\u2026"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-zinc-400"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sort === "date" ? "Date" : sort === "name" ? "Name" : sort === "size" ? "Size" : "Status"}
              <ChevronDown className="h-3 w-3" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 z-50 mt-1 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#242424]">
                  {(["date", "name", "size", "status"] as SortKey[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSort(s); setSortOpen(false); setPage(0); }}
                      className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-xs ${
                        sort === s ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-white/5"
                      }`}
                    >
                      {s === "date" ? "Date (newest)" : s === "name" ? "Name (A\u2013Z)" : s === "size" ? "Size (largest)" : "Status"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {selected.size > 0 && myRole === "admin" && (
            <button
              onClick={() => void bulkDelete()}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selected.size}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-slate-200 dark:bg-white/10" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-3 w-1/5 rounded bg-slate-100 dark:bg-white/5" />
                </div>
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
        <>
          {/* select all header */}
          {myRole === "admin" && (
            <div className="mb-1 flex items-center gap-3 px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <button
                onClick={toggleSelectAll}
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  allOnPageSelected
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 bg-white dark:border-zinc-600 dark:bg-[#1a1a1a]"
                }`}
              >
                {allOnPageSelected && <CheckCircle2 className="h-3 w-3" />}
              </button>
              <span>Select all</span>
            </div>
          )}

          <ul className="space-y-2">
            {paged.map((d) => {
              const sc = STATUS_CONFIG[d.status];
              const StatusIcon = sc.icon;
              return (
                <li
                  key={d.id}
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-sm dark:border-white/5 dark:bg-[#1a1a1a] dark:hover:border-white/10"
                >
                  {myRole === "admin" && (
                    <button
                      onClick={() => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
                          return next;
                        });
                      }}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected.has(d.id)
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 bg-white dark:border-zinc-600 dark:bg-[#1a1a1a]"
                      }`}
                    >
                      {selected.has(d.id) && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                  )}
                  <div className="shrink-0">{getFileIcon(d.file_type)}</div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={docHref(d)}
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
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}
                    >
                      <StatusIcon className={`h-3 w-3 ${d.status === "processing" ? "animate-spin" : ""}`} />
                      {sc.label}
                    </span>
                    {d.status === "failed" && (
                      <button
                        onClick={() => void retryDoc(d.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 dark:text-zinc-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                        title="Retry"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    {(myRole === "admin" || viewMode === "mine") && (
                      <button
                        onClick={(e) => { e.preventDefault(); if (confirm(`Delete "${d.title}"?`)) void remove(d.id, d.title); }}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {page * PAGE_SIZE + 1}\u2013{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
