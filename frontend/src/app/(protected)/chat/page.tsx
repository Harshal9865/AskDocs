"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import ChatComposer from "@/components/ChatComposer";
import { AIAvatarIcon } from "@/components/AIAvatarIcon";
import PricingModal from "@/components/PricingModal";
import type { Citation, Conversation, Message } from "@/lib/types";
import {
  ArrowDownCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckSquare,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessagesSquare,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Sparkles,
  Square,
  Trash2,
  TriangleAlert,
  UsersRound,
  X,
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

function CitationsModal({
  citations,
  workspaceId,
  onClose,
}: {
  citations: Citation[];
  workspaceId?: string;
  onClose: () => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copySnippet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-[#13111f] dark:ring-white/10 sm:h-[90vh] sm:rounded-3xl animate-in slide-in-from-right duration-250 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 font-bold">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Sources & Citations
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                {citations.length} document chunk{citations.length > 1 ? "s" : ""} referenced by AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Citations List */}
        <div className="flex-1 space-y-3.5 overflow-y-auto p-6 scroll-touch">
          {citations.map((c, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs backdrop-blur-md transition-all hover:border-purple-300 dark:border-white/10 dark:bg-[#181628]/90 dark:hover:border-purple-500/30"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {c.document_title}
                  </span>
                </div>
                <span className="shrink-0 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  Chunk #{c.chunk_ordinal}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-700 dark:border-white/5 dark:bg-black/20 dark:text-zinc-300 font-sans">
                <p className="whitespace-pre-wrap">{c.snippet}</p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                {workspaceId && c.document_id ? (
                  <Link
                    href={`/documents/${workspaceId}/${c.document_id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" /> View original document
                  </Link>
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Source referenced
                  </span>
                )}

                <button
                  onClick={() => copySnippet(c.snippet, i)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-colors"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [showCitations, setShowCitations] = useState<Citation[] | null>(null);
  const [askedIdx, setAskedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadEnd = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

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
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
    } catch (err) { alert((err as Error).message); }
  }

  async function togglePin(conv: Conversation) {
    try {
      const isCurrentlyPinned = Boolean(conv.is_pinned);
      if (isCurrentlyPinned) {
        await api.unpinConversation(conv.id);
      } else {
        await api.pinConversation(conv.id);
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, is_pinned: !isCurrentlyPinned } : c))
      );
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(allIds: string[]) {
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected conversation(s)? This cannot be undone.`)) return;
    try {
      const idsToDelete = Array.from(selectedIds);
      await Promise.allSettled(idsToDelete.map((id) => api.deleteConversation(id)));
      if (activeConv && selectedIds.has(activeConv.id)) {
        setActiveConv(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  useEffect(() => {
    if (!showCitations) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowCitations(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCitations]);

  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    if (workspace) {
      try {
        localStorage.setItem(`askdocs_last_ai_conv_${workspace.id}`, conv.id);
      } catch {}
    }
    prevMsgCount.current = 0;
    try {
      const history = await api.listMessages(conv.id);
      setMessages(history.map((m: Message) => ({
        id: m.id, role: m.role, content: m.content, citations: m.citations,
        conflict: m.conflict ?? null, freshness: m.freshness ?? null,
        suggested: m.suggested_colleagues && (!m.citations || m.citations.length === 0) ? m.suggested_colleagues : [],
      })));
      scrollToBottom(false);
    } catch {
      setMessages([]);
    }
  }, [workspace]);

  const loadConversations = useCallback(async () => {
    if (!workspace) return;
    try {
      const res = await api.listConversations(workspace.id);
      let list: Conversation[] = [];
      let next: string | null = null;
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray((res as unknown as { items?: Conversation[] }).items)) {
        list = (res as unknown as { items: Conversation[] }).items;
        next = (res as unknown as { next_cursor?: string | null }).next_cursor || null;
      }
      setConversations(list);
      setNextCursor(next);
      // Auto-restore active conversation on reload or initial render
      if (list.length > 0) {
        setActiveConv((current) => {
          if (current) return current;
          let targetId = "";
          try {
            targetId = localStorage.getItem(`askdocs_last_ai_conv_${workspace.id}`) || "";
          } catch {}
          const target = list.find((c) => c.id === targetId) || list[0];
          if (target) {
            void openConversation(target);
          }
          return target || null;
        });
      }
    } catch {
      setConversations([]);
    }
  }, [workspace, openConversation]);

  const loadMoreConversations = useCallback(async () => {
    if (!workspace || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.listConversations(workspace.id, nextCursor);
      let items: Conversation[] = [];
      let next: string | null = null;
      if (Array.isArray(res)) {
        items = res;
      } else if (res && Array.isArray((res as unknown as { items?: Conversation[] }).items)) {
        items = (res as unknown as { items: Conversation[] }).items;
        next = (res as unknown as { next_cursor?: string | null }).next_cursor || null;
      }
      setConversations((prev) => {
        const currentList = Array.isArray(prev) ? prev : [];
        const existingIds = new Set(currentList.map((c) => c.id));
        const newItems = items.filter((c) => !existingIds.has(c.id));
        return [...currentList, ...newItems];
      });
      setNextCursor(next);
    } catch {}
    finally {
      setLoadingMore(false);
    }
  }, [workspace, nextCursor, loadingMore]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMoreConversations();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [nextCursor, loadMoreConversations]);

  useEffect(() => {
    void loadConversations();
  }, [workspace, loadConversations]);

  const prevMsgCount = useRef(0);
  
  function scrollToBottom(smooth = false) {
    const el = scrollRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }

  useEffect(() => {
    const count = messages.length;
    if (count > 0) {
      const isInitial = prevMsgCount.current === 0;
      scrollToBottom(!isInitial && !busy);
    }
    prevMsgCount.current = count;
  }, [messages, busy]);

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

  function startRename(conv: Conversation) {
    setRenamingId(conv.id);
    setRenameValue(conv.title === "New conversation" ? "" : conv.title);
    setTimeout(() => renameInputRef.current?.select(), 50);
  }

  async function submitRename(conv: Conversation) {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== conv.title) {
      try {
        await api.renameConversation(conv.id, trimmed);
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, title: trimmed } : c))
        );
        if (activeConv?.id === conv.id) setActiveConv((a) => a ? { ...a, title: trimmed } : a);
      } catch { /* ignore */ }
    }
    setRenamingId(null);
    setRenameValue("");
  }

  function getDateGroup(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return "Previous 7 Days";
    if (diffDays <= 30) return "Previous 30 Days";
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  }

  function getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  async function sendWithText(question: string, attachments: { file: File; previewUrl?: string }[]) {
    if (!activeConv || (!question && attachments.length === 0) || busy) return;
    setBusy(true);

    const imgPreviews = (attachments || []).filter((a) => a.previewUrl).map((a) => a.previewUrl!);
    const fileNames = (attachments || []).filter((a) => !a.previewUrl).map((a) => a.file.name);
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
      if (!done) {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last) {
            next[next.length - 1] = {
              ...last,
              streaming: false,
              content: last?.content || "Processing document summary...",
            };
          }
          return next;
        });
      }
    }, 90000);

    try {
      await api.askStream(
        activeConv.id,
        fullQuestion,
        (text) =>
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: next[next.length - 1].content + text,
            };
            return next;
          }),
        (citations, suggested, conflict, freshness) => {
          done = true;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              streaming: false,
              citations,
              conflict,
              freshness,
              suggested: citations && citations.length > 0 ? [] : suggested,
            };
            return next;
          });
          void loadConversations();
        },
        (messageId) =>
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], id: messageId };
            return next;
          }),
        (message) => {
          done = true;
          const msgStr = String(message || "");
          if (msgStr.toLowerCase().includes("limit") || msgStr.toLowerCase().includes("upgrade")) {
            setPricingOpen(true);
          }
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = {
              ...last,
              streaming: false,
              content: last?.content || `Notice: ${msgStr}`,
            };
            return next;
          });
        },
        undefined,
        attachmentIds,
        (updatedTitle) => {
          if (activeConv) {
            setActiveConv((curr) => (curr ? { ...curr, title: updatedTitle } : curr));
          }
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConv.id ? { ...c, title: updatedTitle } : c))
          );
        },
      );
    } catch {
      done = true;
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = {
          ...last,
          streaming: false,
          content: last?.content || "Processing document summary...",
        };
        return next;
      });
    }

    clearTimeout(streamTimeout);
    if (!done) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last) {
          next[next.length - 1] = {
            ...last,
            streaming: false,
            content: last?.content || "Processing document summary...",
          };
        }
        return next;
      });
    }
    setBusy(false);
  }

  // Auto-send query param if routed from Dashboard or external link
  const initialQueryHandled = useRef(false);
  useEffect(() => {
    if (!workspace || initialQueryHandled.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && q.trim()) {
      initialQueryHandled.current = true;
      window.history.replaceState({}, "", window.location.pathname);
      void (async () => {
        try {
          const conv = await api.createConversation(workspace.id);
          setConversations((prev) => [conv, ...(Array.isArray(prev) ? prev : [])]);
          setActiveConv(conv);
          setMessages([]);
          setInput(q.trim());
          setTimeout(() => {
            void sendWithText(q.trim(), []);
          }, 150);
        } catch {
          setInput(q.trim());
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  if (!workspace) {
    return <div className="dark:border-slate-700/50 dark:bg-[#1a1a2e] rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">Create or select a workspace first.</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 w-full gap-0 md:gap-4">

      {/* ===== CONVERSATION LIST PANEL ===== */}
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          if (renamingId || isSelectMode) return;
          const convList = Array.isArray(conversations) ? conversations : [];
          const filtered = convList.filter(
            (c) => !convSearch.trim() || (c.title && c.title.toLowerCase().includes(convSearch.toLowerCase()))
          );
          if (filtered.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            const nextIdx = focusedIndex < filtered.length - 1 ? focusedIndex + 1 : 0;
            setFocusedIndex(nextIdx);
            void openConversation(filtered[nextIdx]);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prevIdx = focusedIndex > 0 ? focusedIndex - 1 : filtered.length - 1;
            setFocusedIndex(prevIdx);
            void openConversation(filtered[prevIdx]);
          } else if (e.key === "F2" && activeConv) {
            e.preventDefault();
            startRename(activeConv);
          } else if (e.key === "Delete" && activeConv && canDelete(activeConv)) {
            e.preventDefault();
            void deleteConversation(activeConv);
          }
        }}
        className={`gemini-gradient-bg sb-scroll relative flex-col overflow-y-auto border bg-white/95 shadow-sm backdrop-blur-md outline-none focus:ring-1 focus:ring-purple-500/30 dark:border-[rgba(129,140,248,0.16)] dark:bg-[#0d0d1f]/95 rounded-2xl shrink-0 p-2.5 sm:p-3.5
          ${activeConv ? "hidden md:flex md:w-72 min-h-0" : "flex w-full md:w-72 min-h-0"}`}
      >
        <div className="gemini-orb gemini-orb-1 opacity-40" />
        <div className="gemini-orb gemini-orb-2 opacity-40" />

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          {/* Header with animated gradient title, Select toggle, and new chat button */}
          <div className="mb-3 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-sm shadow-purple-500/30">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-bold sm:text-base bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-indigo-200">
                AI Chats
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {(Array.isArray(conversations) ? conversations.length : 0) > 0 && (
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    setSelectedIds(new Set());
                  }}
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                    isSelectMode
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                  title={isSelectMode ? "Exit selection mode" : "Select multiple chats"}
                >
                  {isSelectMode ? "Done" : "Select"}
                </button>
              )}
              <button
                onClick={() => void newConversation()}
                aria-label="New conversation"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> New
              </button>
            </div>
          </div>

          {/* Quick Search in AI Conversations */}
          {(Array.isArray(conversations) ? conversations.length : 0) > 2 && (
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search chats…"
                className="w-full rounded-xl border border-slate-200/80 bg-white/80 py-1.5 pl-8 pr-3 text-xs outline-none backdrop-blur-sm transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#181824] dark:text-white"
              />
            </div>
          )}

          {(() => {
            const convList = Array.isArray(conversations) ? conversations : [];
            const filtered = convList.filter(
              (c) => !convSearch.trim() || (c.title && c.title.toLowerCase().includes(convSearch.toLowerCase()))
            );
            if (filtered.length === 0) {
              return (
                <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200/60 dark:border-purple-500/20">
                    <MessagesSquare className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                    {convSearch.trim() ? "No chats match your search" : "No conversations yet"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                    {convSearch.trim() ? "Try a different keyword" : "Tap + New to ask about your documents"}
                  </p>
                </div>
              );
            }

            const pinned = filtered.filter((c) => Boolean(c.is_pinned));
            const unpinned = filtered.filter((c) => !c.is_pinned);

            // Build date groups for unpinned conversations
            const groups: Record<string, typeof unpinned> = {};
            const GROUP_ORDER = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Older"];
            for (const c of unpinned) {
              const g = getDateGroup(c.created_at);
              const key = GROUP_ORDER.includes(g) ? g : "Older";
              if (!groups[key]) groups[key] = [];
              groups[key].push(c);
            }

            const renderConversationItem = (c: Conversation) => {
              const isActive = activeConv?.id === c.id;
              const isRenaming = renamingId === c.id;
              const isSelected = selectedIds.has(c.id);

              return (
                <li key={c.id} className="group relative flex items-center">
                  {isRenaming ? (
                    /* ── Inline rename input ── */
                    <div className="flex w-full items-center gap-1.5 rounded-xl border border-purple-400 bg-white px-2 py-1.5 shadow-sm dark:border-purple-500/60 dark:bg-[#1a1a2e]">
                      <AIAvatarIcon className="h-5 w-5 shrink-0" />
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => void submitRename(c)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); void submitRename(c); }
                          else if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                        }}
                        className="flex-1 bg-transparent text-xs font-medium text-slate-800 outline-none dark:text-white"
                        placeholder="Rename conversation…"
                        autoFocus
                      />
                      <button
                        onMouseDown={(e) => { e.preventDefault(); void submitRename(c); }}
                        className="rounded p-0.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); setRenamingId(null); setRenameValue(""); }}
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Selection checkbox */}
                      {isSelectMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(c.id);
                          }}
                          className="mr-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (isSelectMode) {
                            toggleSelect(c.id);
                          } else {
                            void openConversation(c);
                          }
                        }}
                        onDoubleClick={() => {
                          if (!isSelectMode) startRename(c);
                        }}
                        className={`relative flex w-full items-center gap-2.5 rounded-xl pl-3 pr-2.5 py-2 text-left transition-all duration-150 group-hover:pr-24 overflow-hidden ${
                          isSelected
                            ? "border border-purple-400/80 bg-purple-50/80 dark:border-purple-500/40 dark:bg-purple-950/50"
                            : isActive
                            ? "bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-blue-500/10 border border-purple-300/80 shadow-sm ring-1 ring-purple-500/20 dark:border-purple-500/30 dark:bg-purple-950/40"
                            : "border border-transparent hover:border-slate-200/70 hover:bg-slate-50/80 dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
                        }`}
                        title={c.title}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-purple-500 via-indigo-500 to-cyan-500" aria-hidden />
                        )}
                        {/* Avatar */}
                        <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                          <AIAvatarIcon className="h-6 w-6" streaming={isActive && busy} />
                        </div>
                        {/* Title + timestamp */}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-center gap-1 min-w-0">
                            {c.is_pinned && (
                              <Pin className="h-3 w-3 shrink-0 text-amber-500 fill-amber-500" />
                            )}
                            <span
                              className={`truncate text-xs font-medium leading-tight ${
                                isActive ? "font-semibold text-purple-950 dark:text-white" : "text-slate-700 dark:text-zinc-300"
                              }`}
                            >
                              {c.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            {getRelativeTime(c.created_at)}
                          </span>
                        </div>
                      </button>

                      {/* Floating Action Pill with solid contrast and distinct icons */}
                      {!isSelectMode && (
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-xl border border-slate-200/90 bg-white/95 px-1.5 py-1 shadow-md opacity-0 backdrop-blur-md transition-all duration-150 group-hover:opacity-100 dark:border-white/15 dark:bg-[#18182c]/95 dark:shadow-xl z-20 pointer-events-auto">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); void togglePin(c); }}
                            title={c.is_pinned ? "Unpin chat" : "Pin chat to top"}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-amber-50 hover:text-amber-600 dark:text-zinc-300 dark:hover:bg-amber-950/60 dark:hover:text-amber-400 transition-colors"
                          >
                            {c.is_pinned ? <PinOff className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" /> : <Pin className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startRename(c); }}
                            title="Rename"
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-purple-50 hover:text-purple-600 dark:text-zinc-300 dark:hover:bg-purple-950/60 dark:hover:text-purple-300 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {canDelete(c) && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); void deleteConversation(c); }}
                              title="Delete"
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-zinc-300 dark:hover:bg-red-950/60 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            };

            return (
              <div className="space-y-1">
                {/* Pinned Section */}
                {pinned.length > 0 && (
                  <div>
                    <p className="sticky top-0 z-10 flex items-center gap-1 px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <Pin className="h-2.5 w-2.5 fill-amber-500/20" /> Pinned
                    </p>
                    <ul className="space-y-0.5">
                      {pinned.map(renderConversationItem)}
                    </ul>
                  </div>
                )}

                {/* Date Grouped Sections */}
                {GROUP_ORDER.filter((g) => (groups[g] ?? []).length > 0).map((group) => (
                  <div key={group}>
                    <p className="sticky top-0 z-10 px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      {group}
                    </p>
                    <ul className="space-y-0.5">
                      {(groups[group] ?? []).map(renderConversationItem)}
                    </ul>
                  </div>
                ))}

                {/* Infinite scroll sentinel & loader */}
                <div ref={observerTarget} className="py-2 flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Loading more chats…</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Bulk Selection Footer Bar */}
          {isSelectMode && (
            <div className="sticky bottom-0 mt-auto pt-2 border-t border-slate-200/80 bg-white/95 backdrop-blur-sm dark:border-white/10 dark:bg-[#0d0d1f]/95">
              <div className="flex items-center justify-between text-xs font-medium px-1 pb-1">
                <span className="text-slate-600 dark:text-zinc-300">
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={() =>
                    toggleSelectAll(
                      (Array.isArray(conversations) ? conversations : []).map((c) => c.id)
                    )
                  }
                  className="text-purple-600 hover:underline dark:text-purple-400"
                >
                  {selectedIds.size ===
                  (Array.isArray(conversations) ? conversations.length : 0)
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => void bulkDelete()}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedIds.size})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== AI THREAD PANEL ===== */}
      <div className={`gemini-gradient-bg relative flex-col overflow-hidden border bg-white shadow-sm dark:border-[rgba(129,140,248,0.16)] dark:bg-[#13132b] rounded-xl ${activeConv ? "flex flex-1 min-w-0 min-h-0" : "hidden md:flex md:flex-1 md:min-w-0 md:min-h-0"}`}>
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
          <AIAvatarIcon className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{activeConv ? activeConv.title : "AI Assistant"}</div>
            <div className="truncate text-[11px] text-[#1DB954]">AI · answers from your documents</div>
          </div>
        </div>

        {/* Messages scroll area */}
        <div
          ref={scrollRef}
          onScroll={(e) => { const el = e.currentTarget; setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 300); }}
          className="scroll-touch ai-thread relative z-10 flex-1 min-h-0 space-y-3 overflow-y-auto px-3 py-4 sm:px-6"
        >
          {!activeConv ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4 py-8">
              <AIAvatarIcon className="mx-auto mb-4 h-16 w-16" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">AskDocs Intelligence</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400 dark:text-zinc-400">
                Select or create a conversation from the sidebar to chat with your workspace knowledge.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4 py-6">
              <AIAvatarIcon className="mx-auto mb-4 h-16 w-16" />
              <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent dark:from-purple-300 dark:via-indigo-300 dark:to-cyan-300">
                How can I help you today?
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-zinc-400">
                Ask questions, synthesize findings, or extract obligations across your uploaded documents.
              </p>

              {/* Quick Prompt Suggestions */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full text-left">
                {[
                  {
                    title: "Summarize Documents",
                    desc: "Provide an executive summary of key files",
                    query: "Can you provide a comprehensive summary of all documents in this workspace?",
                  },
                  {
                    title: "Key Deadlines & Obligations",
                    desc: "Extract actionable dates and contract terms",
                    query: "What are the most critical obligations, renewal dates, and deadlines mentioned?",
                  },
                  {
                    title: "Risk & Conflict Analysis",
                    desc: "Identify contradictory clauses or discrepancies",
                    query: "Are there any conflicting statements, ambiguities, or compliance risks in our files?",
                  },
                  {
                    title: "Action Item Checklist",
                    desc: "Generate a step-by-step priority to-do list",
                    query: "Generate a prioritized checklist of next steps and action items based on the documents.",
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void sendWithText(item.query, [])}
                    className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white/70 p-3.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-purple-500/40 dark:hover:bg-white/[0.07]"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      {item.title}
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-1.5 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <AIAvatarIcon className="h-7 w-7 shrink-0" streaming={m.streaming} />
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
                    {m.streaming && <span className="ml-1.5 inline-block h-2 w-2 animate-bounce rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
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
          <button onClick={() => scrollToBottom()} aria-label="Jump to latest" className="absolute bottom-20 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200/60 bg-white text-indigo-600 shadow-lg hover:scale-105 dark:border-indigo-500/30 dark:bg-[#23233d] dark:text-indigo-300 md:bottom-24">
            <ArrowDownCircle className="h-5 w-5" />
          </button>
        )}

        <div className="relative z-10 rounded-b-xl border-t border-indigo-100/60 bg-white px-3 py-2 dark:border-indigo-500/10 dark:bg-[#13132b]">
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

      {showCitations && (
        <CitationsModal
          citations={showCitations}
          workspaceId={workspace?.id}
          onClose={() => setShowCitations(null)}
        />
      )}

      {pricingOpen && (
        <PricingModal
          isOpen={true}
          onClose={() => setPricingOpen(false)}
        />
      )}
    </div>
  );
}
