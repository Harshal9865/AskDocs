"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import type { DocumentItem } from "@/lib/types";

interface ChunkItem {
  id: string;
  ordinal: number;
  token_count: number;
  content: string;
}

export default function DocumentDetailPage() {
  const params = useParams<{ wsId: string; docId: string }>();
  const { workspace } = useWorkspace();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      const docs = await api.listDocuments(workspace.id);
      const found = docs.find((d) => d.id === params.docId) ?? null;
      setDoc(found);
      if (found) {
        setChunks(await api.getDocumentChunks(workspace.id, found.id));
      } else if (docs.length > 0) {
        setError("Document not found in this workspace.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace, params.docId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading document…</p>;
  }
  if (error || !doc) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-sm font-medium text-red-600">{error ?? "Document not found."}</p>
        <Link href="/documents" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Back to documents
        </Link>
      </div>
    );
  }

  const wsId = workspace?.id ?? params.wsId;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/documents" className="mb-4 inline-block text-xs font-medium text-indigo-600 hover:underline">
        ← All documents
      </Link>
      <h1 className="text-xl font-bold">{doc.title}</h1>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold uppercase">{doc.file_type}</span>
        <span
          className={`rounded-full px-2.5 py-1 font-semibold uppercase ${
            doc.status === "ready"
              ? "bg-emerald-100 text-emerald-800"
              : doc.status === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {doc.status}
        </span>
        <span>{(doc.size_bytes / 1024).toFixed(1)} KB</span>
        <span>{chunks.length} chunks indexed</span>
      </div>

      {doc.error_msg && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {doc.error_msg}
        </p>
      )}

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Indexed content</h2>
      {chunks.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
          {doc.status === "ready" ? "No chunks stored for this document." : "Content appears here once processing finishes."}
        </p>
      ) : (
        <ul className="space-y-3">
          {chunks.map((c) => (
            <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                Chunk #{c.ordinal} · ~{c.token_count} tokens
              </div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
      <span className="hidden">{String(wsId)}</span>
    </div>
  );
}
