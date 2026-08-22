"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import type { Citation, Conversation, Message } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
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
        role: m.role,
        content: m.content,
        citations: m.citations,
      })),
    );
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
    const question = input.trim();
    setInput("");
    setBusy(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", streaming: true },
    ]);

    let done = false;
    await api.askStream(
      activeConv.id,
      question,
      (text) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + text };
          return next;
        }),
      (citations) => {
        done = true;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, streaming: false, citations };
          return next;
        });
        void loadConversations(); // refresh titles in sidebar list
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
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        Create or select a workspace first.
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-8.5rem)] max-w-5xl gap-4 md:h-[calc(100vh-3rem)]">
      {/* conversation list */}
      {listOpen && (
        <div
          className="fixed inset-0 z-10 bg-slate-900/50 md:hidden"
          onClick={() => setListOpen(false)}
          aria-hidden
        />
      )}
      <div className={`absolute inset-y-0 left-0 z-20 w-60 transform overflow-y-auto border-r border-slate-200 bg-white pr-3 transition-transform duration-200 md:relative md:z-auto md:w-56 md:translate-x-0 md:bg-transparent ${listOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`}>
        <button
          onClick={() => void newConversation()}
          className="mb-3 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
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
                🗑
              </button>
            )}
          </div>
        ))}
      </div>

      {/* thread */}
      <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => setListOpen((o) => !o)}
              aria-label="Toggle conversations list"
              className="mx-3 mt-3 self-start rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 md:hidden"
            >
              💬 Conversations
            </button>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {!activeConv ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
              Start a new conversation to ask about your documents.
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
              Ask anything about the documents in this workspace.
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i}>
                <div
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "ml-auto block rounded-br-md bg-indigo-600 text-white" : "block rounded-bl-md border border-slate-200 bg-white"
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
                          className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-slate-700 hover:border-zinc-900 hover:text-zinc-900"
                        >
                          📄 {c.document_title}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))
          )}
          <div ref={threadEnd} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="border-t border-slate-200 p-4"
        >
          <div className="flex gap-2">
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!activeConv || busy}
              placeholder={
                activeConv ? "Ask a question…" : "Start a conversation first"
              }
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={!activeConv || busy || !input.trim()}
              className="rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {busy ? "…" : "Send"}
            </button>
          </div>
        </form>
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




