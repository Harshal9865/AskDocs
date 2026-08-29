"use client";

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
      <h1 className="mb-1 text-xl font-bold dark:text-white">Help & FAQ</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-zinc-400">Everything you need to know about AskDocs.</p>
      <div className="space-y-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group glow-card glow-indigo rounded-2xl dark:bg-[#121212]"
          >
            <div className="rounded-2xl border border-slate-200/60 bg-white transition-all duration-300 group-open:border-indigo-200/50 group-open:shadow-xl dark:border-white/10 dark:bg-[#121212] dark:group-open:border-indigo-500/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-semibold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white transition-all duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-5">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{f.a}</p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
