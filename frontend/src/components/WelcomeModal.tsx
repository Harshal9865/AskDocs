"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderKanban, MessagesSquare, Upload, UsersRound } from "lucide-react";
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#131220] border border-slate-200/90 dark:border-white/10 p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="text-center">
          <div className="mb-2 text-3xl">👋</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome to AskDocs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Your team&apos;s knowledge base with AI-powered cited answers.
          </p>
        </div>

        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <s.icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row pt-2">
          <Link
            href="/documents"
            onClick={dismiss}
            className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-purple-700 transition-all shadow-xs"
          >
            {workspaces.length === 0 ? "Get started" : "Upload documents"}
          </Link>
          <button
            onClick={dismiss}
            className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}

export function IosInstallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181826] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-white/10 p-1.5 ring-1 ring-indigo-500/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-day.svg" alt="AskDocs" className="h-6 w-6 dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-night.svg" alt="AskDocs" className="hidden h-6 w-6 dark:block" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Install AskDocs</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">iOS Safari App Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-black/30 p-3.5 border border-slate-100 dark:border-white/5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs">
              1
            </span>
            <div className="text-xs text-slate-700 dark:text-zinc-300">
              Tap the <span className="font-bold text-indigo-600 dark:text-indigo-400">Share</span> icon at the bottom of Safari’s toolbar.
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-black/30 p-3.5 border border-slate-100 dark:border-white/5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs">
              2
            </span>
            <div className="text-xs text-slate-700 dark:text-zinc-300">
              Scroll down and select <span className="font-bold text-indigo-600 dark:text-indigo-400">“Add to Home Screen”</span>.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-indigo-600 py-3 text-center text-xs font-bold text-white shadow-md active:scale-95 transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function InstallAppBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && localStorage.getItem("askdocs_pwa_banner_dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  if (!mounted || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("askdocs_pwa_banner_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-40 flex items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-[#0d0c17]/95 text-white p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 p-1.5 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-night.svg" alt="AskDocs" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-xs font-black text-white">Install AskDocs App</h4>
          <p className="truncate text-[11px] text-zinc-400">Fast offline access & full screen</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            const isIOS = typeof window !== "undefined" && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
            if (isIOS) {
              alert("To install on iOS: Tap Share -> Add to Home Screen");
            } else {
              alert("Tap the Install App option in your browser menu or top navbar!");
            }
          }}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all hover:brightness-110"
        >
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
