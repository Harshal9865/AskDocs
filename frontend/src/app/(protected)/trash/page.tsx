"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";
import {
  FileText,
  MessageSquare,
  RotateCcw,
  Trash2,
  Loader2,
  Search,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Clock,
  ShieldAlert,
} from "lucide-react";

interface TrashedDoc {
  id: string;
  title: string;
  file_type: string;
  deleted_at: string;
}
interface TrashedConv {
  id: string;
  title: string;
  deleted_at: string;
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function getFileTypeBadge(fileType: string) {
  const type = (fileType || "").toLowerCase();
  if (type.includes("pdf")) return { label: "PDF", bg: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900/40" };
  if (type.includes("doc") || type.includes("word")) return { label: "DOCX", bg: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/40" };
  if (type.includes("txt") || type.includes("text")) return { label: "TXT", bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" };
  if (type.includes("png") || type.includes("jpg") || type.includes("jpeg") || type.includes("image")) return { label: "IMG", bg: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900/40" };
  return { label: "FILE", bg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/40" };
}

export default function TrashPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [tab, setTab] = useState<"documents" | "conversations">("documents");
  const [docs, setDocs] = useState<TrashedDoc[]>([]);
  const [convs, setConvs] = useState<TrashedConv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Multi-select & Batch States
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

  // Search, Filter & Sorting States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "docx" | "txt" | "image">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [fetchedDocs, fetchedConvs] = await Promise.all([
        api.trashDocuments(workspace.id),
        api.trashConversations(workspace.id),
      ]);
      setDocs(fetchedDocs);
      setConvs(fetchedConvs);
      if (user) {
        const members = await api.listMembers(workspace.id);
        setIsAdmin(members.find((m) => m.email === user.email)?.role === "admin");
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace, user]);

  useEffect(() => {
    void load();
  }, [load]);

  // Filtered and Sorted Documents
  const filteredDocs = useMemo(() => {
    return docs
      .filter((d) => {
        const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
        if (!matchesSearch) return false;
        if (typeFilter === "all") return true;
        const ft = (d.file_type || "").toLowerCase();
        if (typeFilter === "pdf") return ft.includes("pdf");
        if (typeFilter === "docx") return ft.includes("doc") || ft.includes("word");
        if (typeFilter === "txt") return ft.includes("txt") || ft.includes("text");
        if (typeFilter === "image") return ft.includes("png") || ft.includes("jpg") || ft.includes("jpeg") || ft.includes("image");
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime();
        if (sortBy === "oldest") return new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime();
        if (sortBy === "name-asc") return a.title.localeCompare(b.title);
        if (sortBy === "name-desc") return b.title.localeCompare(a.title);
        return 0;
      });
  }, [docs, searchQuery, typeFilter, sortBy]);

  // Selection helpers
  const isAllSelected = filteredDocs.length > 0 && filteredDocs.every((d) => selectedDocIds.has(d.id));
  const isSomeSelected = selectedDocIds.size > 0 && !isAllSelected;

  function toggleSelectDoc(id: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocs.map((d) => d.id)));
    }
  }

  // Batch Operations
  async function handleBatchRestore(targetIds?: string[]) {
    if (!workspace) return;
    const idsToRestore = targetIds || Array.from(selectedDocIds);
    if (idsToRestore.length === 0) return;

    setBatchBusy(true);
    setActionProgress(`Restoring ${idsToRestore.length} document${idsToRestore.length > 1 ? "s" : ""}…`);

    try {
      const results = await Promise.allSettled(
        idsToRestore.map((id) => api.restoreDocument(workspace.id, id))
      );
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        showToast("success", `Successfully restored ${successful} document${successful > 1 ? "s" : ""}`);
      }
      if (failed > 0) {
        showToast("error", `Failed to restore ${failed} document${failed > 1 ? "s" : ""}`);
      }

      setSelectedDocIds(new Set());
      await load();
    } finally {
      setBatchBusy(false);
      setActionProgress(null);
    }
  }

  async function handleBatchPurge(targetIds?: string[]) {
    if (!workspace) return;
    const idsToPurge = targetIds || Array.from(selectedDocIds);
    if (idsToPurge.length === 0) return;

    setBatchBusy(true);
    setActionProgress(`Permanently deleting ${idsToPurge.length} document${idsToPurge.length > 1 ? "s" : ""}…`);

    try {
      const results = await Promise.allSettled(
        idsToPurge.map((id) => api.purgeDocument(workspace.id, id))
      );
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        showToast("success", `Permanently deleted ${successful} document${successful > 1 ? "s" : ""}`);
      }
      if (failed > 0) {
        showToast("error", `Failed to purge ${failed} document${failed > 1 ? "s" : ""}`);
      }

      setSelectedDocIds(new Set());
      await load();
    } finally {
      setBatchBusy(false);
      setActionProgress(null);
      setConfirmModal((prev) => ({ ...prev, open: false }));
    }
  }

  function promptPurgeSingle(doc: TrashedDoc) {
    setConfirmModal({
      open: true,
      title: "Permanently Delete Document",
      description: `Are you sure you want to permanently delete "${doc.title}"? This cannot be recovered.`,
      onConfirm: async () => {
        await handleBatchPurge([doc.id]);
      },
    });
  }

  function promptPurgeSelected() {
    const count = selectedDocIds.size;
    setConfirmModal({
      open: true,
      title: `Permanently Delete ${count} Document${count > 1 ? "s" : ""}`,
      description: `This will permanently delete ${count} selected document${count > 1 ? "s" : ""} and remove all indexing. This action cannot be reversed.`,
      onConfirm: async () => {
        await handleBatchPurge();
      },
    });
  }

  function promptEmptyTrash() {
    const count = docs.length;
    setConfirmModal({
      open: true,
      title: "Empty Entire Trash",
      description: `This will permanently delete all ${count} document${count > 1 ? "s" : ""} currently in trash. This action is irreversible.`,
      onConfirm: async () => {
        await handleBatchPurge(docs.map((d) => d.id));
      },
    });
  }

  if (!workspace) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center text-sm font-medium text-slate-500 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-400">
        Select a workspace first.
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200">
            Trash & Recovery
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Review deleted documents and conversations. Restore items or purge them permanently.
          </p>
        </div>

        {isAdmin && tab === "documents" && docs.length > 0 && (
          <button
            onClick={promptEmptyTrash}
            disabled={batchBusy}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-red-200/80 bg-red-50/80 px-4 py-2 text-xs font-bold text-red-700 shadow-xs hover:bg-red-100 hover:scale-105 active:scale-95 transition-all dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Empty Trash ({docs.length})
          </button>
        )}
      </div>

      {/* Capsule Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setTab("documents");
            setSelectedDocIds(new Set());
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            tab === "documents"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
              : "border border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Documents ({docs.length})
        </button>
        <button
          onClick={() => {
            setTab("conversations");
            setSelectedDocIds(new Set());
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            tab === "conversations"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
              : "border border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          AI Chats ({convs.length})
        </button>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-xs font-bold text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">{error}</p>
      )}

      {/* Documents View Controls: Search, Multi-Filter, and Master Selection Bar */}
      {tab === "documents" && docs.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search deleted files by title…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white/90 pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 outline-none backdrop-blur-md transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#13111f]/90 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* File Type Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {(["all", "pdf", "docx", "txt", "image"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    typeFilter === t
                      ? "bg-purple-600 text-white shadow-xs"
                      : "border border-slate-200/80 bg-white/80 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none backdrop-blur-md transition-all dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-200"
              >
                <option value="newest">Recently Deleted</option>
                <option value="oldest">Oldest Deleted</option>
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
              </select>
            </div>
          </div>

          {/* Master Select Bar */}
          {isAdmin && filteredDocs.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-2 text-xs font-semibold backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/60">
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-2 text-slate-700 hover:text-purple-600 dark:text-zinc-300 dark:hover:text-purple-400 transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                ) : isSomeSelected ? (
                  <MinusSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>
                  {isAllSelected ? "Deselect All" : "Select All"} ({filteredDocs.length} items)
                </span>
              </button>

              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                {selectedDocIds.size} of {filteredDocs.length} selected
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600 dark:text-purple-400" />
        </div>
      ) : tab === "documents" ? (
        filteredDocs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-[#13111f]/50">
            <Trash2 className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-zinc-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              {docs.length === 0 ? "Trash is completely empty" : "No documents match your filter"}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
              {docs.length === 0
                ? "Deleted files remain here for recovery and auto-purge after 30 days."
                : "Try searching with a different term or resetting the file type filter."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filteredDocs.map((d) => {
              const isSelected = selectedDocIds.has(d.id);
              const badge = getFileTypeBadge(d.file_type);
              return (
                <li
                  key={d.id}
                  onClick={() => isAdmin && toggleSelectDoc(d.id)}
                  className={`group relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-2xs backdrop-blur-md transition-all duration-200 ${
                    isAdmin ? "cursor-pointer" : ""
                  } ${
                    isSelected
                      ? "border-purple-500 bg-purple-50/70 shadow-md shadow-purple-500/10 ring-1 ring-purple-500 dark:border-purple-400 dark:bg-purple-950/40"
                      : "border-slate-200/80 bg-white/90 hover:-translate-y-0.5 hover:border-purple-300/80 hover:shadow-md hover:shadow-purple-500/5 dark:border-white/10 dark:bg-[#13111f]/90 dark:hover:border-purple-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {isAdmin && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectDoc(d.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-slate-300 dark:text-zinc-600" />
                        )}
                      </div>
                    )}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 shadow-xs">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {d.title}
                        </span>
                        <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Deleted {timeAgo(d.deleted_at)}
                        </span>
                        <span>•</span>
                        <span>Auto-purges in 30 days</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2"
                    >
                      <button
                        onClick={() => void handleBatchRestore([d.id])}
                        disabled={batchBusy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
                        title="Restore document"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-emerald-500" /> Restore
                      </button>
                      <button
                        onClick={() => promptPurgeSingle(d)}
                        disabled={batchBusy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        title="Permanently delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Purge
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )
      ) : convs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-[#13111f]/50">
          <MessageSquare className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-zinc-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No trashed AI conversations</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Deleted AI chat threads appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {convs.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 shadow-xs">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{c.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500">Deleted {timeAgo(c.deleted_at)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Floating Batch Actions Bar */}
      {selectedDocIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200 dark:border-white/15 dark:bg-[#13111f]/95">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-white/10">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-black text-white">
              {selectedDocIds.size}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-white">Selected</span>
          </div>

          <button
            onClick={() => void handleBatchRestore()}
            disabled={batchBusy}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {batchBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Restore ({selectedDocIds.size})
          </button>

          <button
            onClick={promptPurgeSelected}
            disabled={batchBusy}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-red-500/20 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Purge ({selectedDocIds.size})
          </button>

          <button
            onClick={() => setSelectedDocIds(new Set())}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Safety Confirmation Dialog Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-[#13111f] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                disabled={batchBusy}
                className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmModal.onConfirm()}
                disabled={batchBusy}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-red-500/25 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {batchBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
