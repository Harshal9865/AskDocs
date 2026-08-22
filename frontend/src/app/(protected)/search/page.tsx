"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";

interface Results {
  documents: { id: string; title: string; file_type: string }[];
  messages: { id: string; conversation_id: string; conversation_title: string; role: string; snippet: string }[];
  excerpts: { id: string; document_title: string; snippet: string }[];
}

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { workspace } = useWorkspace();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<Results | null>(null);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!workspace || q.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      setResults(await api.search(workspace.id, q.trim()));
      setSearched(true);
      router.replace(`/search?q=${encodeURIComponent(q.trim())}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-bold">Search</h1>
      <p className="mb-6 text-sm text-slate-500">
        Find anything across this workspace&apos;s documents and AI conversations.
      </p>

      {!workspace ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Select a workspace to search in.
        </div>
      ) : (
        <>
          <form onSubmit={run} className="mb-6 flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Try "pricing" or "refund window"'
              className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={busy || q.trim().length < 2}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {busy ? "…" : "Search"}
            </button>
          </form>

          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}

          {results && (
            <div className="space-y-6">
              {results.documents.length === 0 && results.messages.length === 0 && results.excerpts.length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
                  No results for “{q}”.
                </p>
              )}

              {results.documents.length > 0 && (
                <section>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Documents</h2>
                  <ul className="space-y-2">
                    {results.documents.map((d) => (
                      <li key={d.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <Link href={`/documents/${workspace.id}/${d.id}`} className="text-sm font-medium text-indigo-700 hover:underline">
                          📄 {d.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.messages.length > 0 && (
                <section>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">AI conversations</h2>
                  <ul className="space-y-2">
                    {results.messages.map((m) => (
                      <li key={m.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <Link href="/chat" className="text-xs font-semibold uppercase text-indigo-500 hover:underline">
                          {m.conversation_title}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">{m.snippet}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.excerpts.length > 0 && searched && (
                <section>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Document excerpts</h2>
                  <ul className="space-y-2">
                    {results.excerpts.map((x) => (
                      <li key={x.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">{x.document_title}</p>
                        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-700">{x.snippet}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <SearchInner />
    </Suspense>
  );
}
