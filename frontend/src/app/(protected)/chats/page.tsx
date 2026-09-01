"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import ChatComposer, { type AttachedFile } from "@/components/ChatComposer";
import { useUserAvatar } from "@/lib/use-user-avatar";
import Avatar from "@/components/Avatar";
import {
  ArrowDownCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  EyeOff,
  MessagesSquare,
  Palette,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { Member, TeamChat, TeamMessage, ChatAttachment } from "@/lib/types";

const WALLPAPERS = [
  {
    id: "whatsapp-doodle",
    name: "WhatsApp Classic",
    icon: "💬",
    style: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M11 14.01V7a1 1 0 0 1 2 0v7.01A3.001 3.001 0 0 1 15 17a3 3 0 1 1-6 0c0-1.4.96-2.57 2.27-2.93L11 14zM4.41 23.9a2 2 0 1 1 2.83 2.83l-4.24 4.24a2 2 0 0 1-2.83-2.83l4.24-4.24zm34.25-3.32a2 2 0 1 1 2.83 2.83l-4.24 4.24a2 2 0 0 1-2.83-2.83l4.24-4.24zM51 14.01V7a1 1 0 0 1 2 0v7.01A3.001 3.001 0 0 1 55 17a3 3 0 1 1-6 0c0-1.4.96-2.57 2.27-2.93L51 14zM64.41 23.9a2 2 0 1 1 2.83 2.83l-4.24 4.24a2 2 0 0 1-2.83-2.83l4.24-4.24zM30 40a10 10 0 1 1-20 0 10 10 0 0 1 20 0zm40 0a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM17 65a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm40 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '160px 160px',
    },
  },
  {
    id: "instagram-aurora",
    name: "Instagram Aurora",
    icon: "🔮",
    style: {
      backgroundImage: `radial-gradient(at 15% 15%, rgba(168, 85, 247, 0.12) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(236, 72, 153, 0.12) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(99, 102, 241, 0.08) 0px, transparent 50%)`,
      backgroundSize: '100% 100%',
    },
  },
  {
    id: "midnight-velvet",
    name: "Midnight Velvet",
    icon: "🌌",
    style: {
      backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    },
  },
  {
    id: "whatsapp-emerald",
    name: "Emerald Glow",
    icon: "🌿",
    style: {
      backgroundImage: `radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 40%), radial-gradient(at 100% 100%, rgba(5, 150, 105, 0.1) 0px, transparent 40%)`,
      backgroundSize: '100% 100%',
    },
  },
  {
    id: "clean-minimal",
    name: "Clean Minimal",
    icon: "⚪",
    style: {},
  },
];

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

export default function ChatsPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [chats, setChats] = useState<TeamChat[]>([]);
  const [colleagues, setColleagues] = useState<Member[]>([]);
  const [activeChat, setActiveChat] = useState<TeamChat | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [composerText, setComposerText] = useState("");
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadEnd = useRef<HTMLDivElement>(null);

  const [displayCount, setDisplayCount] = useState(40);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [wallpaper, setWallpaper] = useState<string>("whatsapp-doodle");
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("askdocs_chat_wallpaper");
    if (saved) setWallpaper(saved);
  }, []);

  const selectWallpaper = (wpId: string) => {
    setWallpaper(wpId);
    localStorage.setItem("askdocs_chat_wallpaper", wpId);
    setShowWallpaperMenu(false);
  };

  const loadChats = useCallback(async () => {
    try { 
      const chatList = await api.listTeamChats(workspace?.id);
      // Strict recency sort: newest message or newest created conversation first
      chatList.sort((a, b) => new Date(b.last_message_at ?? b.created_at).getTime() - new Date(a.last_message_at ?? a.created_at).getTime());
      setChats(chatList);
      setActiveChat((curr) => {
        if (!curr) return null;
        const updated = chatList.find((c) => c.id === curr.id);
        return updated || curr;
      });
    } catch { /* ignore */ }
  }, [workspace?.id]);

  const loadColleagues = useCallback(async () => {
    if (!workspace) return;
    try { setColleagues((await api.listMembers(workspace.id)).filter((m) => m.email !== user?.email)); } catch { /* ignore */ }
  }, [workspace, user]);

  useEffect(() => {
    void loadChats();
    void loadColleagues();
    const t = setInterval(() => { void loadChats(); void loadColleagues(); }, 5000);
    return () => clearInterval(t);
  }, [loadChats, loadColleagues]);

  useEffect(() => {
    if (!activeChat) return;
    let cancelled = false;
    const poll = async () => { 
      try { 
        const msgs = await api.listTeamMessages(activeChat.id); 
        if (!cancelled) {
          setMessages(msgs);
          if (msgs.length > prevMsgCount.current) {
            void loadChats();
          }
        }
      } catch { /* ignore */ } 
    };
    void poll();
    const t = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(t); };
  }, [activeChat, loadChats]);

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

  // Handle upward infinite scroll in messages
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 300);

    // If near top and more messages exist to load
    if (el.scrollTop < 60 && displayCount < messages.length && !loadingOlder) {
      setLoadingOlder(true);
      const prevScrollHeight = el.scrollHeight;
      setDisplayCount((prev) => Math.min(messages.length, prev + 30));
      requestAnimationFrame(() => {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeight;
        setLoadingOlder(false);
      });
    }
  };

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
    try { 
      const chat = await api.createDirectChat(workspace.id, member.user_id); 
      setActiveChat(chat); 
      setMessages([]); 
      await loadChats(); 
    }
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

  function senderName(senderId?: string | null) {
    if (!senderId) return "Team member";
    const p = activeChat?.participants.find((u) => u.user_id === senderId);
    return p?.name || p?.email || "Team member";
  }

  async function handleSend(text: string, attachments: AttachedFile[]) {
    if (!activeChat || sending) return;
    const currentChatId = activeChat.id;
    setSending(true);
    try {
      const ids: string[] = []; const failed: string[] = [];
      for (const a of attachments) { try { ids.push((await api.uploadChatAttachment(a.file)).id); } catch { failed.push(a.file.name); } }
      const newMsg = await api.sendTeamMessage(currentChatId, text, ids);
      setComposerText("");
      if (failed.length > 0) alert(`Couldn't upload: ${failed.join(", ")}`);
      
      // Optimistically push message and bubble this chat to index #0 at the top
      setMessages((prev) => [...prev, newMsg]);
      const nowIso = new Date().toISOString();
      setChats((prev) => {
        const target = prev.find((c) => c.id === currentChatId);
        if (!target) return prev;
        const updatedTarget = { ...target, last_message_at: nowIso, last_message_preview: text };
        const others = prev.filter((c) => c.id !== currentChatId);
        return [updatedTarget, ...others];
      });

      const msgs = await api.listTeamMessages(currentChatId);
      setMessages(msgs);
      await loadChats();
    } catch (err) { alert((err as Error).message); } finally { setSending(false); }
  }

  if (!workspace && chats.length === 0) {
    return <div className="dark:border-white/10 dark:bg-[#121212] rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Create or select a workspace first.</div>;
  }

  const needle = query.trim().toLowerCase();
  const matches = (name?: string | null, email?: string | null) => !needle || (name ?? "").toLowerCase().includes(needle) || (email ?? "").toLowerCase().includes(needle);
  const onlineColleagues = colleagues.filter((m) => m.online && matches(m.name, m.email));
  const unreadTotal = chats.reduce((n, c) => n + (c.unread_count > 0 ? 1 : 0), 0);

  // Strict sorting: Conversation with latest message timestamp is ALWAYS #1 at top
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

  const displayedMessages = messages.slice(-displayCount);
  const hasMoreMessages = displayCount < messages.length;

  return (
    <div className="flex min-h-0 flex-1 w-full gap-0 md:gap-4">

      {/* ===== CHAT LIST PANEL ===== */}
      <div
        className={`gemini-gradient-bg sb-scroll flex-col overflow-y-auto border bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f14] rounded-2xl shrink-0 p-2 sm:p-3
          ${activeChat ? "hidden md:flex md:w-80 min-h-0" : "flex w-full md:w-80 min-h-0"}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="relative z-10 flex flex-col h-full">
          
          {/* Top Sticky Bar */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-2 pb-3 pt-2 backdrop-blur dark:border-white/5 dark:bg-[#0b0f14]/95">
            <div className="mb-2.5 flex items-center justify-between gap-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Office Chats</h2>
              <div className="flex shrink-0 items-center gap-1.5">
                <button 
                  onClick={() => setShowNewChat(true)} 
                  title="New Direct Message" 
                  aria-label="New chat" 
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:text-white transition-colors shadow-sm"
                >
                  <MessagesSquare className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setShowNewGroup(true)} 
                  title="New Group Chat" 
                  aria-label="New group" 
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1DB954] text-black hover:bg-[#1ed760] transition-colors shadow-sm"
                >
                  <UsersRound className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-2.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search chats or teammates…" 
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500 transition-all" 
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button 
                  key={c.key} 
                  onClick={() => setFilter(c.key)} 
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all ${filter === c.key ? "bg-purple-600 text-white shadow-sm dark:bg-purple-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"}`}
                >
                  {c.label}
                  {c.count !== undefined && c.count > 0 && (
                    <span className={`ml-1 px-1 rounded-full text-[10px] ${filter === c.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400"}`}>
                      {c.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active online teammates bar */}
          {onlineColleagues.length > 0 && (
            <div className="border-b border-slate-100 px-2 py-2.5 dark:border-white/5">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Active Now</div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {onlineColleagues.map((m) => (
                  <button key={m.user_id} onClick={() => void openDM(m)} className="flex shrink-0 flex-col items-center gap-1 hover:opacity-80 transition-opacity" title={`Message ${m.name || m.email}`}>
                    <ChatAvatar user={m} size={48} ring />
                    <span className="max-w-[52px] truncate text-[10px] font-medium text-slate-700 dark:text-zinc-300">{(m.name || m.email).split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unified Chat Feed */}
          <div className="flex-1 overflow-y-auto px-1 py-2">
            {visibleChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
                  <MessagesSquare className="h-7 w-7 text-slate-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No {filter === "group" ? "group" : filter === "direct" ? "personal" : ""} chats found</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                  {filter === "group" ? "Click the 👥 button above to create a group chat" : "Start a conversation using the buttons above"}
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {visibleChats.map((chat) => {
                  const other = otherParticipant(chat, user?.email);
                  const isActive = activeChat?.id === chat.id;
                  return (
                    <li key={chat.id} className="group flex items-center">
                      <button
                        onClick={() => { setActiveChat(chat); setMessages([]); }}
                        className={`wa-row flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${isActive ? "bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30" : "hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"}`}
                      >
                        {chat.type === "direct" && other ? <ChatAvatar user={other} size={42} /> : <GroupAvatar chat={chat} size={42} />}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className={`truncate ${chat.unread_count > 0 ? "text-sm font-bold text-slate-900 dark:text-white" : "text-sm font-medium text-slate-800 dark:text-zinc-200"}`}>
                              {chatTitle(chat, user?.email)}
                            </span>
                            <span className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-zinc-500">{fmtTime(chat.last_message_at)}</span>
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span className={`truncate text-xs ${chat.unread_count > 0 ? "font-semibold text-slate-900 dark:text-zinc-100" : "text-slate-500 dark:text-zinc-400"}`}>
                              {chat.last_message_preview || "No messages yet"}
                            </span>
                            {chat.unread_count > 0 && (
                              <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white shadow-sm">
                                {chat.unread_count}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); void deleteChat(chat.id); }} 
                        title="Delete chat" 
                        className="mr-1 shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 group-hover:opacity-100"
                      >
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
      <div className={`gemini-gradient-bg relative flex-col overflow-hidden border bg-white shadow-sm dark:border-white/10 dark:bg-[#181818] rounded-2xl ${activeChat ? "flex flex-1 min-w-0 min-h-0" : "hidden md:flex md:flex-1 md:min-w-0 md:min-h-0"}`}>
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="gemini-orb gemini-orb-3" />

        {!activeChat ? (
          <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
            <div>
              <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5"><MessagesSquare className="h-8 w-8 text-slate-300 dark:text-zinc-600" /></div>
              <p className="text-base font-semibold text-slate-700 dark:text-zinc-200">Select a conversation</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Pick a colleague or group chat from the list to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="relative z-30 flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-white/5 sm:px-4 bg-white/70 dark:bg-black/40 backdrop-blur-md">
              <button onClick={() => { setActiveChat(null); setMessages([]); }} aria-label="Back" className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>
              {activeChat.type === "direct" ? (
                <ChatAvatar user={otherParticipant(activeChat, user?.email) ?? {}} size={38} />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-bold"><UsersRound className="h-4 w-4" /></span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                  {activeChat.type === "direct" && <PresenceDot online={otherParticipant(activeChat, user?.email)?.online ?? false} />}
                  {chatTitle(activeChat, user?.email)}
                </div>
                <div className="truncate text-[11px] text-slate-400 dark:text-zinc-500">
                  {activeChat.type === "direct" ? (otherParticipant(activeChat, user?.email)?.online ? "Online" : "Offline") : `${activeChat.participants.length} members · ${activeChat.participants.map((p) => p.name || p.email).join(", ")}`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {/* Wallpaper Customizer - Uppermost Layer */}
                <div className="relative">
                  <button
                    onClick={() => setShowWallpaperMenu((v) => !v)}
                    title="Change chat wallpaper / theme"
                    aria-label="Change chat wallpaper / theme"
                    aria-expanded={showWallpaperMenu}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-purple-600 dark:hover:bg-white/10 dark:hover:text-purple-400 transition-colors"
                  >
                    <Palette className="h-4 w-4" />
                  </button>
                  {showWallpaperMenu && (
                    <>
                      <div className="fixed inset-0 z-[999]" onClick={() => setShowWallpaperMenu(false)} />
                      <div className="absolute right-0 top-full z-[1000] mt-2 w-52 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c20]/95 ring-1 ring-black/5 dark:ring-white/10">
                        <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          Chat Background Theme
                        </div>
                        {WALLPAPERS.map((wp) => (
                          <button
                            key={wp.id}
                            onClick={() => selectWallpaper(wp.id)}
                            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
                              wallpaper === wp.id
                                ? "bg-purple-50 font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shadow-sm"
                                : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="text-sm">{wp.icon}</span>
                              <span>{wp.name}</span>
                            </span>
                            {wallpaper === wp.id && <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button onClick={() => void hideChat(activeChat.id)} title="Hide chat" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 transition-colors"><EyeOff className="h-4 w-4" /></button>
                <button onClick={() => void deleteChat(activeChat.id)} title="Delete for you" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Messages with upward infinite scroll & custom wallpaper */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              style={WALLPAPERS.find((w) => w.id === wallpaper)?.style}
              className="scroll-touch wa-thread relative z-10 flex-1 min-h-0 space-y-2 overflow-y-auto px-3 py-4 sm:px-6 transition-all duration-300"
            >
              {hasMoreMessages && (
                <div className="flex justify-center py-2">
                  <button 
                    onClick={() => setDisplayCount((prev) => Math.min(messages.length, prev + 30))}
                    className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                  >
                    Load older messages ({messages.length - displayCount} more)
                  </button>
                </div>
              )}

              {displayedMessages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                    <div className={`relative max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${isMe ? "bg-purple-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white rounded-bl-sm"}`}>
                      {!isMe && activeChat.type === "group" && (
                        <p className="mb-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                          {senderName(m.sender_id)}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {m.attachments.map((att) => (
                            <AttachmentThumbnail key={att.id} att={att} />
                          ))}
                        </div>
                      )}
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-purple-200" : "text-slate-400 dark:text-zinc-500"}`}>
                        <span>{fmtTime(m.created_at)}</span>
                        {isMe && <ReadTicks readBy={m.read_by} myId={user?.id ?? ""} participantCount={activeChat.participants.length} />}
                      </div>
                    </div>
                    {isMe && (
                      <button 
                        onClick={() => void deleteMessage(m.id)} 
                        title="Delete message"
                        className="ml-1 opacity-0 group-hover:opacity-100 self-center p-1 text-slate-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={threadEnd} />
            </div>

            {/* Jump to bottom */}
            {showJump && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-20 right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-transform active:scale-95"
                aria-label="Scroll to bottom"
              >
                <ArrowDownCircle className="h-5 w-5" />
              </button>
            )}

            {/* Composer */}
            <div className="relative z-10 border-t border-slate-100 bg-white/80 p-2 dark:border-white/5 dark:bg-[#181818]/80 backdrop-blur sm:p-3">
              <ChatComposer
                value={composerText}
                onChange={setComposerText}
                onSend={handleSend}
                disabled={sending}
                showAttach
                showEmoji
                placeholder={`Message ${chatTitle(activeChat, user?.email)}…`}
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
            <div className="flex flex-col gap-2">
              {selectedIds.length < 2 && (
                <p className="text-xs text-slate-400 dark:text-zinc-500 text-right">
                  Select at least 2 members to create a group
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewGroup(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">Cancel</button>
                <button onClick={() => void createGroup()} disabled={!groupTitle.trim() || selectedIds.length < 2} className="rounded-lg bg-[#1DB954] px-4 py-2 text-sm font-semibold text-black hover:bg-[#1ed760] disabled:opacity-40">Create group</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
