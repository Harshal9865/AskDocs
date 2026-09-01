"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  const abortControllerRef = useRef<AbortController | null>(null);

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

    // Abort previous in-flight search request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setBusy(true);
    setError(null);
    try {
      const res = await api.search(workspace.id, query);
      if (!controller.signal.aborted) {
        setResults(res);
        setSearched(true);
        pushRecent(query);
        router.replace(`/search?q=${encodeURIComponent(query)}`);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError((err as Error).message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setBusy(false);
      }
    }
  }

  // auto-run on initial q
  useEffect(() => {
    if (initialQ.trim().length >= 2 && workspace) void run(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  // debounced live search (250ms)
  useEffect(() => {
    if (q.trim().length < 2) {
      if (q.trim().length === 0) setResults(null);
      return;
    }
    const t = setTimeout(() => void run(), 250);
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
    <div className="relative mx-auto max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-purple-500/25">
          <Search className="h-4 w-4" />
        </span>
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200">
          Search Workspace
        </h1>
      </div>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
        Find anything across this workspace&apos;s documents, AI conversations, and indexed excerpts.
      </p>

      {!workspace ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-8 text-center text-slate-500 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#12121e]/80 dark:text-zinc-400">
          Select a workspace to search in.
        </div>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
            className="mb-3 mt-5 flex gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Try "pricing", "quarterly roadmap", or "refunds"…'
                aria-label="Search"
                className="w-full rounded-2xl border border-slate-200/80 bg-white/90 py-2.5 pl-10 pr-9 text-sm outline-none placeholder:text-slate-400 shadow-xs backdrop-blur-sm transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#161622] dark:text-white dark:placeholder:text-zinc-500"
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={busy || q.trim().length < 2}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Search
            </button>
          </form>

          {recent.length > 0 && !searched && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="flex items-center gap-1 text-slate-400 dark:text-zinc-500">
                <Clock className="h-3 w-3" /> Recent:
              </span>
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => { setQ(r); void run(r); }}
                  className="rounded-full border border-slate-200/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-colors"
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => { setRecent([]); localStorage.removeItem("askdocs_recent_search"); }}
                className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          {busy && !results && (
            <div className="mt-6 space-y-3">
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
            </div>
          )}

          {results && (
            <div className="mt-4 space-y-6">
              {counts && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-zinc-200">
                    {counts.total} {counts.total === 1 ? "match" : "matches"} found
                  </span>
                  <span className="text-slate-400">·</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "docs", "chats", "excerpts"] as Filter[]).map((f) => {
                      const isActive = filter === f;
                      return (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs shadow-purple-500/25"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
                          }`}
                        >
                          {f === "all"
                            ? "All"
                            : f === "docs"
                            ? `Docs (${counts.docs})`
                            : f === "chats"
                            ? `Chats (${counts.msgs})`
                            : `Excerpts (${counts.ex})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {counts?.total === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-400">
                  <p className="font-medium">No results found for &ldquo;{q}&rdquo;</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Try broader keywords or upload related documents to this workspace.</p>
                </div>
              ) : (
                <>
                  {(filter === "all" || filter === "docs") && results.documents.length > 0 && (
                    <section>
                      <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        <FileText className="h-3.5 w-3.5" /> Documents ({results.documents.length})
                      </h2>
                      <ul className="space-y-2">
                        {results.documents.map((d) => (
                          <li key={d.id} className="group rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-white/10 dark:bg-[#151520]/90 dark:hover:border-purple-500/30">
                            <Link href={`/documents/${workspace.id}/${d.id}`} className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-300 transition-colors">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                                <FileText className="h-4 w-4" />
                              </span>
                              <span className="truncate">{highlight(d.title, term)}</span>
                              <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-white/10 dark:text-zinc-400">
                                {d.file_type}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {(filter === "all" || filter === "chats") && results.messages.length > 0 && (
                    <section>
                      <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        <MessageSquare className="h-3.5 w-3.5" /> AI Conversations ({results.messages.length})
                      </h2>
                      <ul className="space-y-2">
                        {results.messages.map((m) => (
                          <li key={m.id} className="group rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-white/10 dark:bg-[#151520]/90 dark:hover:border-indigo-500/30">
                            <div className="flex items-center justify-between gap-2">
                              <Link href={`/chat?conv=${m.conversation_id}`} className="text-xs font-bold uppercase tracking-wider text-indigo-600 group-hover:underline dark:text-indigo-400">
                                {m.conversation_title || "AI Conversation"}
                              </Link>
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">{m.role}</span>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                              {highlight(m.snippet, term)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {(filter === "all" || filter === "excerpts") && results.excerpts.length > 0 && searched && (
                    <section>
                      <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        <BookOpen className="h-3.5 w-3.5" /> Document Excerpts ({results.excerpts.length})
                      </h2>
                      <ul className="space-y-2">
                        {results.excerpts.map((x) => (
                          <li key={x.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-white/10 dark:bg-[#151520]/90 dark:hover:border-emerald-500/30">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                              {x.document_title || "Document"}
                            </p>
                            <p className="mt-1.5 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                              {highlight(x.snippet, term)}
                            </p>
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
