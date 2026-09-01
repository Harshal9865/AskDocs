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

  // parallel upload — returns { done, failed } counts tracked live
  async function runUploadQueue(queue: UploadItem[]): Promise<{ done: number; failed: number }> {
    if (!workspace) return { done: 0, failed: queue.length };
    const wsId = workspace.id;
    let idx = 0;
    let done = 0;
    let failed = 0;
    async function next() {
      while (idx < queue.length) {
        const item = queue[idx++];
        setUploadQueue((q) => q.map((x) => x.id === item.id ? { ...x, status: "uploading" } : x));
        try {
          await api.uploadDocument(wsId, item.file);
          done++;
          setUploadQueue((q) => q.map((x) => x.id === item.id ? { ...x, status: "done" } : x));
        } catch (err) {
          failed++;
          setUploadQueue((q) => q.map((x) => x.id === item.id ? { ...x, status: "failed", error: (err as Error).message } : x));
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => next()));
    await load();
    return { done, failed };
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
    void runUploadQueue(items).then(({ done, failed }) => {
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
    <div className="relative mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200">
            {viewMode === "mine" ? "My Uploads" : "Documents"}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {viewMode === "mine"
              ? `${totalCount} document${totalCount !== 1 ? "s" : ""} you uploaded`
              : `${totalCount} document${totalCount !== 1 ? "s" : ""} indexed in this workspace`}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 p-1 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90">
          <button
            onClick={() => switchView("workspace")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === "workspace"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => switchView("mine")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === "mine"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
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
          className={`cursor-pointer rounded-3xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-300 ${
            dragOver
              ? "border-purple-500 bg-purple-50/80 shadow-lg shadow-purple-500/10 dark:border-purple-400 dark:bg-purple-950/40"
              : "border-slate-200/90 bg-white/70 hover:border-purple-400/80 hover:bg-purple-50/30 dark:border-white/10 dark:bg-[#13111f]/70 dark:hover:border-purple-500/30"
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
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400" />
                Uploading & Processing {uploadQueue.filter((i) => i.status === "done").length}/{uploadQueue.length}
              </div>
              <div className="mx-auto max-w-sm space-y-1.5">
                {uploadQueue.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-xl bg-slate-50/90 px-3 py-1.5 text-xs dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-zinc-200">{item.file.name}</div>
                    {item.status === "queued" && <Clock className="h-3.5 w-3.5 text-slate-400" />}
                    {item.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />}
                    {item.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    {item.status === "failed" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 shadow-xs">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Drop files here or click to browse
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-400">
                PDF (including scanned/handwritten), DOCX, MD, TXT, PNG, JPG, WEBP, GIF · Max 20 MB
              </p>
              <p className="mt-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                ✨ Scanned & handwritten documents are auto-transcribed using Gemini Multimodal AI
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-xs font-bold text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">{error}</p>
      )}

      {docs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search documents by name or extension…"
              className="w-full rounded-2xl border border-slate-200/80 bg-white/80 py-2.5 pl-10 pr-3 text-xs sm:text-sm font-medium outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#13111f]/90 dark:text-white"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-300"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              {sort === "date" ? "Date" : sort === "name" ? "Name" : sort === "size" ? "Size" : "Status"}
              <ChevronDown className="h-3 w-3" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 z-50 mt-1.5 w-40 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#1c1930]">
                  {(["date", "name", "size", "status"] as SortKey[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSort(s); setSortOpen(false); setPage(0); }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-xs font-semibold ${
                        sort === s ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" : "text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-white/5"
                      }`}
                    >
                      {s === "date" ? "Date (newest)" : s === "name" ? "Name (A–Z)" : s === "size" ? "Size (largest)" : "Status"}
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
              className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-500/20 hover:bg-red-700 transition-all disabled:opacity-50"
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
            <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/5 dark:bg-[#13111f]/90">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded bg-slate-200 dark:bg-white/10" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-3 w-1/5 rounded bg-slate-100 dark:bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-10 text-center shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" />
          {search ? (
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No documents match &ldquo;{search}&rdquo;</p>
          ) : (
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              No documents yet. Upload your first document above to start indexing for AI queries.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Select all header */}
          {myRole === "admin" && (
            <div className="flex items-center gap-3 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              <button
                onClick={toggleSelectAll}
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  allOnPageSelected
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-slate-300 bg-white dark:border-zinc-600 dark:bg-[#13111f]"
                }`}
              >
                {allOnPageSelected && <CheckCircle2 className="h-3 w-3" />}
              </button>
              <span>Select all on page</span>
            </div>
          )}

          <ul className="space-y-2">
            {paged.map((d) => {
              const sc = STATUS_CONFIG[d.status];
              const StatusIcon = sc.icon;
              return (
                <li
                  key={d.id}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-2xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300/80 hover:shadow-md hover:shadow-purple-500/5 dark:border-white/10 dark:bg-[#13111f]/90 dark:hover:border-purple-500/30"
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
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-slate-300 bg-white dark:border-zinc-600 dark:bg-[#13111f]"
                      }`}
                    >
                      {selected.has(d.id) && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                  )}
                  <div className="shrink-0">{getFileIcon(d.file_type)}</div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={docHref(d)}
                      className="truncate text-xs sm:text-sm font-bold text-slate-900 hover:text-purple-600 dark:text-white dark:hover:text-purple-400 transition-colors"
                    >
                      {d.title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400 dark:text-zinc-500">
                      <span className="uppercase font-bold tracking-wider">{d.file_type}</span>
                      <span>·</span>
                      <span>{fmtSize(d.size_bytes)}</span>
                      {d.created_at && (
                        <>
                          <span>·</span>
                          <span>{timeAgo(d.created_at)}</span>
                        </>
                      )}
                      {d.error_msg && (
                        <>
                          <span>·</span>
                          <span className="text-red-500 font-medium">{d.error_msg}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text}`}
                    >
                      <StatusIcon className={`h-3 w-3 ${d.status === "processing" ? "animate-spin" : ""}`} />
                      {sc.label}
                    </span>
                    {d.status === "failed" && (
                      <button
                        onClick={() => void retryDoc(d.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 dark:text-zinc-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 transition-colors"
                        title="Retry"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    {(myRole === "admin" || viewMode === "mine") && (
                      <button
                        onClick={(e) => { e.preventDefault(); if (confirm(`Delete "${d.title}"?`)) void remove(d.id, d.title); }}
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
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
            <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-zinc-400">
              <span>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-xl border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-bold">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-xl border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/5"
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
