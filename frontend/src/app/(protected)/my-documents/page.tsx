"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  FileImage,
  File,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DocumentItem } from "@/lib/types";

const STATUS_CONFIG: Record<
  DocumentItem["status"],
  { bg: string; text: string; icon: typeof Clock; label: string }
> = {
  pending: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: Clock, label: "Pending" },
  processing: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", icon: Loader2, label: "Processing" },
  ready: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2, label: "Ready" },
  failed: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", icon: AlertCircle, label: "Failed" },
};

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

export default function MyDocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [wsNames, setWsNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const documents = await api.listMyDocuments();
      setDocs(documents);
      // fetch workspace names
      const wsIds = [...new Set(documents.map((d) => d.workspace_id).filter(Boolean))] as string[];
      const names: Record<string, string> = {};
      await Promise.all(
        wsIds.map(async (id) => {
          try {
            const ws = await api.listWorkspaces();
            const found = ws.find((w) => w.id === id);
            if (found) names[id] = found.name;
          } catch {
            /* ignore */
          }
        }),
      );
      setWsNames(names);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.file_type.toLowerCase().includes(q) ||
        (d.workspace_id && wsNames[d.workspace_id]?.toLowerCase().includes(q)),
    );
  }, [docs, search, wsNames]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">My Documents</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          All documents you&apos;ve uploaded across every workspace ({docs.length} total)
        </p>
      </div>

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
              </div>
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
          <FolderOpen className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" />
          <p className="text-sm text-slate-500">
            You haven&apos;t uploaded any documents yet.
          </p>
          <Link
            href="/documents"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Go to Documents \u2192
          </Link>
        </div>
      ) : (
        <>
          {docs.length > 3 && (
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your documents\u2026"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-[#1a1a1a]">
              No documents match &ldquo;{search}&rdquo;
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((d) => {
                const sc = STATUS_CONFIG[d.status];
                const StatusIcon = sc.icon;
                const wsName = d.workspace_id ? wsNames[d.workspace_id] : null;
                return (
                  <li key={d.id}>
                    <Link
                      href={`/documents/${d.workspace_id}/${d.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-sm dark:border-white/5 dark:bg-[#1a1a1a] dark:hover:border-white/10"
                    >
                      <div className="shrink-0">{getFileIcon(d.file_type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800 group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400">
                          {d.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
                          <span className="uppercase font-semibold">{d.file_type}</span>
                          <span>\u00b7</span>
                          <span>{fmtSize(d.size_bytes)}</span>
                          {wsName && (
                            <>
                              <span>\u00b7</span>
                              <span className="text-indigo-500 dark:text-indigo-400">{wsName}</span>
                            </>
                          )}
                          {d.created_at && (
                            <>
                              <span>\u00b7</span>
                              <span>{timeAgo(d.created_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}
                      >
                        <StatusIcon
                          className={`h-3 w-3 ${d.status === "processing" ? "animate-spin" : ""}`}
                        />
                        {sc.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
