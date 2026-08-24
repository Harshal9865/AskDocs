"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
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

export default function DocumentsPage() {
  const { workspace } = useWorkspace();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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

  // initial load + poll while any doc is pending/processing
  useEffect(() => {
    void load();
    const hasActive = docs.some(
      (d) => d.status === "pending" || d.status === "processing",
    );
    if (!hasActive) return;
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [load, docs]);

  async function upload(files: FileList | null) {
    if (!workspace || !files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await api.uploadDocument(workspace.id, file);
      }
      await load();
    } catch (err) {
      alert(`Upload failed: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  async function remove(docId: string) {
    if (!workspace || !confirm("Delete this document and its chunks?")) return;
    try {
      await api.deleteDocument(workspace.id, docId);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (!workspace) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center text-zinc-500">
        Create or select a workspace first.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-bold">Documents</h1>
      <p className="mb-6 text-sm text-slate-600">
        Upload PDF, DOCX, Markdown or TXT files (max 20 MB). They are chunked and
        embedded automatically.
      </p>

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
        className={`mb-6 cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-300 bg-white hover:border-indigo-400"
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
          <p className="text-sm font-medium">Uploadingâ€¦</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drop files here or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">
              PDF · DOCX · MD · TXT · PNG · JPG · WEBP · GIF · ≤ 20 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading documentsâ€¦</p>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center text-sm text-slate-600">
          No documents yet. Upload your first one above to start asking questions.
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
                  {d.file_type.toUpperCase()} Â· {fmtSize(d.size_bytes)}
                  {d.error_msg ? ` Â· ${d.error_msg}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[d.status]}`}
                >
                  {d.status}
                </span>
                <button
                  onClick={() => void remove(d.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


