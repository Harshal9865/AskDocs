"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import {
  Search,
  FileText,
  MessageSquare,
  X,
  Loader2,
  Sparkles,
  Zap,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";

interface Results {
  documents: { id: string; title: string; file_type: string }[];
  messages: { id: string; conversation_id: string; conversation_title: string; role: string; snippet: string }[];
  excerpts: { id: string; document_title: string; snippet: string; score?: number }[];
}

type Filter = "all" | "ai" | "docs" | "excerpts" | "chats";

function highlight(text: string, term: string) {
  if (!term) return text;
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="rounded bg-amber-200 px-0.5 dark:bg-amber-500/30 dark:text-amber-100 font-bold">
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
  const [aiSynthesis, setAiSynthesis] = useState<string | null>(null);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const r = JSON.parse(localStorage.getItem("askdocs_recent_search") || "[]");
    if (Array.isArray(r)) setRecent(r.slice(0, 5));
  }, []);

  const pushRecent = useCallback((term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, 5);
      localStorage.setItem("askdocs_recent_search", JSON.stringify(next));
      return next;
    });
  }, []);

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim() || !workspace) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setBusy(true);
    setError(null);
    setSearched(true);
    setAiSynthesis(null);
    pushRecent(query);

    try {
      const [res, aiRes] = await Promise.all([
        api.search(workspace.id, query.trim()),
        api.queryWorkspaceMemory(workspace.id, `Synthesize a concise, direct answer to this workspace search query based on all documents: "${query}"`).catch(() => null),
      ]);

      setResults(res);
      if (aiRes?.answer) {
        setAiSynthesis(aiRes.answer);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setError(String(err));
      }
    } finally {
      setBusy(false);
    }
  }, [workspace, pushRecent]);

  useEffect(() => {
    if (initialQ.trim() && workspace) {
      void runSearch(initialQ);
    }
  }, [initialQ, workspace, runSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      void runSearch(q.trim());
    }
  }

  const totalCount = useMemo(() => {
    if (!results) return 0;
    return results.documents.length + results.messages.length + results.excerpts.length;
  }, [results]);

  const copySynthesisMemo = () => {
    if (!aiSynthesis || !results) return;
    const text = `# Search Synthesis: "${q}"\n\n## AI Executive Answer\n${aiSynthesis}\n\n## Key Cross-Document Sources\n${results.excerpts.map((e) => `- **${e.document_title}:** ${e.snippet}`).join("\n")}`;
    void navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Ambient Cosmic Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#130f2f] to-[#1e103c] p-6 sm:p-9 text-white shadow-2xl backdrop-blur-2xl animate-gradient-shift">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl animate-float pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl animate-float pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-purple-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
              <Search className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">AI Universal Multi-Doc Search</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Search & Cross-Doc{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Synthesis
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Query across all uploaded PDFs, contracts, study guides, and office chats simultaneously with instant AI synthesis and exact citations.
            </p>
          </div>
        </div>
      </div>

      {/* Main Search Input Form */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Search className="pointer-events-none absolute left-4 h-5 w-5 text-purple-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any keyword, ask questions across documents, or find specific clauses…"
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 pl-12 pr-28 py-4 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white transition-all shadow-inner"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setResults(null);
                setSearched(false);
                setAiSynthesis(null);
              }}
              className="absolute right-20 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !q.trim()}
            className="absolute right-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Quick Sample Queries & Recent Searches Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> Try:
          </span>
          {(recent.length > 0 ? recent : ["Liability & Termination Clauses", "Infrastructure Cloud Uptime SLA", "Quarterly Budget Approvals", "Eventual Consistency & Raft"]).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQ(suggestion);
                router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                void runSearch(suggestion);
              }}
              className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-1 text-xs font-medium text-slate-700 hover:border-purple-300 hover:bg-purple-50 dark:border-white/5 dark:bg-white/5 dark:text-zinc-300 transition-all cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* AI Cross-Document Synthesis Answer Box */}
      {aiSynthesis && (
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-6 shadow-xl backdrop-blur-xl dark:border-purple-500/20 space-y-3 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/15 pb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
              <span>AI Multi-Document Executive Synthesis</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copySynthesisMemo}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300 transition-all cursor-pointer"
              >
                {copiedMemo ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedMemo ? "Copied" : "Copy Synthesis"}</span>
              </button>

              <Link
                href={`/chat?q=${encodeURIComponent(`Let's explore this search topic further: "${q}". Executive summary: ${aiSynthesis}. What deeper connections or citations can you find?`)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all"
              >
                <span>Deep Dive in AI Chat</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">
            {aiSynthesis}
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      {searched && (
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 dark:border-white/10 overflow-x-auto no-scrollbar">
          {(
            [
              { key: "all", label: `All Results (${totalCount})` },
              { key: "excerpts", label: `Document Excerpts (${results?.excerpts.length || 0})` },
              { key: "docs", label: `Documents (${results?.documents.length || 0})` },
              { key: "chats", label: `Office Chats (${results?.messages.length || 0})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                filter === tab.key
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Results Container */}
      {busy ? (
        <div className="flex h-64 flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Synthesizing workspace documents…</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-xs font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30">
          {error}
        </div>
      ) : searched && results ? (
        <div className="space-y-4">
          {/* Excerpts List */}
          {(filter === "all" || filter === "excerpts") && results.excerpts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Matching Document Excerpts & Citations
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {results.excerpts.map((exc, idx) => (
                  <div
                    key={idx}
                    className="group rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-md hover:border-purple-300 dark:border-white/5 dark:bg-[#15151c]/95 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-black text-purple-600 dark:text-purple-400">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{exc.document_title}</span>
                      </span>
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                        Relevance Match
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 font-normal">
                      &ldquo;{highlight(exc.snippet, q)}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents List */}
          {(filter === "all" || filter === "docs") && results.documents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Matching Workspace Documents
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {results.documents.map((d) => (
                  <Link
                    key={d.id}
                    href={`/documents/${workspace?.id}/${d.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-md hover:border-purple-300 dark:border-white/5 dark:bg-[#15151c]/95 transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {d.title}
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">
                        {d.file_type}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Messages / Chats List */}
          {(filter === "all" || filter === "chats") && results.messages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Matching Office Chat Messages
              </h3>
              <div className="space-y-2.5">
                {results.messages.map((m) => (
                  <Link
                    key={m.id}
                    href={`/chats/${m.conversation_id}`}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-md hover:border-purple-300 dark:border-white/5 dark:bg-[#15151c]/95 transition-all"
                  >
                    <MessageSquare className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {m.conversation_title}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          by {m.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 leading-snug">
                        {highlight(m.snippet, q)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalCount === 0 && !aiSynthesis && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400 dark:border-white/10">
              <Search className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-xs font-bold">No results found for &ldquo;{q}&rdquo;.</p>
              <p className="text-[11px] text-slate-400 mt-1">Try another keyword or broader topic.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-slate-400">Loading search…</div>}>
      <SearchInner />
    </Suspense>
  );
}
