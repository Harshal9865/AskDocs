"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import ChatComposer from "@/components/ChatComposer";
import type { Citation, Conversation, Message } from "@/lib/types";
import {
  ChevronDown,
  FileText,
  MessagesSquare,
  Paperclip,
  Plus,
  Trash2,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

interface SuggestedColleague {
  user_id: string;
  name: string;
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
  suggested?: SuggestedColleague[];
  conflict?: { is_conflict: boolean; note: string } | null;
  freshness?: { oldest_days: number; document_title: string } | null;
  streaming?: boolean;
}

function CitationsModal({
  citations,
  onClose,
}: {
  citations: Citation[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Sources used</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
        <ul className="space-y-3">
          {citations.map((c, i) => (
            <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 text-sm font-semibold">
                {c.document_title}{" "}
                <span className="font-normal text-slate-500">
                  · chunk #{c.chunk_ordinal}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-xs text-slate-700">{c.snippet}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [showCitations, setShowCitations] = useState<Citation[] | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const threadEnd = useRef<HTMLDivElement>(null);

  // resolve my role in this workspace (admin => can delete any conversation)
  useEffect(() => {
    if (!workspace || !user) {
      setMyRole(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const members = await api.listMembers(workspace.id);
        if (!cancelled) {
          setMyRole(members.find((m) => m.email === user.email)?.role ?? null);
        }
      } catch {
        if (!cancelled) setMyRole(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace, user]);

  const canDelete = (conv: Conversation) =>
    conv.user_id === user?.id || myRole === "admin";

  async function deleteConversation(conv: Conversation) {
    if (!confirm(`Delete conversation "${conv.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteConversation(conv.id);
      if (activeConv?.id === conv.id) {
        setActiveConv(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  // Escape closes the citations modal
  useEffect(() => {
    if (!showCitations) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCitations(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCitations]);

  const loadConversations = useCallback(async () => {
    if (!workspace) return;
    setConversations(await api.listConversations(workspace.id));
  }, [workspace]);

  useEffect(() => {
    setActiveConv(null);
    setMessages([]);
    void loadConversations();
  }, [workspace, loadConversations]);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openConversation(conv: Conversation) {
    setListOpen(false);
    setActiveConv(conv);
    const history = await api.listMessages(conv.id);
    setMessages(
      history.map((m: Message) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations,
        conflict: m.conflict ?? null,
            freshness: m.freshness ?? null,
        suggested:
          m.suggested_colleagues && (!m.citations || m.citations.length === 0)
            ? m.suggested_colleagues
            : [],
      })),
    );
  }

  const [askedIdx, setAskedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function askColleague(colleague: SuggestedColleague, question: string, idx: number) {
    if (!workspace) return;
    try {
      await api.askColleague(workspace.id, colleague.user_id, question);
      setAskedIdx(idx);
    } catch (err) {
      alert(`Could not message ${colleague.name}: ${(err as Error).message}`);
    }
  }

  async function newConversation() {
    if (!workspace) return;
    const conv = await api.createConversation(workspace.id);
    setListOpen(false);
    await loadConversations();
    setActiveConv(conv);
    setMessages([]);
    setInput("");
    // focus input for immediate typing
    document.getElementById("chat-input")?.focus();
  }

  async function send() {
    if (!activeConv || !input.trim() || busy) return;
    await sendWithText(input.trim(), []);
    setInput("");
  }

  async function sendWithText(question: string, attachments: { file: File; previewUrl?: string }[]) {
    if (!activeConv || (!question && attachments.length === 0) || busy) return;
    setBusy(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question || (attachments.length > 0 ? `📎 ${attachments.map(a => a.file.name).join(", ")}` : "") },
      { role: "assistant", content: "", streaming: true },
    ]);

    // Upload attachments first, then send the message
    let attachmentText = "";
    if (attachments.length > 0) {
      try {
        const uploaded = await api.uploadChatAttachments(activeConv.id, attachments.map(a => a.file));
        attachmentText = uploaded.map((a: { filename: string; text_excerpt?: string }) => {
          if (a.text_excerpt) return `[File: ${a.filename}]\n${a.text_excerpt}`;
          return `[File: ${a.filename}]`;
        }).join("\n\n");
      } catch {
        // silently continue — text-only ask
      }
    }

    const fullQuestion = [question, attachmentText].filter(Boolean).join("\n\n");

    let done = false;
    await api.askStream(
      activeConv.id,
      fullQuestion,
      (text) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + text };
          return next;
        }),
      (citations, suggested, conflict, freshness) => {
        done = true;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            ...last,
            streaming: false,
            citations,
            conflict,
            freshness,
            suggested: citations && citations.length > 0 ? [] : suggested,
          };
          return next;
        });
        void loadConversations(); // refresh titles in sidebar list
      },
      (messageId) => {
        // persisted: capture id for permalinks
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, id: messageId };
          return next;
        });
      },
      (message) => {
        done = true;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            ...last,
            streaming: false,
            content: last.content || `Error: ${message}`,
          };
          return next;
        });
      },
    );
    if (!done) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, streaming: false };
        return next;
      });
    }
    setBusy(false);
  }

  if (!workspace) {
    return (
      <div className="dark:border-slate-700/50 dark:bg-[#1a1a2e] rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        Create or select a workspace first.
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[var(--chat-h)] max-w-5xl flex-col gap-4 md:flex-row">
      {/* conversation list */}
      {listOpen && (
        <div
          className="fixed inset-0 z-10 bg-slate-900/50 md:hidden"
          onClick={() => setListOpen(false)}
          aria-hidden
        />
      )}
      <div className={`dark:border-slate-700/50 dark:bg-[#1a1a2e] sb-scroll absolute inset-y-0 left-0 z-20 w-72 max-w-[85vw] transform overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 md:relative md:z-auto md:w-64 md:translate-x-0 ${listOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`}>
        <button
          onClick={() => void newConversation()}
          className="mb-3 w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          + New conversation
        </button>
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center rounded-lg ${
              activeConv?.id === c.id ? "bg-indigo-100" : "hover:bg-slate-100"
            }`}
          >
            <button
              onClick={() => void openConversation(c)}
              className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm text-slate-600 group-hover:text-slate-900"
              title={c.title}
            >
              {c.title}
            </button>
            {canDelete(c) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteConversation(c);
                }}
                aria-label={`Delete conversation ${c.title}`}
                title="Delete conversation"
                className="mr-1 shrink-0 rounded-md p-2 text-xs text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* thread */}
      <div className="gemini-gradient-bg dark:border-slate-700/50 dark:bg-[#1a1a2e] relative flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Gemini floating orbs */}
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="gemini-orb gemini-orb-3" />
        {/* mobile thread header */}
        <div className="dark:border-slate-700/50 flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 md:hidden">
          <button
            onClick={() => setListOpen(true)}
            aria-label="Show conversations"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <MessagesSquare className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{activeConv ? activeConv.title : "Conversations"}</span>
            <ChevronDown aria-hidden className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
          </button>
          <button
            onClick={() => void newConversation()}
            aria-label="New conversation"
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
          >
            + New
          </button>
        </div>
        <div className="scroll-touch flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-6">
          {!activeConv ? (
            <div className="relative z-10 flex h-full items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/30 dark:to-purple-400/30">
                  <MessagesSquare className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="dark:text-slate-300 text-sm font-medium text-slate-600">Start a new conversation</p>
                <p className="dark:text-slate-500 mt-1 text-xs text-slate-400">Ask about your documents and get AI-powered answers</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="relative z-10 flex h-full items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/30 dark:to-purple-400/30">
                  <svg className="h-8 w-8 text-indigo-500 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <p className="dark:text-slate-300 text-sm font-medium text-slate-600">Ask anything</p>
                <p className="dark:text-slate-500 mt-1 text-xs text-slate-400">Get answers from your documents, powered by AI</p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i}>
                <div
                  className={`relative z-10 inline-block max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[85%] sm:px-4 ${
                    m.role === "user"
                      ? "ml-auto block rounded-br-md bg-indigo-600 text-white" : "dark:border-slate-700/50 dark:bg-[#242424] block rounded-bl-md border border-slate-200 bg-white"
                  }`}
                >
                  {m.content}
                  {m.streaming && (
                    <span className="ml-1 inline-block animate-pulse">▋</span>
                  )}
                </div>
                {m.role === "assistant" &&
                  m.citations &&
                  m.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.citations.map((c, ci) => (
                        <button
                          key={ci}
                          onClick={() => setShowCitations(m.citations!)}
                          className="dark:border-slate-600 dark:bg-[#2a2a2a] dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                        >
                          <FileText className="h-3 w-3" />
                          {c.document_title}
                        </button>
                      ))}
                      {m.id && (
                        <button
                          onClick={() => {
                            navigator.clipboard
                              .writeText(`${window.location.origin}/answers/${m.id}`)
                              .then(() => {
                                setCopiedIdx(i);
                                setTimeout(() => setCopiedIdx(null), 2000);
                              });
                          }}
                          aria-label="Copy shareable link to this answer"
                          title="Share this answer"
                          className="rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          {copiedIdx === i ? "✓ Copied" : "🔗 Share"}
                        </button>
                      )}
                    </div>
                  )}
                {m.role === "assistant" && !m.streaming && m.conflict?.is_conflict && (
                  <div className="mt-2 max-w-[92%] rounded-xl border border-amber-300 bg-amber-50 p-3">
                    <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-900">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Sources disagree — these documents give conflicting information.
                    </p>
                    {m.conflict.note && (
                      <p className="mt-1 pl-5 text-xs text-amber-800">{m.conflict.note}</p>
                    )}
                    <p className="mt-1 pl-5 text-[10px] text-amber-700">
                      Verify with the document owners before relying on this answer.
                    </p>
                  </div>
                )}
                {m.role === "assistant" && !m.streaming && m.freshness && (
                  <div className="mt-2 max-w-[92%] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-600">
                      ⏳ Based in part on{" "}
                      <span className="font-semibold">{m.freshness.document_title}</span>, uploaded{" "}
                      {m.freshness.oldest_days} days ago. Newer documents may exist.
                    </p>
                  </div>
                )}
                {m.role === "assistant" && !m.streaming && m.suggested && m.suggested.length > 0 && (
                  <div className="mt-2 max-w-[92%] rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                      <UsersRound className="h-3.5 w-3.5" />
                      No document answered this — ask your team:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.suggested.map((s) =>
                        askedIdx === i ? (
                          <Link
                            key={s.user_id}
                            href="/chats"
                            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            ✓ Asked — open chat
                          </Link>
                        ) : (
                          <button
                            key={s.user_id}
                            onClick={() =>
                              void askColleague(
                                s,
                                messages[i - 1]?.content ?? "",
                                i,
                              )
                            }
                            className="rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                          >
                            Ask {s.name}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={threadEnd} />
        </div>

        {/* composer — GPT style pill, never touches card border */}
        <div className="px-3 pb-2 pb-safe sm:px-4 sm:pb-2">
          <ChatComposer
            inputId="chat-input"
            value={input}
            onChange={setInput}
            onSend={(text, attachments) => void sendWithText(text, attachments)}
            disabled={false}
            busy={busy}
            placeholder="Ask a question…"
            showAttach={true}
          />
        </div>
      </div>

      {showCitations && (
        <CitationsModal
          citations={showCitations}
          onClose={() => setShowCitations(null)}
        />
      )}
    </div>
  );
}







