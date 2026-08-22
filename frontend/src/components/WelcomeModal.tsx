"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, FolderKanban, MessagesSquare, Upload, UsersRound } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";

const STEPS = [
  {
    icon: FolderKanban,
    title: "Create a workspace",
    body: "A workspace is a private space for one team or topic — e.g. “HR Policies” or “Product Docs”. Use the sidebar to create as many as you like.",
  },
  {
    icon: Upload,
    title: "Upload documents",
    body: "Drop in PDFs, Word docs, Markdown or text files (max 20 MB). They're automatically split, indexed and made searchable.",
  },
  {
    icon: MessagesSquare,
    title: "Ask questions with citations",
    body: 'Ask anything like "What was decided about the pricing change?" — answers cite the exact document and chunk they came from.',
  },
  {
    icon: UsersRound,
    title: "Invite your team",
    body: "Invite colleagues from the Members page. They accept via the notification bell, then appear with a green dot when online. Chat with them in Office Chats.",
  },
];

export default function WelcomePage() {
  const { workspaces } = useWorkspace();
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("askdocs_welcomed") === "1"
  );

  function dismiss() {
    localStorage.setItem("askdocs_welcomed", "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-1 text-center text-3xl">👋</div>
        <h1 className="text-center text-xl font-bold">Welcome to AskDocs</h1>
        <p className="mb-6 mt-1 text-center text-sm text-slate-500">
          Your team&apos;s knowledge base with AI-powered cited answers.
        </p>

        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                <s.icon className="h-4 w-4 text-indigo-600" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/documents"
            onClick={dismiss}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {workspaces.length === 0 ? "Get started" : "Upload documents"}
          </Link>
          <button
            onClick={dismiss}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}
