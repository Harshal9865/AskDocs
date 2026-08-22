import type {
  Citation,
  ConflictWarning,
  Conversation,
  DocumentItem,
  Invitation,
  Member,
  Message,
  Role,
  TeamChat,
  TeamMessage,
  TokenPair,
  User,
  Workspace,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type Tokens = { access: string; refresh: string } | null;

let tokens: Tokens = null;
let onTokensChanged: ((t: Tokens) => void) | null = null;

export function setTokens(t: Tokens, notify = true) {
  tokens = t;
  if (notify && onTokensChanged) onTokensChanged(t);
}

export function getAccessToken() {
  return tokens?.access ?? null;
}

export function setTokenListener(fn: (t: Tokens) => void) {
  onTokensChanged = fn;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function refreshTokens(): Promise<boolean> {
  if (!tokens?.refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh }),
    });
    if (!res.ok) return false;
    const pair: TokenPair = await res.json();
    setTokens({ access: pair.access_token, refresh: pair.refresh_token });
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { retry?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (tokens?.access) headers.set("Authorization", `Bearer ${tokens.access}`);
  if (init.body && !(init.body instanceof FormData)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && !init.retry) {
    const ok = await refreshTokens();
    if (ok) {
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: (() => {
          const h = new Headers(init.headers);
          if (tokens?.access) h.set("Authorization", `Bearer ${tokens.access}`);
          return h;
        })(),
      });
    }
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail =
      typeof data === "object" && data !== null
        ? JSON.stringify((data as Record<string, unknown>).detail ?? data)
        : String(data ?? res.statusText);
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

function json(body: unknown): RequestInit {
  return { body: JSON.stringify(body) };
}

export const api = {
  setOnTokens: setTokenListener,

  // ---- auth ----
  async register(email: string, password: string, name: string) {
    return request<User>("/auth/register", {
      method: "POST",
      ...json({ email, password, name }),
    });
  },
  async login(email: string, password: string): Promise<TokenPair> {
    const form = new URLSearchParams({ username: email, password });
    return request<TokenPair>("/auth/login", {
      method: "POST",
      body: form.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  me: () => request<User>("/auth/me"),

  // ---- workspaces ----
  createWorkspace: (name: string) =>
    request<Workspace>("/workspaces", { method: "POST", ...json({ name }) }),
  listWorkspaces: () => request<Workspace[]>("/workspaces"),
  deleteWorkspace: (wsId: string) =>
    request<void>(`/workspaces/${wsId}`, { method: "DELETE" }),
  listMembers: (wsId: string) =>
    request<Member[]>(`/workspaces/${wsId}/members`),
  addMember: (wsId: string, email: string, role: Role) =>
    request<Member>(`/workspaces/${wsId}/members`, {
      method: "POST",
      ...json({ email, role }),
    }),
  updateMemberRole: (wsId: string, userId: string, role: Role) =>
    request<Member>(`/workspaces/${wsId}/members/${userId}`, {
      method: "PATCH",
      ...json({ role }),
    }),
  removeMember: (wsId: string, userId: string) =>
    request<void>(`/workspaces/${wsId}/members/${userId}`, { method: "DELETE" }),

  // ---- invitations ----
  myInvitations: () => request<Invitation[]>("/invitations"),
  invitationPreview: (id: string) =>
    request<{ workspace_name: string; inviter_email: string; role: string }>(
      `/invitations/${id}/workspace`,
    ),
  acceptInvitation: (id: string) =>
    request<Invitation>(`/invitations/${id}/accept`, { method: "POST" }),
  declineInvitation: (id: string) =>
    request<Invitation>(`/invitations/${id}/decline`, { method: "POST" }),
  cancelInvitation: (wsId: string, id: string) =>
    request<void>(`/workspaces/${wsId}/invitations/${id}`, { method: "DELETE" }),
  listWorkspaceInvitations: (wsId: string) =>
    request<Invitation[]>(`/workspaces/${wsId}/invitations`),

  // ---- presence ----
  presencePing: () => request<void>("/presence/ping", { method: "POST" }),

  // ---- team chats (DMs + groups) ----
  listTeamChats: (wsId: string) =>
    request<TeamChat[]>(`/workspaces/${wsId}/team-chats`),
  createDirectChat: (wsId: string, userId: string) =>
    request<TeamChat>(`/workspaces/${wsId}/team-chats/direct`, {
      method: "POST",
      ...json({ user_id: userId }),
    }),
  createGroupChat: (wsId: string, title: string, memberIds: string[]) =>
    request<TeamChat>(`/workspaces/${wsId}/team-chats/group`, {
      method: "POST",
      ...json({ title, member_ids: memberIds }),
    }),
  listTeamMessages: (chatId: string) =>
    request<TeamMessage[]>(`/team-chats/${chatId}/messages`),
  /** One-tap "Ask the team": opens (or reuses) the DM and sends the question. */
  askColleague: async (wsId: string, userId: string, question: string) => {
    const chat = await request<TeamChat>(`/workspaces/${wsId}/team-chats/direct`, {
      method: "POST",
      ...json({ user_id: userId }),
    });
    const msg = await request<TeamMessage>(`/team-chats/${chat.id}/messages`, {
      method: "POST",
      ...json({ content: question }),
    });
    return { chat, msg };
  },
  sendTeamMessage: (chatId: string, content: string) =>
    request<TeamMessage>(`/team-chats/${chatId}/messages`, {
      method: "POST",
      ...json({ content }),
    }),

  // ---- profile / settings ----
  updateMe: (name: string) =>
    request<User>("/auth/me", { method: "PATCH", ...json({ name }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/auth/change-password", {
      method: "POST",
      ...json({ current_password: currentPassword, new_password: newPassword }),
    }),
  renameWorkspace: (wsId: string, name: string) =>
    request<Workspace>(`/workspaces/${wsId}`, { method: "PATCH", ...json({ name }) }),

  // ---- document detail ----
  getDocumentChunks: (wsId: string, docId: string) =>
    request<{ id: string; ordinal: number; token_count: number; content: string }[]>(
      `/workspaces/${wsId}/documents/${docId}/chunks`,
    ),

  // ---- activity ----
  getActivity: (wsId: string) =>
    request<
      { id: string; actor: string; action: string; target: string; created_at: string }[]
    >(`/workspaces/${wsId}/activity`),

  // ---- trash ----
  trashDocuments: (wsId: string) =>
    request<{ id: string; title: string; file_type: string; deleted_at: string }[]>(
      `/workspaces/${wsId}/trash/documents`,
    ),
  trashConversations: (wsId: string) =>
    request<{ id: string; title: string; deleted_at: string }[]>(
      `/workspaces/${wsId}/trash/conversations`,
    ),
  restoreDocument: (wsId: string, docId: string) =>
    request<void>(`/workspaces/${wsId}/trash/documents/${docId}/restore`, { method: "POST" }),
  purgeDocument: (wsId: string, docId: string) =>
    request<void>(`/workspaces/${wsId}/trash/documents/${docId}`, { method: "DELETE" }),

  // ---- answer permalinks ----
  getAnswer: (id: string) =>
    request<{
      id: string;
      question: string;
      answer: string;
      citations: Citation[];
      conversation_title: string;
      workspace_id: string;
      created_at: string;
    }>(`/answers/${id}`),

  // ---- search & insights ----
  search: (wsId: string, q: string) =>
    request<{
      documents: { id: string; title: string; file_type: string }[];
      messages: { id: string; conversation_id: string; conversation_title: string; role: string; snippet: string }[];
      excerpts: { id: string; document_title: string; snippet: string }[];
    }>(`/workspaces/${wsId}/search?q=${encodeURIComponent(q)}`),
  insights: (wsId: string) =>
    request<{
      total_documents: number;
      ready_documents: number;
      total_questions: number;
      unanswered_count: number;
      unanswered_questions: { question: string; asked_at: string }[];
      top_cited_documents: { title: string; citations: number }[];
    }>(`/workspaces/${wsId}/insights`),

  // ---- documents ----
  async uploadDocument(wsId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<DocumentItem>(`/workspaces/${wsId}/documents`, {
      method: "POST",
      body: form,
    });
  },
  listDocuments: (wsId: string) =>
    request<DocumentItem[]>(`/workspaces/${wsId}/documents`),
  deleteDocument: (wsId: string, docId: string) =>
    request<void>(`/workspaces/${wsId}/documents/${docId}`, { method: "DELETE" }),

  // ---- chat ----
  createConversation: (wsId: string) =>
    request<Conversation>(`/workspaces/${wsId}/conversations`, {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    }),
  listConversations: (wsId: string) =>
    request<Conversation[]>(`/workspaces/${wsId}/conversations`),
  listMessages: (convId: string) =>
    request<Message[]>(`/conversations/${convId}/messages`),
  deleteConversation: (convId: string) =>
    request<void>(`/conversations/${convId}`, { method: "DELETE" }),

  /** Non-streaming ask. */
  ask: (convId: string, content: string) =>
    request<Message>(`/conversations/${convId}/ask`, {
      method: "POST",
      ...json({ content }),
    }),

  /** SSE streaming ask. Calls onToken per chunk; resolves with citations. */
  async askStream(
    convId: string,
    content: string,
    onToken: (text: string) => void,
    onDone: (
      citations: Citation[] | null,
      suggestedColleagues: { user_id: string; name: string }[],
      conflict: ConflictWarning | null,
    ) => void,
    onSaved?: (messageId: string) => void,
    onError?: (message: string) => void,
    signal?: AbortSignal,
  ) {
    try {
      const res = await fetch(
        `${API_BASE}/conversations/${convId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
          body: JSON.stringify({ content }),
          signal,
        },
      );
        if (!res.ok || !res.body) {
          onError?.(`Request failed (${res.status})`);
          return;
        }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(trimmed.slice(6));
            if (event.type === "answer") onToken(event.text);
            else if (event.type === "saved" && onSaved) onSaved(event.message_id);
            else if (event.type === "done")
              onDone(
                event.citations ?? [],
                event.suggested_colleagues ?? [],
                event.conflict ?? null,
              );
            else if (event.type === "error") onError?.(event.message);
          } catch {
            /* skip malformed line */
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") onError?.(String(err));
    }
  },
};


