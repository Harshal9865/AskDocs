"use client";

import { ChevronDown } from "lucide-react";

export default function HelpPage() {
  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: "How does the AI answer questions?",
      a: "When you upload a document, it is split into chunks and embedded into a vector index. When you ask a question, we find the most similar chunks, show them to the AI, and it answers using only that content — always citing which document and chunk each claim came from.",
    },
    {
      q: "What file types can I upload?",
      a: "PDF, DOCX, Markdown (.md) and plain text (.txt), up to 20 MB each. Scanned/image-only PDFs are not supported yet (no OCR).",
    },
    {
      q: "What do the roles mean?",
      a: "Admins manage everything (members, deletion, settings, activity log). Members upload documents and chat. Viewers can read documents and ask questions but cannot change anything.",
    },
    {
      q: "Who can see my Office Chats?",
      a: "Only the participants. Even workspace admins cannot read your direct messages or group chats.",
    },
    {
      q: "What is the Knowledge-Gap Radar?",
      a: (
        <>
          On the{" "}
          <a href="/insights" className="font-medium text-indigo-600 hover:underline">
            Insights
          </a>{" "}
          page you&apos;ll see every question the AI couldn&apos;t answer from your documents. Treat this list as a to-do list of exactly what to document next.
        </>
      ),
    },
    {
      q: "Someone deleted a document — can we get it back?",
      a: "Deleted documents go to the Trash page where admins can restore them or delete them permanently.",
    },
    {
      q: "The first answer after a break is slow — why?",
      a: "On the free hosting tier the backend sleeps after ~15 minutes of inactivity. The first request wakes it up (30–60 seconds); everything after that is fast.",
    },
    {
      q: "Is my data isolated from other teams?",
      a: "Yes. Every query is scoped to your workspace. Non-members get 'not found' responses even for existing resources — they can't even confirm a workspace exists.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold">Help & FAQ</h1>
      <p className="mb-6 text-sm text-slate-500">Everything you need to know about AskDocs.</p>
      <div className="space-y-2">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition-shadow open:shadow-md"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
              {f.q}
            </summary>
            <div className="mt-2 pl-7 text-sm leading-relaxed text-slate-600">{f.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
