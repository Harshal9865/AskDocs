"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import ChatComposer from "@/components/ChatComposer";
import type { Citation, Conversation, Message } from "@/lib/types";
import {
  ArrowDownCircle,
  ArrowLeft,
  FileText,
  MessagesSquare,
  Sparkles,
  Trash2,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

interface SuggestedColleague { user_id: string; name: string; }

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
  suggested?: SuggestedColleague[];
  conflict?: { is_conflict: boolean; note: string } | null;
  freshness?: { oldest_days: number; document_title: string } | null;
  streaming?: boolean;
  previews?: string[];
  fileChips?: string[];
}

function CitationsModal({ citations, onClose }: { citations: Citation[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Sources used</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <ul className="space-y-3">
          {citations.map((c, i) => (
            <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 text-sm font-semibold">{c.document_title} <span className="font-normal text-slate-500">· chunk #{c.chunk_ordinal}</span></div>
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
  const [askedIdx, setAskedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showJump, setShowJump] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspace || !user) { setMyRole(null); return; }
    let cancelled = false;
    (async () => {
      try { const members = await api.listMembers(workspace.id); if (!cancelled) setMyRole(members.find((m) => m.email === user.email)?.role ?? null); }
      catch { if (!cancelled) setMyRole(null); }
    })();
    return () => { cancelled = true; };
  }, [workspace, user]);

  const canDelete = (conv: Conversation) => conv.user_id === user?.id || myRole === "admin";

  async function deleteConversation(conv: Conversation) {
    if (!confirm(`Delete conversation "${conv.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteConversation(conv.id);
      if (activeConv?.id === conv.id) { setActiveConv(null); setMessages([]); }
      await loadConversations();
    } catch (err) { alert((err as Error).message); }
  }

  useEffect(() => {
    if (!showCitations) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowCitations(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCitations]);

  const loadConversations = useCallback(async () => {
    if (!workspace) return;
    setConversations(await api.listConversations(workspace.id));
  }, [workspace]);

  useEffect(() => { setActiveConv(null); setMessages([]); void loadConversations(); }, [workspace, loadConversations]);

  function scrollToBottom(smooth = true) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }
  useEffect(() => { scrollToBottom(); }, [messages]);

  async function openConversation(conv: Conversation) {
    setActiveConv(conv);
    const history = await api.listMessages(conv.id);
    setMessages(history.map((m: Message) => ({
      id: m.id, role: m.role, content: m.content, citations: m.citations,
      conflict: m.conflict ?? null, freshness: m.freshness ?? null,
      suggested: m.suggested_colleagues && (!m.citations || m.citations.length === 0) ? m.suggested_colleagues : [],
    })));
  }

  async function askColleague(colleague: SuggestedColleague, question: string, idx: number) {
    if (!workspace) return;
    try { await api.askColleague(workspace.id, colleague.user_id, question); setAskedIdx(idx); }
    catch (err) { alert(`Could not message ${colleague.name}: ${(err as Error).message}`); }
  }

  async function newConversation() {
    if (!workspace) return;
    const conv = await api.createConversation(workspace.id);
    await loadConversations();
    setActiveConv(conv); setMessages([]); setInput("");
    document.getElementById("chat-input")?.focus();
  }

  async function sendWithText(question: string, attachments: { file: File; previewUrl?: string }[]) {
    if (!activeConv || (!question && attachments.length === 0) || busy) return;
    setBusy(true);

    const imgPreviews = attachments.filter((a) => a.previewUrl).map((a) => a.previewUrl!);
    const fileNames = attachments.filter((a) => !a.previewUrl).map((a) => a.file.name);
    const previewLabel = question || (attachments.length > 0 ? attachments.map((a) => (a.previewUrl ? "🖼️" : `📄 ${a.file.name}`)).join(" ") : "");
    setMessages((prev) => [...prev, { role: "user", content: previewLabel, previews: imgPreviews.length > 0 ? imgPreviews : undefined, fileChips: fileNames.length > 0 ? fileNames : undefined }, { role: "assistant", content: "", streaming: true }]);

    let attachmentText = ""; let attachmentIds: string[] = [];
    if (attachments.length > 0) {
      try {
        const uploaded = await api.uploadChatAttachments(activeConv.id, attachments.map((a) => a.file));
        attachmentIds = uploaded.filter((u) => u.id).map((u) => u.id);
        attachmentText = uploaded.filter((u) => u.text_excerpt).map((u) => `[File: ${u.filename}]\n${u.text_excerpt}`).join("\n\n");
      } catch { /* silently continue */ }
    }

    const fullQuestion = [question, attachmentText].filter(Boolean).join("\n\n");
    let done = false;
    const streamTimeout = setTimeout(() => {
      if (!done) setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], streaming: false }; return next; });
    }, 45000);

    await api.askStream(
      activeConv.id, fullQuestion,
      (text) => setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + text }; return next; }),
      (citations, suggested, conflict, freshness) => {
        done = true;
        setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], streaming: false, citations, conflict, freshness, suggested: citations && citations.length > 0 ? [] : suggested }; return next; });
        void loadConversations();
      },
      (messageId) => setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], id: messageId }; return next; }),
      (message) => { done = true; setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], streaming: false, content: next[next.length - 1].content || `Error: ${message}` }; return next; }); },
      undefined, attachmentIds,
    );

    clearTimeout(streamTimeout);
    if (!done) setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { ...next[next.length - 1], streaming: false }; return next; });
    setBusy(false);
  }

  if (!workspace) {
    return <div className="dark:border-slate-700/50 dark:bg-[#1a1a2e] rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">Create or select a workspace first.</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 w-full gap-0 md:gap-4">

      {/* ===== CONVERSATION LIST PANEL ===== */}
      <div
        className={`gemini-gradient-bg sb-scroll flex-col overflow-y-auto border bg-white shadow-sm dark:border-[rgba(129,140,248,0.16)] dark:bg-[#0d0d1f] rounded-xl shrink-0 p-2 sm:p-3
          ${activeConv ? "hidden md:flex md:w-64" : "flex w-full md:w-64"}`}
      >
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="relative z-10 flex flex-col">
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Chat</h2>
            <button
              onClick={() => void newConversation()}
              aria-label="New conversation"
              className="rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
            >
              + New
            </button>
          </div>
          {conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
                <MessagesSquare className="h-8 w-8 text-indigo-300 dark:text-indigo-500/60" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">No conversations yet</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Tap + New to ask about your documents</p>
            </div>
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c.id} className="group flex items-center">
                  <button
                    onClick={() => void openConversation(c)}
                    className={`min-w-0 flex-1 rounded-lg px-3 py-3 text-left transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ${activeConv?.id === c.id ? "ai-row-active" : ""}`}
                    title={c.title}
                  >
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{c.title}</span>
                  </button>
                  {canDelete(c) && (
                    <button onClick={(e) => { e.stopPropagation(); void deleteConversation(c); }} title="Delete conversation" className="mr-1 shrink-0 rounded-md p-2 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ===== AI THREAD PANEL ===== */}
      <div className={`gemini-gradient-bg relative flex-col overflow-hidden border bg-white shadow-sm dark:border-[rgba(129,140,248,0.16)] dark:bg-[#13132b] rounded-xl ${activeConv ? "flex flex-1 min-w-0" : "hidden md:flex md:flex-1 md:min-w-0"}`}>
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="gemini-orb gemini-orb-3" />

        {/* Thread header — always shown */}
        <div className="relative z-10 flex items-center gap-2 rounded-t-xl border-b border-slate-100 bg-white px-2 py-2 dark:border-white/5 dark:bg-[#13132b] sm:px-4">
          <button
            onClick={() => { setActiveConv(null); setMessages([]); }}
            aria-label="Back to conversations"
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{activeConv ? activeConv.title : "AI Assistant"}</div>
            <div className="truncate text-[11px] text-[#1DB954]">AI · answers from your documents</div>
          </div>
        </div>

        {/* Messages scroll area */}
        <div
          ref={scrollRef}
          onScroll={(e) => { const el = e.currentTarget; setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 300); }}
          className="scroll-touch ai-thread relative z-10 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-6"
        >
          {!activeConv ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <MessagesSquare className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Start a new conversation</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Ask about your documents and get AI-powered answers</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <Sparkles className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Ask anything</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Get answers from your documents, powered by AI</p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-1.5 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                )}
                <div className="min-w-0 max-w-[85%]">
                  <div className={`relative z-10 inline-block max-w-full whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "ai-bubble-mine ml-auto block rounded-br-md" : "ai-bubble-theirs block rounded-bl-md"}`}>
                    {m.previews && m.previews.length > 0 && (
                      <span className="mb-1.5 flex flex-wrap gap-1.5">
                        {m.previews.map((p, pi) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={pi} src={p} alt="attachment" className="max-h-44 max-w-[220px] rounded-xl object-cover" />
                        ))}
                      </span>
                    )}
                    {m.fileChips && m.fileChips.length > 0 && (
                      <span className="mb-1.5 flex flex-wrap gap-1.5">
                        {m.fileChips.map((fn, fi) => (
                          <span key={fi} className="flex items-center gap-1 rounded-lg bg-white/60 px-2 py-1 text-xs dark:bg-white/10">
                            <FileText className="h-3 w-3" /> {fn}
                          </span>
                        ))}
                      </span>
                    )}
                    {m.content}
                    {m.streaming && <span className="ml-1 inline-block animate-pulse">▋</span>}
                  </div>
                  {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.citations.map((c, ci) => (
                        <button key={ci} onClick={() => setShowCitations(m.citations!)} className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:border-indigo-400">
                          <FileText className="h-3 w-3" /> {c.document_title}
                        </button>
                      ))}
                      {m.id && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/answers/${m.id}`).then(() => { setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }); }}
                          className="rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          {copiedIdx === i ? "✓ Copied" : "🔗 Share"}
                        </button>
                      )}
                    </div>
                  )}
                  {m.role === "assistant" && !m.streaming && m.conflict?.is_conflict && (
                    <div className="mt-2 max-w-[92%] rounded-xl border border-amber-300 bg-amber-50 p-3">
                      <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-900"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Sources disagree — these documents give conflicting information.</p>
                      {m.conflict.note && <p className="mt-1 pl-5 text-xs text-amber-800">{m.conflict.note}</p>}
                      <p className="mt-1 pl-5 text-[10px] text-amber-700">Verify with the document owners before relying on this answer.</p>
                    </div>
                  )}
                  {m.role === "assistant" && !m.streaming && m.freshness && (
                    <div className="mt-2 max-w-[92%] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-600">⏳ Based in part on <span className="font-semibold">{m.freshness.document_title}</span>, uploaded {m.freshness.oldest_days} days ago. Newer documents may exist.</p>
                    </div>
                  )}
                  {m.role === "assistant" && !m.streaming && m.suggested && m.suggested.length > 0 && (
                    <div className="mt-2 max-w-[92%] rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900"><UsersRound className="h-3.5 w-3.5" /> No document answered this — ask your team:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.suggested.map((s) =>
                          askedIdx === i ? (
                            <Link key={s.user_id} href="/chats" className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">✓ Asked — open chat</Link>
                          ) : (
                            <button key={s.user_id} onClick={() => void askColleague(s, messages[i - 1]?.content ?? "", i)} className="rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">Ask {s.name}</button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={threadEnd} />
        </div>

        {showJump && (
          <button onClick={() => scrollToBottom()} aria-label="Jump to latest" className="absolute bottom-28 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200/60 bg-white text-indigo-600 shadow-lg hover:scale-105 dark:border-indigo-500/30 dark:bg-[#23233d] dark:text-indigo-300 md:bottom-32">
            <ArrowDownCircle className="h-5 w-5" />
          </button>
        )}

        <div className="relative z-10 rounded-b-xl border-t border-indigo-100/60 bg-white px-3 pb-4 pt-3 pb-safe dark:border-indigo-500/10 dark:bg-[#13132b] sm:px-4 sm:pb-5 sm:pt-3">
          <ChatComposer
            inputId="chat-input"
            value={input}
            onChange={setInput}
            onSend={(text, attachments) => { setInput(""); void sendWithText(text, attachments); }}
            disabled={false}
            busy={busy}
            placeholder="Ask a question…"
            showAttach={true}
            variant="aurora"
          />
        </div>
      </div>

      {showCitations && <CitationsModal citations={showCitations} onClose={() => setShowCitations(null)} />}
    </div>
  );
}
