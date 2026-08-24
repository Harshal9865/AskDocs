"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import ChatComposer from "@/components/ChatComposer";
import { useUserAvatar } from "@/lib/use-user-avatar";
import Avatar from "@/components/Avatar";
import { UsersRound, EyeOff, Check, CheckCheck, Trash2 } from "lucide-react";
import type { Member, TeamChat, TeamMessage, ChatAttachment } from "@/lib/types";

function chatTitle(chat: TeamChat, myEmail?: string): string {
  if (chat.type === "group") return chat.title;
  const other = chat.participants.find((p) => p.email !== myEmail);
  return other?.name || other?.email || "Direct message";
}

function otherParticipant(chat: TeamChat, myEmail?: string) {
  return chat.participants.find((p) => p.email !== myEmail);
}

function MemberAvatarSmall({
  user,
  size,
}: {
  user: { user_id?: string; id?: string; name?: string | null; email?: string | null; avatar_kind?: string | null; avatar_value?: string | null; online?: boolean };
  size: number;
}) {
  const { src, stickerId } = useUserAvatar(
    user.user_id || user.id,
    user.avatar_kind,
    user.avatar_value,
  );
  return (
    <Avatar
      name={user.name ?? user.email ?? "User"}
      size={size}
      showPresence
      online={user.online}
      src={src}
      stickerId={stickerId}
    />
  );
}

function PresenceDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
        online ? "bg-emerald-500" : "bg-slate-300"
      }`}
      title={online ? "Online" : "Offline"}
    />
  );
}

function ReadTicks({ readBy, myId, participantCount }: { readBy: string[]; myId: string; participantCount: number }) {
  const othersRead = readBy.filter((id) => id !== myId).length;
  if (othersRead === 0) return <Check className="h-3 w-3 text-slate-400" />;
  if (othersRead >= participantCount - 1) return <CheckCheck className="h-3 w-3 text-sky-500" />;
  return <CheckCheck className="h-3 w-3 text-slate-400" />;
}

function AttachmentThumbnail({ att }: { att: ChatAttachment }) {
  const isImage = att.content_type.startsWith("image/");
  return (
    <a
      href={`${API_BASE}${att.url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-block"
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${API_BASE}${att.url}`}
          alt={att.filename}
          className="max-h-40 max-w-[240px] rounded-lg object-cover"
        />
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
          {att.filename}
        </span>
      )}
    </a>
  );
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
  const [listOpen, setListOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const threadEnd = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    if (!workspace) return;
    try {
      setChats(await api.listTeamChats(workspace.id));
    } catch {
      /* ignore */
    }
  }, [workspace]);

  const loadColleagues = useCallback(async () => {
    if (!workspace) return;
    try {
      setColleagues(
        (await api.listMembers(workspace.id)).filter((m) => m.email !== user?.email),
      );
    } catch {
      /* ignore */
    }
  }, [workspace, user]);

  useEffect(() => {
    setActiveChat(null);
    setMessages([]);
    void loadChats();
    void loadColleagues();
    const t = setInterval(() => void loadColleagues(), 30000);
    return () => clearInterval(t);
  }, [loadChats, loadColleagues]);

  useEffect(() => {
    if (!activeChat) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const msgs = await api.listTeamMessages(activeChat.id);
        if (!cancelled) setMessages(msgs);
      } catch {
        /* ignore */
      }
    };
    void poll();
    const t = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [activeChat]);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openDM(member: Member) {
    if (!workspace) return;
    try {
      setListOpen(false);
      const chat = await api.createDirectChat(workspace.id, member.user_id);
      setActiveChat(chat);
      setMessages([]);
      await loadChats();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function createGroup() {
    if (!workspace || !groupTitle.trim() || selectedIds.length < 2) return;
    try {
      setListOpen(false);
      const chat = await api.createGroupChat(workspace.id, groupTitle.trim(), selectedIds);
      setShowNewGroup(false);
      setGroupTitle("");
      setSelectedIds([]);
      setActiveChat(chat);
      setMessages([]);
      await loadChats();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function hideChat(chatId: string) {
    if (!confirm("Hide for you? Others still see it.")) return;
    try {
      await api.hideConversation(chatId);
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
      await loadChats();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function deleteChat(chatId: string) {
    if (!confirm("Delete this chat for you? Others will still see it. For groups, you'll leave the group.")) return;
    try {
      await api.deleteTeamChat(chatId);
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
      await loadChats();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!activeChat) return;
    if (!confirm("Delete this message for everyone?")) return;
    try {
      await api.deleteTeamMessage(activeChat.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await loadChats();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleSend(text: string, attachments: { file: File; previewUrl?: string }[]) {
    if (!activeChat || sending) return;
    setSending(true);
    try {
      const attachmentIds: string[] = [];
      for (const a of attachments) {
        const result = await api.uploadChatAttachment(a.file);
        attachmentIds.push(result.id);
      }
      await api.sendTeamMessage(activeChat.id, text, attachmentIds);
      const msgs = await api.listTeamMessages(activeChat.id);
      setMessages(msgs);
      await loadChats();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (!workspace) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Create or select a workspace first.
      </div>
    );
  }

  const senderName = (senderId: string | null) =>
    colleagues.find((c) => c.user_id === senderId)?.name ??
    activeChat?.participants.find((p) => p.user_id === senderId)?.name ??
    "You";

  return (
    <div className="relative mx-auto flex h-[var(--chat-h)] max-w-5xl flex-col gap-4 md:flex-row">
      {listOpen && (
        <div
          className="fixed inset-0 z-10 bg-slate-900/50 md:hidden"
          onClick={() => setListOpen(false)}
          aria-hidden
        />
      )}
      {/* left panel */}
      <div className={`sb-scroll dark:border-white/10 dark:bg-[#181818] absolute inset-y-0 left-0 z-20 flex w-72 max-w-[85vw] transform flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 md:relative md:z-auto md:w-72 md:translate-x-0 ${listOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Office mates</h2>
          <button
            onClick={() => setShowNewGroup(true)}
            aria-label="Create group chat"
            title="New group chat"
            className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            + Group
          </button>
        </div>

        {colleagues.length === 0 && (
          <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            No colleagues yet — invite your team from the Members page.
          </p>
        )}

        <ul className="mb-4 space-y-0.5">
          {colleagues.map((m) => (
            <li key={m.user_id}>
              <button
                onClick={() => void openDM(m)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                title={`Message ${m.name || m.email}`}
              >
                <MemberAvatarSmall user={m} size={28} />
                <span className="truncate">{m.name || m.email}</span>
              </button>
            </li>
          ))}
        </ul>

        <h2 className="mb-2 text-sm font-semibold text-slate-700">Your chats</h2>
        {chats.length === 0 ? (
          <p className="text-xs text-slate-400">
            Click a colleague to start a conversation about anything.
          </p>
        ) : (
          <ul className="space-y-1">
            {chats.map((chat) => {
              const online =
                chat.type === "direct"
                  ? (otherParticipant(chat, user?.email)?.online ?? false)
                  : false;
              return (
                <li key={chat.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => {
                      setActiveChat(chat);
                      setMessages([]);
                    }}
                    className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left ${
                      activeChat?.id === chat.id
                        ? "bg-indigo-100 dark:bg-white/10"
                        : "hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {chat.type === "direct" && <PresenceDot online={online} />}
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${
                          activeChat?.id === chat.id
                            ? "font-semibold text-indigo-900 dark:text-white"
                            : "text-slate-600 dark:text-zinc-400"
                        }`}
                      >
                        {chatTitle(chat, user?.email)}
                      </span>
                      {chat.unread_count > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                    {chat.last_message_preview && (
                      <span className="mt-0.5 block truncate text-xs text-slate-400 dark:text-zinc-500">
                        {chat.last_message_preview}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteChat(chat.id);
                    }}
                    aria-label={`Delete chat ${chatTitle(chat, user?.email)}`}
                    title="Delete for you"
                    className="shrink-0 rounded-md p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* thread */}
      <div className="gemini-gradient-bg dark:border-white/10 dark:bg-[#181818] relative flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="gemini-orb gemini-orb-1" />
        <div className="gemini-orb gemini-orb-2" />
        <div className="gemini-orb gemini-orb-3" />
        {/* mobile thread header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 md:hidden">
          <button
            onClick={() => setListOpen(true)}
            aria-label="Show chats"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span aria-hidden>💬</span>
            <span className="truncate">
              {activeChat ? chatTitle(activeChat, user?.email) : "Chats"}
            </span>
            <span aria-hidden className="ml-auto shrink-0 text-slate-400">▾</span>
          </button>
          <button
            onClick={() => setShowNewGroup(true)}
            aria-label="New group chat"
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
          >
            + Group
          </button>
        </div>
        {!activeChat ? (
          <div className="relative z-10 flex h-full items-center justify-center px-4 text-center text-sm text-slate-400 dark:text-zinc-500">
            Pick a colleague to start a direct message,
            <br /> or create a group chat to plan together.
          </div>
        ) : (
          <>
            <div className="hidden border-b border-slate-100 px-4 py-3 sm:px-6 md:block">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {activeChat.type === "direct" && (
                    <PresenceDot
                      online={
                        otherParticipant(activeChat, user?.email)?.online ?? false
                      }
                    />
                  )}
                  {chatTitle(activeChat, user?.email)}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void hideChat(activeChat.id)}
                    title="Hide chat"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void deleteChat(activeChat.id)}
                    title="Delete for you"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {activeChat.type === "group" && (
                <div className="text-xs text-slate-500">
                  {activeChat.participants.map((p) => p.name || p.email).join(", ")}
                </div>
              )}
            </div>

            <div className="scroll-touch relative z-10 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-6">
              {messages.length === 0 ? (
                <p className="pt-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                  No messages yet — say hello!
                </p>
              ) : (
                messages.map((msg) => {
                  const mine = msg.sender_id === user?.id;
                  const sender = activeChat.participants.find(
                    (p) => p.user_id === msg.sender_id,
                  );
                  return (
                    <div
                      key={msg.id}
                      className={`group/msg flex items-end gap-1 ${mine ? "justify-end" : ""}`}
                    >
                      {mine && (
                        <button
                          onClick={() => void deleteMessage(msg.id)}
                          title="Delete message"
                          className="hidden rounded-full p-1 text-slate-300 hover:bg-red-50 hover:text-red-600 group-hover/msg:block dark:text-zinc-600 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!mine && sender && (
                        <span title={sender.name}>
                          <MemberAvatarSmall user={sender} size={28} />
                        </span>
                      )}
                      <div className={`min-w-0 max-w-[80%] ${mine ? "text-right" : ""}`}>
                        {!mine && (
                          <div className="mb-0.5 text-xs font-medium text-slate-400">
                            {senderName(msg.sender_id)}
                          </div>
                        )}
                        <div
                          className={`inline-block max-w-full whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm sm:px-4 ${
                            mine
                              ? "rounded-br-md bg-indigo-600 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                          }`}
                        >
                          {msg.content}
                          {msg.attachments?.length > 0 && (
                            <div className="mt-1">
                              {msg.attachments.map((att) => (
                                <AttachmentThumbnail key={att.id} att={att} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`mt-0.5 flex items-center gap-1 ${mine ? "justify-end" : ""}`}>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {mine && (
                            <ReadTicks
                              readBy={msg.read_by ?? []}
                              myId={user?.id ?? ""}
                              participantCount={activeChat.participants.length}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEnd} />
            </div>

            <div className="border-t border-slate-100/60 px-3 pb-4 pt-3 dark:border-white/5 sm:px-4 sm:pb-5 sm:pt-3">
              <ChatComposer
                inputId="team-chat-input"
                value={input}
                onChange={setInput}
                onSend={(text, attachments) => {
                  setInput("");
                  void handleSend(text, attachments);
                }}
                disabled={!activeChat}
                busy={sending}
                placeholder="Write a message…"
                showAttach={Boolean(activeChat)}
              />
            </div>
          </>
        )}
      </div>

      {/* new group modal */}
      {showNewGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setShowNewGroup(false)}
        >
          <div
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold">New group chat</h2>
            <label className="mb-1 block text-sm font-medium" htmlFor="group-title">
              Group name
            </label>
            <input
              id="group-title"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g. Launch planning"
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <label className="mb-1 block text-sm font-medium">Select members (min 2)</label>
            {colleagues.length === 0 ? (
              <p className="mb-4 text-sm text-slate-500">No colleagues to add yet.</p>
            ) : (
              <ul className="mb-4 max-h-48 space-y-1 overflow-y-auto">
                {colleagues.map((m) => (
                  <li key={m.user_id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(m.user_id)}
                        onChange={(e) =>
                          setSelectedIds((prev) =>
                            e.target.checked
                              ? [...prev, m.user_id]
                              : prev.filter((id) => id !== m.user_id),
                          )
                        }
                        className="accent-indigo-600"
                      />
                      {m.name || m.email}
                      <PresenceDot online={m.online} />
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewGroup(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void createGroup()}
                disabled={!groupTitle.trim() || selectedIds.length < 2}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                Create group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
