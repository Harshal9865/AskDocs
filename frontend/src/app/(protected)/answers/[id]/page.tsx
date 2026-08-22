"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Citation } from "@/lib/types";

interface AnswerData {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  conversation_title: string;
  workspace_id: string;
  created_at: string;
}

export default function AnswerPermalinkPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AnswerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.getAnswer(params.id));
    } catch (err) {
      const msg = (err as Error).message;
      setError(
        msg.includes("404") || msg.includes("not found")
          ? "Answer not found, or you don't have access to its workspace."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <p className="text-sm text-slate-500">Loading answer…</p>;

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-3 text-sm font-medium text-red-600">{error}</p>
        <p className="text-xs text-slate-400">
          Permalinks are visible to members of the workspace the answer belongs to.
          Make sure you are signed in.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/chat" className="text-xs font-medium text-indigo-600 hover:underline">
          ← Back to AI Chat
        </Link>
        <button
          onClick={copyLink}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? "✓ Link copied" : "🔗 Copy share link"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
          AskDocs · cited answer
        </div>
        <h1 className="mb-4 text-base font-bold leading-relaxed text-slate-900 sm:text-lg">
          “{data?.question}”
        </h1>

        <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
          {data?.answer}
        </p>

        {data && data.citations.length > 0 && (
          <>
            <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sources
            </h2>
            <ul className="space-y-2">
              {data.citations.map((c, i) => (
                <li key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-800">
                    📄 {c.document_title}
                    <span className="ml-1 font-normal text-slate-400">
                      · chunk #{c.chunk_ordinal}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-600">{c.snippet}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-6 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
          From conversation “{data?.conversation_title}” ·{" "}
          {data && new Date(data.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
