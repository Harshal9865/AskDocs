"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Target } from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";

interface Insights {
  total_documents: number;
  ready_documents: number;
  total_questions: number;
  unanswered_count: number;
  unanswered_questions: { question: string; asked_at: string }[];
  top_cited_documents: { title: string; citations: number }[];
}

export default function InsightsPage() {
  const { workspace } = useWorkspace();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      setData(await api.insights(workspace.id));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!workspace) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Select a workspace first.</div>;
  }

  if (loading) return <p className="text-sm text-slate-500">Crunching insights…</p>;
  if (error || !data) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">{error ?? "Failed to load."}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-bold">Insights</h1>
      <p className="mb-6 text-sm text-slate-500">How your team uses knowledge in “{workspace.name}”.</p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Documents" value={data.total_documents} />
        <Stat label="Indexed" value={data.ready_documents} />
        <Stat label="Questions asked" value={data.total_questions} />
        <Stat label="Knowledge gaps" value={data.unanswered_count} accent />
      </div>

      {/* Knowledge-Gap Radar */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <Target className="h-4 w-4 text-indigo-600" aria-hidden />
          Knowledge-Gap Radar
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Questions the AI couldn&apos;t answer — write documents about these to close the gaps.
        </p>
        {data.unanswered_questions.length === 0 ? (
          <p className="text-sm text-emerald-700">
            ✅ No knowledge gaps — every question so far was answered from your documents.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.unanswered_questions.map((uq, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2">
                <span className="mt-0.5 shrink-0 text-amber-600">?</span>
                <div>
                  <p className="text-sm text-slate-800">{uq.question}</p>
                  <p className="text-[10px] text-slate-400">{new Date(uq.asked_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Top cited */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 flex items-center gap-1.5 text-sm font-bold text-slate-800"><BookOpen className="h-4 w-4 text-indigo-600" aria-hidden />Most-cited documents</h2>
        {data.top_cited_documents.length === 0 ? (
          <p className="text-sm text-slate-400">Ask some questions first — citations will rank documents here.</p>
        ) : (
          <ul className="space-y-2">
            {data.top_cited_documents.map((d) => {
              const max = data.top_cited_documents[0].citations || 1;
              return (
                <li key={d.title}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate font-medium text-slate-700">{d.title}</span>
                    <span className="ml-2 shrink-0 text-slate-400">{d.citations}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${(d.citations / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link href="/documents" className="mt-6 inline-block text-xs font-medium text-indigo-600 hover:underline">
        Upload documents to close knowledge gaps →
      </Link>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className={`text-2xl font-bold ${accent && Number(value) > 0 ? "text-amber-600" : "text-slate-900"}`}>{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}


