"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { Search, FileText, MessageSquare, BookOpen, Clock, X, Loader2 } from "lucide-react";

interface Results {
  documents: { id: string; title: string; file_type: string }[];
  messages: { id: string; conversation_id: string; conversation_title: string; role: string; snippet: string }[];
  excerpts: { id: string; document_title: string; snippet: string; score?: number }[];
}

type Filter = "all" | "docs" | "chats" | "excerpts";

function highlight(text: string, term: string) {
  if (!term) return text;
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="rounded bg-amber-200 px-0.5 dark:bg-amber-500/30 dark:text-amber-100">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { workspace } = useWorkspace();
  const initialQ = params.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [results, setResults] = useState<Results | null>(null);
  const [searched, setSearched] = useState(!!initialQ);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const r = JSON.parse(localStorage.getItem("askdocs_recent_search") || "[]");
    if (Array.isArray(r)) setRecent(r.slice(0, 5));
  }, []);

  function pushRecent(term: string) {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...recent.filter((x) => x !== t)].slice(0, 5);
    setRecent(next);
    localStorage.setItem("askdocs_recent_search", JSON.stringify(next));
  }

  async function run(term?: string) {
    const query = (term ?? q).trim();
    if (!workspace || query.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.search(workspace.id, query);
      setResults(res);
      setSearched(true);
      pushRecent(query);
      router.replace(`/search?q=${encodeURIComponent(query)}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // auto-run on initial q
  useEffect(() => {
    if (initialQ.trim().length >= 2 && workspace) void run(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  // debounced live search
  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(() => void run(), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const counts = useMemo(() => {
    if (!results) return null;
    return {
      docs: results.documents.length,
      msgs: results.messages.length,
      ex: results.excerpts.length,
      total: results.documents.length + results.messages.length + results.excerpts.length,
    };
  }, [results]);

  const term = q.trim();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2 text-xl font-bold dark:text-white">
        <Search className="h-5 w-5 text-indigo-600 dark:text-[#1DB954]" /> Search
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Find anything across this workspace&apos;s documents and AI conversations.</p>

      {!workspace ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-white/10 dark:bg-[#121212] dark:text-zinc-400">
          Select a workspace to search in.
        </div>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
            className="mb-3 mt-6 flex gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Try "pricing" or "refund window"'
                aria-label="Search"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#181818] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-[#1DB954] dark:focus:ring-[#1DB954]/20"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setResults(null);
                    setSearched(false);
                    router.replace("/search");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={busy || q.trim().length < 2}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Search
            </button>
          </form>

          {recent.length > 0 && !searched && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="h-3 w-3" /> Recent:
              </span>
              {recent.map((r) => (
                <button key={r} onClick={() => { setQ(r); void run(r); }} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10">
                  {r}
                </button>
              ))}
              <button onClick={() => { setRecent([]); localStorage.removeItem("askdocs_recent_search"); }} className="ml-1 text-slate-400 hover:text-slate-600">
                Clear
              </button>
            </div>
          )}

          {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

          {busy && !results && (
            <div className="mt-6 space-y-3">
              <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
            </div>
          )}

          {results && (
            <div className="mt-2 space-y-6">
              {counts && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-slate-600 dark:text-zinc-300">
                    {counts.total} results
                  </span>
                  <span className="text-slate-400">·</span>
                  <div className="flex gap-1">
                    {(["all", "docs", "chats", "excerpts"] as Filter[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${filter === f ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-400"}`}
                      >
                        {f === "all" ? "All" : f === "docs" ? `Docs (${counts.docs})` : f === "chats" ? `Chats (${counts.msgs})` : `Excerpts (${counts.ex})`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {counts?.total === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                  No results for “{q}”. Try a different keyword or check another workspace.
                </p>
              ) : (
                <>
                  {(filter === "all" || filter === "docs") && results.documents.length > 0 && (
                    <section>
                      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <FileText className="h-3.5 w-3.5" /> Documents · {results.documents.length}
                      </h2>
                      <ul className="space-y-2">
                        {results.documents.map((d) => (
                          <li key={d.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-200 dark:border-white/10 dark:bg-[#1a1a1a]">
                            <Link href={`/documents/${workspace.id}/${d.id}`} className="flex items-center gap-2 text-sm font-medium text-indigo-700 hover:underline dark:text-[#1DB954]">
                              <FileText className="h-4 w-4 shrink-0" /> <span className="truncate">{highlight(d.title, term)}</span>
                              <span className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500 dark:bg-white/10">{d.file_type}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {(filter === "all" || filter === "chats") && results.messages.length > 0 && (
                    <section>
                      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <MessageSquare className="h-3.5 w-3.5" /> AI conversations · {results.messages.length}
                      </h2>
                      <ul className="space-y-2">
                        {results.messages.map((m) => (
                          <li key={m.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
                            <Link href={`/chat?conv=${m.conversation_id}`} className="text-xs font-semibold uppercase text-indigo-500 hover:underline dark:text-[#1DB954]">
                              {m.conversation_title || "Conversation"}
                            </Link>
                            <span className="ml-2 rounded bg-slate-100 px-1 py-0.5 text-[10px] uppercase text-slate-500 dark:bg-white/10">{m.role}</span>
                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">{highlight(m.snippet, term)}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {(filter === "all" || filter === "excerpts") && results.excerpts.length > 0 && searched && (
                    <section>
                      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <BookOpen className="h-3.5 w-3.5" /> Document excerpts · {results.excerpts.length}
                      </h2>
                      <ul className="space-y-2">
                        {results.excerpts.map((x) => (
                          <li key={x.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-[#1DB954]">{x.document_title || "Document"}</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-zinc-300">{highlight(x.snippet, term)}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
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
