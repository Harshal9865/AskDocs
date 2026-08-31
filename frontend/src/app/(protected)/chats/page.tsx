"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import ChatComposer from "@/components/ChatComposer";
import { useUserAvatar } from "@/lib/use-user-avatar";
import Avatar from "@/components/Avatar";
import {
  ArrowDownCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  EyeOff,
  MessagesSquare,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { Member, TeamChat, TeamMessage, ChatAttachment } from "@/lib/types";

type ChipFilter = "all" | "direct" | "group" | "unread";

function chatTitle(chat: TeamChat, myEmail?: string): string {
  if (chat.type === "group") return chat.title;
  const other = chat.participants.find((p) => p.email !== myEmail);
  return other?.name || other?.email || "Direct message";
}

function otherParticipant(chat: TeamChat, myEmail?: string) {
  return chat.participants.find((p) => p.email !== myEmail);
}

function ChatAvatar({
  user,
  size,
  ring = false,
}: {
  user: { user_id?: string; id?: string; name?: string | null; email?: string | null; avatar_kind?: string | null; avatar_value?: string | null; online?: boolean };
  size: number;
  ring?: boolean;
}) {
  const { src, stickerId } = useUserAvatar(user.user_id || user.id, user.avatar_kind, user.avatar_value);
  if (ring) {
    return (
      <span className={`inline-block shrink-0 rounded-full p-[2px] ${user.online ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600" : "bg-slate-200 dark:bg-white/10"}`}>
        <span className="block rounded-full bg-white p-[2px] dark:bg-[#0b0f14]">
          <Avatar name={user.name ?? user.email ?? "User"} size={size - 8} showPresence online={user.online} src={src} stickerId={stickerId} />
        </span>
      </span>
    );
  }
  return <Avatar name={user.name ?? user.email ?? "User"} size={size} showPresence online={user.online} src={src} stickerId={stickerId} />;
}

function GroupAvatar({ size = 40 }: { chat: TeamChat; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-emerald-700/40 text-emerald-600 ring-1 ring-emerald-500/20 dark:from-emerald-500/20 dark:to-emerald-900/50 dark:text-emerald-400 dark:ring-emerald-400/20" style={{ width: size, height: size }}>
      <UsersRound style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}

function PresenceDot({ online }: { online: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"}`} title={online ? "Online" : "Offline"} />;
}

function ReadTicks({ readBy, myId, participantCount }: { readBy: string[]; myId: string; participantCount: number }) {
  const othersRead = readBy.filter((id) => id !== myId).length;
  if (othersRead === 0) return <Check className="h-3 w-3 text-slate-400 dark:text-zinc-500" />;
  if (othersRead >= participantCount - 1) return <CheckCheck className="h-3 w-3 text-sky-500" />;
  return <CheckCheck className="h-3 w-3 text-slate-400 dark:text-zinc-500" />;
}

function AttachmentThumbnail({ att }: { att: ChatAttachment }) {
  const isImage = att.content_type.startsWith("image/");
  const isVideo = att.content_type.startsWith("video/");
  return (
    <a href={`${API_BASE}${att.url}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${API_BASE}${att.url}`} alt={att.filename} className="max-h-40 max-w-[240px] rounded-lg object-cover" />
      ) : isVideo ? (
        <video src={`${API_BASE}${att.url}`} controls preload="metadata" className="max-h-48 max-w-[260px] rounded-lg" />
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">{att.filename}</span>
      )}
    </a>
  );
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function dayLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "TODAY";
  if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export default function ChatsPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [chats, setChats] = useState<TeamChat[]>([]);
  const [colleagues, setColleagues] = useState<Member[]>([]);
  const [activeChat, setActiveChat] = useState<TeamChat | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState("");
  const [newChatResults, setNewChatResults] = useState<Member[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<ChipFilter>("all");
  const [query, setQuery] = useState("");
  const [showJump, setShowJump] = useState(false);
  const [heart, setHeart] = useState<{ id: string; k: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadEnd = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    if (!workspace) return;
    try { setChats(await api.listTeamChats(workspace.id)); } catch { /* ignore */ }
  }, [workspace]);

  const loadColleagues = useCallback(async () => {
    if (!workspace) return;
    try { setColleagues((await api.listMembers(workspace.id)).filter((m) => m.email !== user?.email)); } catch { /* ignore */ }
  }, [workspace, user]);

  useEffect(() => {
    setActiveChat(null); setMessages([]);
    void loadChats(); void loadColleagues();
    const t = setInterval(() => void loadColleagues(), 30000);
    return () => clearInterval(t);
  }, [loadChats, loadColleagues]);

  useEffect(() => {
    if (!activeChat) return;
    let cancelled = false;
    const poll = async () => { try { const msgs = await api.listTeamMessages(activeChat.id); if (!cancelled) setMessages(msgs); } catch { /* ignore */ } };
    void poll();
    const t = setInterval(poll, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, [activeChat]);

  const prevMsgCount = useRef(0);
  
  function scrollToBottom(smooth = true) {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  }
  
  useEffect(() => {
    const count = messages.length;
    if (count > 0) {
      const isInitial = prevMsgCount.current === 0;
      const isNew = count > prevMsgCount.current;
      
      const el = scrollRef.current;
      const isAtBottom = el ? (el.scrollHeight - el.scrollTop - el.clientHeight < 300) : true;

      if (isInitial || isAtBottom) {
        scrollToBottom(!isInitial);
      } else if (isNew) {
        setShowJump(true);
      }
    }
    prevMsgCount.current = count;
  }, [messages]);

  useEffect(() => {
    if (!showNewChat) return;
    const q = newChatQuery.trim();
    if (q.length < 2) { setNewChatResults([]); return; }
    let cancelled = false;
    const t = setTimeout(() => { api.searchUsers(q).then((r) => { if (!cancelled) setNewChatResults(r); }).catch(() => { if (!cancelled) setNewChatResults([]); }); }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [newChatQuery, showNewChat]);

  async function openDM(member: Member) {
    if (!workspace) return;
    try { const chat = await api.createDirectChat(workspace.id, member.user_id); setActiveChat(chat); setMessages([]); await loadChats(); }
    catch (err) { alert((err as Error).message); }
  }

  async function createGroup() {
    if (!workspace || !groupTitle.trim() || selectedIds.length < 2) return;
    try {
      const chat = await api.createGroupChat(workspace.id, groupTitle.trim(), selectedIds);
      setShowNewGroup(false); setGroupTitle(""); setSelectedIds([]); setActiveChat(chat); setMessages([]); await loadChats();
    } catch (err) { alert((err as Error).message); }
  }

  async function hideChat(chatId: string) {
    if (!confirm("Hide for you? Others still see it.")) return;
    try { await api.hideConversation(chatId); if (activeChat?.id === chatId) { setActiveChat(null); setMessages([]); } await loadChats(); }
    catch (err) { alert((err as Error).message); }
  }

  async function deleteChat(chatId: string) {
    if (!confirm("Delete this chat for you? Others will still see it. For groups, you'll leave the group.")) return;
    try { await api.deleteTeamChat(chatId); if (activeChat?.id === chatId) { setActiveChat(null); setMessages([]); } await loadChats(); }
    catch (err) { alert((err as Error).message); }
  }

  async function deleteMessage(messageId: string) {
    if (!activeChat || !confirm("Delete this message for everyone?")) return;
    try { await api.deleteTeamMessage(activeChat.id, messageId); setMessages((prev) => prev.filter((m) => m.id !== messageId)); await loadChats(); }
    catch (err) { alert((err as Error).message); }
  }

  async function handleSend(text: string, attachments: { file: File; previewUrl?: string }[]) {
    if (!activeChat || sending) return;
    setSending(true);
    try {
      const ids: string[] = []; const failed: string[] = [];
      for (const a of attachments) { try { ids.push((await api.uploadChatAttachment(a.file)).id); } catch { failed.push(a.file.name); } }
      await api.sendTeamMessage(activeChat.id, text, ids);
      if (failed.length > 0) alert(`Couldn't upload: ${failed.join(", ")}`);
      setMessages(await api.listTeamMessages(activeChat.id)); await loadChats();
    } catch (err) { alert((err as Error).message); } finally { setSending(false); }
  }

  if (!workspace) {
    return <div className="dark:border-white/10 dark:bg-[#121212] rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Create or select a workspace first.</div>;
  }

  const senderName = (id: string | null) => colleagues.find((c) => c.user_id === id)?.name ?? activeChat?.participants.find((p) => p.user_id === id)?.name ?? "You";
  const needle = query.trim().toLowerCase();
  const matches = (name?: string | null, email?: string | null) => !needle || (name ?? "").toLowerCase().includes(needle) || (email ?? "").toLowerCase().includes(needle);
  const filteredColleagues = colleagues.filter((m) => matches(m.name, m.email));
  const onlineColleagues = filteredColleagues.filter((m) => m.online);
  const unreadTotal = chats.reduce((n, c) => n + (c.unread_count > 0 ? 1 : 0), 0);

  const sortedChats = [...chats].sort((a, b) => new Date(b.last_message_at ?? b.created_at).getTime() - new Date(a.last_message_at ?? a.created_at).getTime());
  const seen = new Set<string>();
  const deduped = sortedChats.filter((c) => {
    if (c.type === "group") return true;
    const other = otherParticipant(c, user?.email);
    if (!other) return false;
    const key = other.user_id || other.email || c.id;
    if (key && seen.has(key)) return false;
    if (key) seen.add(key);
    return true;
  });

  const visibleChats = deduped
    .filter((c) => filter === "all" ? true : filter === "direct" ? c.type === "direct" : filter === "group" ? c.type === "group" : c.unread_count > 0)
    .filter((c) => matches(chatTitle(c, user?.email), null) || c.participants.some((p) => matches(p.name, p.email)));

  const chips: { key: ChipFilter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: deduped.length },
    { key: "direct", label: "Personal" },
    { key: "group", label: "Groups" },
    { key: "unread", label: "Unread", count: unreadTotal },
  ];

  return (
    <div className="flex min-h-0 flex-1 w-full gap-0 md:gap-4">

      {/* ===== CHAT LIST PANEL ===== */}
      <div
        className={`gemini-gradient-bg sb-scroll flex-col overflow-y-auto border bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f14] rounded-xl shrink-0 p-2 sm:p-3
          ${activeChat ? "hidden md:flex md:w-72 min-h-0" : "flex w-full md:w-72 min-h-0"}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="relative z-10 flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-3 pb-2 pt-3 backdrop-blur dark:border-white/5 dark:bg-[#0b0f14]/95">
            <div className="mb-2 flex items-center justify-between gap-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Chats</h2>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => setShowNewChat(true)} aria-label="New chat" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-black">
                  <MessagesSquare className="h-4 w-4" />
                </button>
                <button onClick={() => setShowNewGroup(true)} aria-label="New group" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1DB954] text-black hover:bg-[#1ed760]">
                  <UsersRound className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email…" className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-[#1DB954]/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button key={c.key} onClick={() => setFilter(c.key)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === c.key ? "bg-[#1DB954] text-black" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"}`}>
                  {c.label}{c.count !== undefined && c.count > 0 && <span className={`ml-1 ${filter === c.key ? "text-black/60" : "text-slate-400 dark:text-zinc-500"}`}>{c.count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Online row */}
          {onlineColleagues.length > 0 && (
            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-white/5">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {onlineColleagues.map((m) => (
                  <button key={m.user_id} onClick={() => void openDM(m)} className="flex shrink-0 flex-col items-center gap-1" title={`Message ${m.name || m.email}`}>
                    <ChatAvatar user={m} size={52} ring />
                    <span className="max-w-[56px] truncate text-[10px] text-slate-500 dark:text-zinc-500">{(m.name || m.email).split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Office mates */}
          <div className="border-b border-slate-100 px-3 py-2 dark:border-white/5">
            <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Office mates</div>
            {filteredColleagues.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-white/5 dark:text-zinc-400">{query ? "No matches" : "No colleagues yet — invite your team from the Members page."}</p>
            ) : (
              <ul>
                {filteredColleagues.map((m) => (
                  <li key={m.user_id}>
                    <button onClick={() => void openDM(m)} className="wa-row flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left">
                      <ChatAvatar user={m} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{m.name || m.email}</span>
                        <span className={`block text-xs ${m.online ? "text-[#1DB954]" : "text-slate-400 dark:text-zinc-500"}`}>{m.online ? "Online" : "Offline"}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent chats */}
          <div className="px-3 py-2">
            <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {filter === "all" ? "Recent" : filter === "unread" ? "Unread" : filter === "group" ? "Groups" : "Personal"}
            </div>
            {visibleChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5"><MessagesSquare className="h-8 w-8 text-slate-300 dark:text-zinc-600" /></div>
                <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">No chats here yet</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Tap a colleague above to start a conversation</p>
              </div>
            ) : (
              <ul>
                {visibleChats.map((chat) => {
                  const other = otherParticipant(chat, user?.email);
                  const isActive = activeChat?.id === chat.id;
                  return (
                    <li key={chat.id} className="group flex items-center">
                      <button
                        onClick={() => { setActiveChat(chat); setMessages([]); }}
                        className={`wa-row flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2.5 text-left ${isActive ? "wa-row-active" : ""}`}
                      >
                        {chat.type === "direct" && other ? <ChatAvatar user={other} size={44} /> : <GroupAvatar chat={chat} size={44} />}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className={`truncate text-slate-900 dark:text-white ${chat.unread_count > 0 ? "text-sm font-bold" : "text-sm font-semibold opacity-90"}`}>{chatTitle(chat, user?.email)}</span>
                            <span className="shrink-0 text-[11px] text-slate-400 dark:text-zinc-500">{fmtTime(chat.last_message_at)}</span>
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] text-slate-500 dark:text-zinc-400">{chat.last_message_preview || "No messages yet"}</span>
                            {chat.unread_count > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#1DB954] px-1.5 text-[10px] font-bold text-black">{chat.unread_count}</span>}
                          </span>
                        </span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); void deleteChat(chat.id); }} className="mr-1 shrink-0 rounded-md p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 group-hover:opacity-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ===== THREAD / MESSAGE PANEL ===== */}
      <div className={`gemini-gradient-bg relative flex-col overflow-hidden border bg-white shadow-sm dark:border-white/10 dark:bg-[#181818] rounded-xl ${activeChat ? "flex flex-1 min-w-0 min-h-0" : "hidden md:flex md:flex-1 md:min-w-0 md:min-h-0"}`}>
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="gemini-orb gemini-orb-3" />

        {!activeChat ? (
          <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
            <div>
              <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5"><MessagesSquare className="h-8 w-8 text-slate-300 dark:text-zinc-600" /></div>
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">Pick a colleague to start a direct message</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">or create a group chat to plan together</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="relative z-10 flex items-center gap-2 border-b border-slate-100 px-2 py-2 dark:border-white/5 sm:px-4">
              <button onClick={() => { setActiveChat(null); setMessages([]); }} aria-label="Back" className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>
              {activeChat.type === "direct" ? (
                <ChatAvatar user={otherParticipant(activeChat, user?.email) ?? {}} size={36} />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1DB954]/15 text-[#1DB954]"><UsersRound className="h-4 w-4" /></span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {activeChat.type === "direct" && <PresenceDot online={otherParticipant(activeChat, user?.email)?.online ?? false} />}
                  {chatTitle(activeChat, user?.email)}
                </div>
                <div className="truncate text-[11px] text-slate-400 dark:text-zinc-500">
                  {activeChat.type === "direct" ? (otherParticipant(activeChat, user?.email)?.online ? "Online" : "Offline") : activeChat.participants.map((p) => p.name || p.email).join(", ")}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button onClick={() => void hideChat(activeChat.id)} title="Hide chat" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"><EyeOff className="h-4 w-4" /></button>
                <button onClick={() => void deleteChat(activeChat.id)} title="Delete for you" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              onScroll={(e) => { const el = e.currentTarget; setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 300); }}
              className="scroll-touch wa-thread relative z-10 flex-1 min-h-0 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-6"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5"><MessagesSquare className="h-7 w-7 text-slate-300 dark:text-zinc-600" /></div>
                  <p className="text-sm text-slate-400 dark:text-zinc-500">No messages yet — say hello!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const mine = msg.sender_id === user?.id;
                  const sender = activeChat.participants.find((p) => p.user_id === msg.sender_id);
                  const prev = i > 0 ? messages[i - 1] : null;
                  const showDay = !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDay && (
                        <div className="my-3 flex justify-center">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-zinc-400">{dayLabel(new Date(msg.created_at))}</span>
                        </div>
                      )}
                      <div className={`group/msg flex items-end gap-1.5 ${mine ? "justify-end" : ""}`}>
                        {mine && (
                          <button onClick={() => void deleteMessage(msg.id)} title="Delete message" className="rounded-full p-1 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-900/20 group-hover/msg:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!mine && activeChat.type === "group" && sender && <ChatAvatar user={sender} size={26} />}
                        <div className={`relative min-w-0 max-w-[80%] ${mine ? "text-right" : ""}`} onDoubleClick={() => { setHeart({ id: msg.id, k: Date.now() }); setTimeout(() => setHeart(null), 750); }}>
                          {heart?.id === msg.id && <span key={heart.k} className="heart-pop pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-4xl">❤️</span>}
                          {!mine && activeChat.type === "group" && <div className="mb-0.5 pl-1 text-[11px] font-medium text-[#1DB954]">{senderName(msg.sender_id)}</div>}
                          <div className={`inline-block max-w-full select-none whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${mine ? "wa-bubble-mine rounded-br-md" : "wa-bubble-theirs rounded-bl-md"}`}>
                            {msg.content}
                            {msg.attachments?.length > 0 && <div className="mt-1">{msg.attachments.map((att) => <AttachmentThumbnail key={att.id} att={att} />)}</div>}
                            <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-black/45 dark:text-white/50" : "text-slate-400 dark:text-zinc-500"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {mine && <ReadTicks readBy={msg.read_by ?? []} myId={user?.id ?? ""} participantCount={activeChat.participants.length} />}
                            </span>
                          </div>
                        </div>
                        {!mine && activeChat.type === "direct" && sender && <span title={sender.name} className="hidden sm:block"><ChatAvatar user={sender} size={26} /></span>}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEnd} />
            </div>

            {showJump && (
              <button onClick={() => scrollToBottom()} aria-label="Jump to latest" className="absolute bottom-20 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-white text-[#1DB954] shadow-lg hover:scale-105 dark:border-emerald-500/20 dark:bg-[#2a3942] md:bottom-24">
                <ArrowDownCircle className="h-5 w-5" />
              </button>
            )}

            <div className="relative z-10 border-t border-slate-100/60 px-3 py-2 dark:border-white/5">
              <ChatComposer
                inputId="team-chat-input"
                value={input}
                onChange={setInput}
                onSend={(text, attachments) => { setInput(""); void handleSend(text, attachments); }}
                disabled={!activeChat}
                busy={sending}
                placeholder="Write a message…"
                showAttach={Boolean(activeChat)}
                variant="green"
              />
            </div>
          </>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => { setShowNewChat(false); setNewChatQuery(""); setNewChatResults([]); }}>
          <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-[#181818]" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">New chat</h2>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={newChatQuery} onChange={(e) => setNewChatQuery(e.target.value)} placeholder="Search name or email (any workspace)…" className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-[#242424] dark:text-white" />
            </div>
            {newChatQuery.trim().length < 2 ? (
              <>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Your workspace</h3>
                {colleagues.length === 0 ? <p className="mb-4 text-sm text-slate-500">No colleagues yet.</p> : (
                  <ul className="mb-4 space-y-1">
                    {colleagues.map((m) => (
                      <li key={m.user_id}><button onClick={() => { setShowNewChat(false); void openDM(m); }} className="wa-row flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left"><ChatAvatar user={m} size={36} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{m.name || m.email}</span><span className={`block text-xs ${m.online ? "text-[#1DB954]" : "text-slate-400 dark:text-zinc-500"}`}>{m.online ? "Online" : "Offline"}</span></span></button></li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Global results</h3>
                {newChatResults.length === 0 ? <p className="text-sm text-slate-500">No users found.</p> : (
                  <ul className="space-y-1">
                    {newChatResults.map((m) => (
                      <li key={m.user_id}><button onClick={() => { setShowNewChat(false); void openDM(m); }} className="wa-row flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left"><ChatAvatar user={m} size={36} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{m.name || m.email}</span><span className="block truncate text-xs text-slate-400 dark:text-zinc-500">{m.email}</span></span></button></li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* New group modal */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowNewGroup(false)}>
          <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6 dark:bg-[#181818]" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">New group chat</h2>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white" htmlFor="group-title">Group name</label>
            <input id="group-title" value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} placeholder="e.g. Launch planning" className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/20 dark:border-white/10 dark:bg-[#242424] dark:text-white" />
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Select members (min 2)</label>
            {colleagues.length === 0 ? <p className="mb-4 text-sm text-slate-500 dark:text-zinc-400">No colleagues to add yet.</p> : (
              <ul className="mb-4 max-h-48 space-y-1 overflow-y-auto">
                {colleagues.map((m) => (
                  <li key={m.user_id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-white/5">
                      <input type="checkbox" checked={selectedIds.includes(m.user_id)} onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, m.user_id] : prev.filter((id) => id !== m.user_id))} className="accent-[#1DB954]" />
                      {m.name || m.email}<PresenceDot online={m.online} />
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewGroup(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">Cancel</button>
              <button onClick={() => void createGroup()} disabled={!groupTitle.trim() || selectedIds.length < 2} className="rounded-lg bg-[#1DB954] px-4 py-2 text-sm font-semibold text-black hover:bg-[#1ed760] disabled:opacity-40">Create group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
