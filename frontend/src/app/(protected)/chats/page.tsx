"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import ChatComposer, { type AttachedFile } from "@/components/ChatComposer";
import { useUserAvatar } from "@/lib/use-user-avatar";
import Avatar from "@/components/Avatar";
import {
  ArrowDownCircle,
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  EyeOff,
  FileUp,
  MessageCirclePlus,
  MessagesSquare,
  Palette,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  UsersRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Member, TeamChat, TeamMessage, ChatAttachment } from "@/lib/types";
import { playMessageChime, requestDesktopNotification, showDesktopPush } from "@/lib/utils";
import { showToast } from "@/components/Toast";

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [dragOverThread, setDragOverThread] = useState(false);

  useEffect(() => {
    const savedWp = localStorage.getItem("askdocs_chat_wallpaper");
    if (savedWp) setWallpaper(savedWp);
    const savedSound = localStorage.getItem("askdocs_chat_sound");
    if (savedSound !== null) setSoundEnabled(savedSound !== "false");
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("askdocs_chat_sound", String(next));
  };

  const toggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      return;
    }
    const granted = await requestDesktopNotification();
    setNotifEnabled(granted);
  };

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
        if (!updated) return curr;
        if (
          curr.id === updated.id &&
          curr.last_message_at === updated.last_message_at &&
          curr.unread_count === updated.unread_count &&
          curr.participants.length === updated.participants.length
        ) {
          return curr;
        }
        return updated;
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
    const t = setInterval(() => { void loadChats(); void loadColleagues(); }, 6000);
    return () => clearInterval(t);
  }, [loadChats, loadColleagues]);

  useEffect(() => {
    if (!activeChat) return;
    const currentChatId = activeChat.id;
    let cancelled = false;

    const poll = async () => { 
      try { 
        const msgs = await api.listTeamMessages(currentChatId); 
        if (!cancelled) {
          setMessages((prev) => {
            // If message list is structurally identical, return exact reference to prevent re-render & scroll jitter
            if (prev.length === msgs.length) {
              const isDifferent = msgs.some((m, i) => m.id !== prev[i]?.id || (m.read_by?.length !== prev[i]?.read_by?.length));
              if (!isDifferent) return prev;
            }
            if (msgs.length > prevMsgCount.current && prevMsgCount.current > 0) {
              const newMsgs = msgs.slice(prevMsgCount.current);
              const incoming = newMsgs.filter((m) => m.sender_id !== user?.id);
              if (incoming.length > 0) {
                if (soundEnabled) {
                  playMessageChime();
                }
                if (typeof document !== "undefined" && document.hidden) {
                  const latest = incoming[incoming.length - 1];
                  const sender = activeChat.participants.find((p) => p.user_id === latest.sender_id);
                  const senderTitle = sender?.name || sender?.email || chatTitle(activeChat, user?.email);
                  showDesktopPush(
                    senderTitle,
                    latest.content || "Sent an attachment"
                  );
                }
              }
            }
            return msgs;
          });
        }
      } catch { /* ignore */ } 
    };

    void poll();
    const t = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(t); };
  }, [activeChat?.id, soundEnabled, user?.id, user?.email]);

  const prevMsgCount = useRef(0);

  const openChat = (chat: TeamChat) => {
    setActiveChat(chat);
    prevMsgCount.current = 0;
    setMessages([]);
    // Optimistically clear unread badge for this chat
    setChats((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unread_count: 0 } : c))
    );
    window.dispatchEvent(new CustomEvent("askdocs_chat_read", { detail: { chatId: chat.id } }));
  };

  const handleThreadDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverThread(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0 || !activeChat) return;

    for (const file of files) {
      try {
        const att = await api.uploadChatAttachment(file);
        await api.sendTeamMessage(activeChat.id, file.name, [att.id]);
      } catch (err) {
        showToast("error", (err as Error).message);
      }
    }
    try {
      const msgs = await api.listTeamMessages(activeChat.id);
      setMessages(msgs);
      void loadChats();
    } catch { /* ignore */ }
  };
  
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
      const el = scrollRef.current;
      const isInitial = prevMsgCount.current === 0;
      const isNearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 200 : true;
      const lastMsgIsMine = messages[count - 1]?.sender_id === user?.id;

      if (isInitial) {
        scrollToBottom(false);
      } else if (count > prevMsgCount.current && (isNearBottom || lastMsgIsMine)) {
        scrollToBottom(true);
      }
    }
    prevMsgCount.current = count;
  }, [messages, user?.id]);

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
        className={`gemini-gradient-bg sb-scroll no-scrollbar flex-col overflow-y-auto border bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f14] rounded-3xl shrink-0 p-2.5 sm:p-3.5
          ${activeChat ? "hidden md:flex md:w-80 min-h-0" : "flex w-full md:w-80 min-h-0"}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="relative z-10 flex flex-col h-full">
          
          {/* Top Sticky Bar */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-2 pb-3.5 pt-2 backdrop-blur dark:border-white/5 dark:bg-[#0b0f14]/95">
            <div className="mb-3 flex items-center justify-between gap-1">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Office Chats</h2>
              <div className="flex shrink-0 items-center gap-2">
                <button 
                  onClick={() => setShowNewChat(true)} 
                  title="New Direct Message" 
                  aria-label="New chat" 
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9333ea] hover:bg-[#7c3aed] text-white transition-all shadow-md shadow-purple-500/25 hover:scale-105 active:scale-95"
                >
                  <MessagesSquare className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setShowNewGroup(true)} 
                  title="New Group Chat" 
                  aria-label="New group" 
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-white transition-all shadow-md shadow-emerald-500/25 hover:scale-105 active:scale-95"
                >
                  <UsersRound className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search chats or teammates…" 
                className="w-full rounded-full border border-slate-200/80 bg-slate-50/90 py-2 pl-9 pr-4 text-xs outline-none placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#16161e] dark:text-white dark:placeholder:text-zinc-500 transition-all" 
              />
            </div>

            {/* Filter Pills matching Image 3 */}
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => {
                const isActive = filter === c.key;
                return (
                  <button 
                    key={c.key} 
                    onClick={() => setFilter(c.key)} 
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                      isActive 
                        ? "bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-md shadow-purple-500/25 ring-1 ring-purple-400/30" 
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#1a1a24] dark:text-zinc-300 dark:hover:bg-white/10"
                    }`}
                  >
                    <span>{c.label}</span>
                    {c.count !== undefined && c.count > 0 && (
                      <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-300"
                      }`}>
                        {c.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active online teammates bar */}
          {onlineColleagues.length > 0 && (
            <div className="border-b border-slate-100 px-2 py-2.5 dark:border-white/5">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Active Now</div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {onlineColleagues.map((m) => (
                  <Link key={m.user_id} href={`/profile/${m.user_id}`} className="flex shrink-0 flex-col items-center gap-1 hover:opacity-80 transition-opacity" title={`View profile of ${m.name || m.email}`}>
                    <ChatAvatar user={m} size={48} ring />
                    <span className="max-w-[52px] truncate text-[10px] font-medium text-slate-700 dark:text-zinc-300">{(m.name || m.email).split(" ")[0]}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Unified Chat Feed */}
          <div
            className="no-scrollbar flex-1 overflow-y-auto px-1 py-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {visibleChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 via-indigo-500/15 to-pink-500/15 border border-purple-200/60 dark:border-purple-500/30 shadow-inner">
                  <MessagesSquare className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                </div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">
                  {chats.length === 0 ? "No office chats yet" : `No ${filter === "group" ? "group" : filter === "direct" ? "personal" : ""} chats found`}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-400 max-w-[210px]">
                  {chats.length === 0 ? "Start your first conversation with a workspace teammate" : "Try a different search or filter"}
                </p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-purple-500/25 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/40 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Start a New Chat</span>
                </button>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {visibleChats.map((chat) => {
                  const other = otherParticipant(chat, user?.email);
                  const isActive = activeChat?.id === chat.id;
                  return (
                    <li key={chat.id} className="group relative flex items-center">
                      <button
                        onClick={() => openChat(chat)}
                        className={`wa-row flex flex-1 items-center gap-3 rounded-2xl p-2.5 text-left transition-all ${
                          isActive
                            ? "bg-purple-50/80 shadow-xs dark:bg-white/10 ring-1 ring-purple-500/20"
                            : "hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {chat.type === "group" ? (
                          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-bold">
                            <UsersRound className="h-5 w-5" />
                          </div>
                        ) : other ? (
                          <ChatAvatar user={other} size={44} />
                        ) : (
                          <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200 dark:bg-white/10" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              {chat.type === "direct" && other && (
                                <PresenceDot online={other.online} />
                              )}
                              <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                {chatTitle(chat, user?.email)}
                              </span>
                            </div>
                            <span className="ml-1 shrink-0 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                              {fmtDate(chat.last_message_at ?? chat.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
                              {chat.last_message_preview || (
                                <span className="italic text-slate-400 dark:text-zinc-500">
                                  No messages yet
                                </span>
                              )}
                            </p>
                            {chat.unread_count > 0 && (
                              <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[9px] font-bold text-white shadow-xs">
                                {chat.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void hideChat(chat.id);
                        }}
                        title="Hide conversation"
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
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
      <div className={`gemini-gradient-bg relative flex-col overflow-hidden border bg-white shadow-sm dark:border-white/10 dark:bg-[#181818] rounded-3xl ${activeChat ? "flex flex-1 min-w-0 min-h-0" : "hidden md:flex md:flex-1 md:min-w-0 md:min-h-0"}`}>
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="gemini-orb gemini-orb-3" />

        {!activeChat ? (
          <div className="relative z-10 flex h-full items-center justify-center px-4 py-8 text-center">
            <div className="max-w-md w-full">
              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500/15 via-indigo-500/15 to-pink-500/15 border border-purple-200/60 dark:border-white/10 shadow-lg shadow-purple-500/10">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-lg animate-pulse" />
                <MessagesSquare className="relative z-10 h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {chats.length === 0 ? "Welcome to Office Chats! 👋" : "Select a conversation"}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                {chats.length === 0
                  ? "Connect and chat with teammates across your workspace in real-time."
                  : "Pick a colleague or group chat from the left panel to continue messaging."}
              </p>

              {/* Animated Gradient CTA Button */}
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => setShowNewChat(true)}
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-[1px] shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50 active:scale-95 cursor-pointer"
                >
                  <span className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors">
                    <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>Start a New Chat</span>
                  </span>
                </button>
              </div>

              {/* Teammates suggestions quick-row if workspace has colleagues */}
              {colleagues.length > 0 && (
                <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-6 text-left">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      Suggested Teammates to Message
                    </span>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
                    >
                      View all ({colleagues.length}) →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto no-scrollbar">
                    {colleagues.slice(0, 4).map((m) => (
                      <button
                        key={m.user_id}
                        onClick={() => void openDM(m)}
                        className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/70 p-2.5 hover:border-purple-400 hover:bg-purple-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-purple-500/40 dark:hover:bg-purple-950/20 transition-all duration-200 cursor-pointer shadow-xs text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ChatAvatar user={m} size={36} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {m.name || m.email}
                            </p>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
                              <PresenceDot online={m.online} />
                              {m.online ? "Online" : "Offline"}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          Message
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="relative z-30 flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-white/5 sm:px-4 bg-white/70 dark:bg-black/40 backdrop-blur-md">
              <button onClick={() => { setActiveChat(null); setMessages([]); }} aria-label="Back" className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>

              {activeChat.type === "direct" && otherParticipant(activeChat, user?.email) ? (
                (() => {
                  const other = otherParticipant(activeChat, user?.email)!;
                  return (
                    <Link
                      href={`/profile/${other.user_id}`}
                      className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                      title={`View profile of ${other.name || other.email}`}
                    >
                      <ChatAvatar user={other} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900 hover:text-purple-600 dark:text-white dark:hover:text-purple-400 transition-colors">
                          <PresenceDot online={other.online ?? false} />
                          {chatTitle(activeChat, user?.email)}
                        </div>
                        <div className="truncate text-[11px] text-slate-400 dark:text-zinc-500">
                          {other.online ? "Online" : "Offline"} · Tap to view profile
                        </div>
                      </div>
                    </Link>
                  );
                })()
              ) : (
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-bold"><UsersRound className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {chatTitle(activeChat, user?.email)}
                    </div>
                    <div className="truncate text-[11px] text-slate-400 dark:text-zinc-500">
                      {activeChat.participants.length} members · {activeChat.participants.map((p) => p.name || p.email).join(", ")}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex shrink-0 items-center gap-1">
                {/* Sound Chime Toggle */}
                <button
                  onClick={toggleSound}
                  title={soundEnabled ? "Mute chat sounds" : "Enable chat sounds"}
                  aria-label={soundEnabled ? "Mute chat sounds" : "Enable chat sounds"}
                  className={`rounded-lg p-2 transition-colors ${
                    soundEnabled
                      ? "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                      : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                {/* Desktop Notifications Toggle */}
                <button
                  onClick={() => void toggleNotifications()}
                  title={notifEnabled ? "Desktop notifications enabled" : "Enable desktop notifications"}
                  aria-label="Toggle desktop notifications"
                  className={`rounded-lg p-2 transition-colors ${
                    notifEnabled
                      ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  {notifEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </button>

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

            {/* Messages with upward infinite scroll & drag-and-drop dropzone */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverThread(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverThread(false);
              }}
              onDrop={(e) => void handleThreadDrop(e)}
              style={WALLPAPERS.find((w) => w.id === wallpaper)?.style}
              className="scroll-touch wa-thread no-scrollbar relative z-10 flex-1 min-h-0 space-y-2 overflow-y-auto px-3 py-4 sm:px-6"
            >
              {/* Drag Over Overlay */}
              {dragOverThread && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-purple-950/80 p-6 text-center text-white backdrop-blur-md animate-in fade-in duration-150">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-dashed border-purple-300 bg-purple-600/40 shadow-xl shadow-purple-500/30">
                    <FileUp className="h-8 w-8 text-white animate-bounce" />
                  </div>
                  <div>
                    <p className="text-base font-bold">Drop files to share in chat</p>
                    <p className="text-xs text-purple-200">PDF, DOCX, TXT, or images will be sent instantly</p>
                  </div>
                </div>
              )}
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
                        <Link
                          href={`/profile/${m.sender_id}`}
                          className="mb-1 block text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                          title="View Profile"
                        >
                          {senderName(m.sender_id)}
                        </Link>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" onClick={() => { setShowNewChat(false); setNewChatQuery(""); setNewChatResults([]); }}>
          <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xl dark:border-white/10 dark:bg-[#15151c]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <MessageCirclePlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Start a New Chat</h2>
                <p className="text-[11px] text-slate-400 dark:text-zinc-400">Select a teammate to start a direct conversation</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={newChatQuery} onChange={(e) => setNewChatQuery(e.target.value)} placeholder="Search teammate name or email…" className="w-full rounded-full border border-slate-200/80 bg-slate-50/80 py-2.5 pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1e1e28] dark:text-white transition-all" />
            </div>

            {newChatQuery.trim().length < 2 ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Workspace Teammates ({colleagues.length})
                  </span>
                </div>
                {colleagues.length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-6 text-center">
                    <UsersRound className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-zinc-600" />
                    <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No colleagues in this workspace yet</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500">Invite teammates to your workspace from the Workspaces page</p>
                  </div>
                ) : (
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar">
                    {colleagues.map((m) => (
                      <li key={m.user_id}>
                        <button
                          onClick={() => { setShowNewChat(false); void openDM(m); }}
                          className="group flex w-full items-center justify-between rounded-2xl p-2 text-left hover:bg-purple-50/60 dark:hover:bg-purple-950/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ChatAvatar user={m} size={38} />
                            <div className="min-w-0">
                              <span className="block truncate text-xs font-bold text-slate-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400 transition-colors">
                                {m.name || m.email}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
                                <PresenceDot online={m.online} />
                                {m.online ? "Online" : "Offline"}
                              </span>
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-100 group-hover:bg-purple-600 group-hover:text-white dark:bg-white/10 px-3 py-1 text-[10px] font-bold text-slate-700 dark:text-zinc-300 transition-all shrink-0">
                            Chat
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Global search results</h3>
                {newChatResults.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">No matching users found.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar">
                    {newChatResults.map((m) => (
                      <li key={m.user_id}>
                        <button
                          onClick={() => { setShowNewChat(false); void openDM(m); }}
                          className="group flex w-full items-center justify-between rounded-2xl p-2 text-left hover:bg-purple-50/60 dark:hover:bg-purple-950/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ChatAvatar user={m} size={38} />
                            <div className="min-w-0">
                              <span className="block truncate text-xs font-bold text-slate-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400 transition-colors">
                                {m.name || m.email}
                              </span>
                              <span className="block truncate text-[10px] text-slate-400 dark:text-zinc-500">{m.email}</span>
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-100 group-hover:bg-purple-600 group-hover:text-white dark:bg-white/10 px-3 py-1 text-[10px] font-bold text-slate-700 dark:text-zinc-300 transition-all shrink-0">
                            Chat
                          </span>
                        </button>
                      </li>
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
