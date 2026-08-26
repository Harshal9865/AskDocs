"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";

const STATUS_STYLES: Record<DocumentItem["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MyDocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDocs(await api.listMyDocuments());
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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-bold">My Documents</h1>
      <p className="mb-6 text-sm text-slate-600">
        All documents you&apos;ve uploaded across every workspace.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading documents...</p>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center text-sm text-slate-600">
          You haven&apos;t uploaded any documents yet. Go to a workspace and upload your first one.
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{d.title}</div>
                <div className="text-xs text-slate-500">
                  {d.file_type.toUpperCase()} · {fmtSize(d.size_bytes)}
                  {d.error_msg ? ` · ${d.error_msg}` : ""}
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[d.status]}`}
              >
                {d.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
