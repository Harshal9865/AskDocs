import type {
  Citation,
  CheckoutPayload,
  ConflictWarning,
  ContractObligation,
  ConversationPage,
  DocumentHealthIssue,
  FreshnessWarning,
  Conversation,
  DocumentItem,
  Invitation,
  InvoiceRecord,
  JoinRequest,
  Member,
  Message,
  PlanInfo,
  Role,
  SubscriptionInfo,
  TeamChat,
  TeamMessage,
  TokenPair,
  User,
  Workspace,
  WorkspaceCanvas,
  CanvasChecklistItem,
  WorkspaceMemory,
  MemoryGraphOut,
  MemoryQueryResponse,
  WorkspaceDigest,
  WorkspaceHealthReport,
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

async function googleLogin(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, id_token: token, access_token: token }),
  });
  if (!res.ok) {
    const err = await res.text();
    let msg = "Google sign-in failed";
    try {
      const parsed = JSON.parse(err);
      msg = parsed.detail || msg;
    } catch {
      msg = err || msg;
    }
    throw new Error(msg);
  }
  const pair: TokenPair = await res.json();
  setTokens({ access: pair.access_token, refresh: pair.refresh_token });
}

async function request<T>(
  path: string,
  init: RequestInit & { retry?: boolean } = {},
): Promise<T> {
  // If we only have a refresh token (page just loaded), silently refresh first
  // so uploads/posts never fire with an empty access token.
  if (!init.retry && tokens && !tokens.access && tokens.refresh) {
    await refreshTokens();
  }

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

/** Binary-safe authenticated fetch (images etc.) with silent token refresh. */
async function requestBlob(path: string): Promise<Blob> {
  const buildHeaders = () => {
    const h = new Headers();
    if (tokens?.access) h.set("Authorization", `Bearer ${tokens.access}`);
    return h;
  };

  let res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders() });
  if (res.status === 401) {
    const ok = await refreshTokens();
    if (ok) res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders() });
  }
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
  return await res.blob();
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
  googleLogin,
  me: () => request<User>("/auth/me"),

  // ---- plan ----
  getPlan: () => request<PlanInfo>("/auth/plan"),
  upgradePlan: (plan: string) =>
    request<PlanInfo>("/auth/plan/upgrade", { method: "POST", ...json({ plan }) }),

  // ---- avatar & brand ----
  setAvatar: (kind: "initials" | "sticker", value?: string) =>
    request<User>("/auth/avatar/set", { method: "POST", ...json({ kind, value }) }),
  uploadAvatarPhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<User>("/auth/avatar/photo", { method: "POST", body: form });
  },
  /** Authenticated fetch of the uploaded photo -> object URL (binary-safe) */
  getAvatarPhotoUrl: async () => {
    const blob = await requestBlob("/auth/avatar/image");
    return URL.createObjectURL(blob);
  },
  setBrand: (wsId: string, kind: "default" | "sticker", value?: string) =>
    request<{ brand_kind: string; brand_value: string | null }>(
      `/workspaces/${wsId}/brand`,
      { method: "POST", ...json({ kind, value }) },
    ),
  uploadBrandPhoto: (wsId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ brand_kind: string; brand_value: string | null }>(
      `/workspaces/${wsId}/brand/photo`,
      { method: "POST", body: form },
    );
  },
  getBrandLogoUrl: async (wsId: string) => {
    const blob = await requestBlob(`/workspaces/${wsId}/brand/logo`);
    return URL.createObjectURL(blob);
  },
  /** Fetch another user's uploaded avatar photo as object URL (binary-safe) */
  getUserAvatarUrl: (userId: string) => requestBlob(`/auth/users/${userId}/avatar`),

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
  myInvitationHistory: () => request<Invitation[]>(`/invitations/history`),
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
  listTeamChats: (wsId?: string) =>
    wsId
      ? request<TeamChat[]>(`/workspaces/${wsId}/team-chats`)
      : request<TeamChat[]>("/team-chats"),
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
  sendTeamMessage: (chatId: string, content: string, attachmentIds?: string[]) =>
    request<TeamMessage>(`/team-chats/${chatId}/messages`, {
      method: "POST",
      ...json({ content, attachment_ids: attachmentIds ?? [] }),
    }),

  // ---- chat attachments ----
  uploadChatAttachment: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{
      id: string;
      filename: string;
      content_type: string;
      size_bytes: number;
      text_excerpt?: string | null;
    }>("/team-chats/upload", { method: "POST", body: form });
  },

  uploadChatAttachments: async (convId: string, files: File[]) => {
    const results: {
      id: string;
      filename: string;
      content_type: string;
      text_excerpt?: string | null;
    }[] = [];
    for (const file of files) {
      try {
        const uploaded = await api.uploadChatAttachment(file);
        results.push({
          id: uploaded.id,
          filename: uploaded.filename,
          content_type: uploaded.content_type,
          text_excerpt: uploaded.text_excerpt ?? null,
        });
      } catch {
        results.push({
          id: "",
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          text_excerpt: null,
        });
      }
    }
    return results;
  },

  // ---- hide / unhide / delete ----
  hideConversation: (chatId: string) =>
    request<{ status: string }>(`/team-chats/${chatId}/hide`, { method: "DELETE" }),
  unhideConversation: (chatId: string) =>
    request<{ status: string }>(`/team-chats/${chatId}/unhide`, { method: "POST" }),
  deleteTeamChat: (chatId: string) =>
    request<{ status: string }>(`/team-chats/${chatId}`, { method: "DELETE" }),
  clearTeamChat: (chatId: string) =>
    request<{ status: string }>(`/team-chats/${chatId}/clear`, { method: "POST" }),
  deleteTeamMessage: (chatId: string, messageId: string) =>
    request<{ status: string }>(`/team-chats/${chatId}/messages/${messageId}`, { method: "DELETE" }),

  // ---- friends ----
  sendFriendRequest: (userId: string) =>
    request<{ id: string; status: string }>("/friends/request", {
      method: "POST",
      ...json({ user_id: userId }),
    }),
  listFriendRequests: () => request<Member[]>("/friends/requests"),
  listFriends: () => request<Member[]>("/friends"),
  acceptFriend: (friendId: string) =>
    request<{ status: string }>(`/friends/${friendId}/accept`, { method: "POST" }),
  declineFriend: (friendId: string) =>
    request<{ status: string }>(`/friends/${friendId}/decline`, { method: "POST" }),
  blockFriend: (friendId: string) =>
    request<{ status: string }>(`/friends/${friendId}/block`, { method: "POST" }),
  unblockFriend: (friendId: string) =>
    request<{ status: string }>(`/friends/${friendId}/unblock`, { method: "POST" }),
  listBlocked: () => request<Member[]>("/friends/blocked"),
  unfriend: (friendId: string) =>
    request<{ status: string }>(`/friends/${friendId}`, { method: "DELETE" }),
  friendSuggestions: (wsId: string) =>
    request<Member[]>(`/friends/suggestions?workspace_id=${wsId}`),
  /** Global user search across any workspace (for friends / cross-workspace DMs). */
  searchUsers: (q: string) =>
    request<Member[]>(`/friends/search?q=${encodeURIComponent(q)}`),

  // ---- profile / settings ----
  getUserProfile: (userId: string) => request<User>(`/auth/users/${userId}`),
  updateMe: (
    payload:
      | string
      | {
          name?: string;
          bio?: string | null;
          phone?: string | null;
          status?: string | null;
          location?: string | null;
          pronouns?: string | null;
          job_title?: string | null;
          job_role?: string | null;
        },
  ) => {
    const body = typeof payload === "string" ? { name: payload } : payload;
    return request<User>("/auth/me", { method: "PATCH", ...json(body) });
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/auth/change-password", {
      method: "POST",
      ...json({ current_password: currentPassword, new_password: newPassword }),
    }),
  requestPasswordReset: (email: string) =>
    request<void>("/auth/forgot-password", {
      method: "POST",
      ...json({ email }),
    }),
  verifyResetCode: (email: string, code: string) =>
    request<void>("/auth/verify-reset-code", {
      method: "POST",
      ...json({ email, code }),
    }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    request<void>("/auth/reset-password", {
      method: "POST",
      ...json({ email, code, new_password: newPassword }),
    }),
  deleteMe: () =>
    request<void>("/auth/me", { method: "DELETE" }),
  renameWorkspace: (wsId: string, name: string) =>
    request<Workspace>(`/workspaces/${wsId}`, { method: "PATCH", ...json({ name }) }),
  setWorkspaceVisibility: (wsId: string, isPublic: boolean) =>
    request<Workspace>(`/workspaces/${wsId}/visibility`, {
      method: "PATCH",
      ...json({ is_public: isPublic }),
    }),

  // ---- discover & join requests ----
  discoverWorkspaces: (q?: string, limit = 20, offset = 0) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("limit", String(limit));
    p.set("offset", String(offset));
    return request<Workspace[]>(`/workspaces/public?${p.toString()}`);
  },
  createJoinRequest: (wsId: string, message?: string) =>
    request<JoinRequest>(`/workspaces/${wsId}/join-requests`, {
      method: "POST",
      ...json({ message }),
    }),
  listJoinRequests: (wsId: string) =>
    request<JoinRequest[]>(`/workspaces/${wsId}/join-requests`),
  myJoinRequests: () => request<JoinRequest[]>("/workspaces/join-requests/me"),
  approveJoinRequest: (wsId: string, reqId: string) =>
    request<JoinRequest>(`/workspaces/${wsId}/join-requests/${reqId}/approve`, {
      method: "POST",
    }),
  rejectJoinRequest: (wsId: string, reqId: string) =>
    request<JoinRequest>(`/workspaces/${wsId}/join-requests/${reqId}/reject`, {
      method: "POST",
    }),
  withdrawJoinRequest: (reqId: string) =>
    request<void>(`/workspaces/join-requests/${reqId}`, { method: "DELETE" }),

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
  getDocument: (wsId: string, docId: string) =>
    request<DocumentItem>(`/workspaces/${wsId}/documents/${docId}`),
  listMyDocuments: () =>
    request<DocumentItem[]>("/documents/mine"),
  deleteDocument: (wsId: string, docId: string) =>
    request<void>(`/workspaces/${wsId}/documents/${docId}`, { method: "DELETE" }),
  retryDocument: (wsId: string, docId: string) =>
    request<DocumentItem>(`/workspaces/${wsId}/documents/${docId}/retry`, { method: "POST" }),
  documentCount: (wsId: string) =>
    request<{ count: number }>(`/workspaces/${wsId}/documents/count`),
  bulkDeleteDocuments: async (wsId: string, docIds: string[]) => {
    for (const id of docIds) {
      await request<void>(`/workspaces/${wsId}/documents/${id}`, { method: "DELETE" });
    }
  },

  // ---- chat ----
  createConversation: (wsId: string) =>
    request<Conversation>(`/workspaces/${wsId}/conversations`, {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    }),
  listConversations: (wsId: string, cursor?: string) => {
    const params = new URLSearchParams({ limit: "20" });
    if (cursor) params.set("cursor", cursor);
    return request<ConversationPage | Conversation[]>(`/workspaces/${wsId}/conversations?${params.toString()}`);
  },
  listMessages: (convId: string) =>
    request<Message[]>(`/conversations/${convId}/messages`),
  deleteConversation: (convId: string) =>
    request<void>(`/conversations/${convId}`, { method: "DELETE" }),
  renameConversation: (convId: string, title: string) =>
    request<Conversation>(`/conversations/${convId}`, { method: "PATCH", ...json({ title }) }),
  pinConversation: (convId: string) =>
    request<Conversation>(`/conversations/${convId}/pin`, { method: "POST" }),
  unpinConversation: (convId: string) =>
    request<Conversation>(`/conversations/${convId}/pin`, { method: "DELETE" }),

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
      freshness: FreshnessWarning | null,
    ) => void,
    onSaved?: (messageId: string) => void,
    onError?: (message: string) => void,
    signal?: AbortSignal,
    attachmentIds?: string[],
    onTitleUpdated?: (title: string) => void,
  ) {
    try {
      if (tokens && !tokens.access && tokens.refresh) {
        await refreshTokens();
      }
      const res = await fetch(
        `${API_BASE}/conversations/${convId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
          body: JSON.stringify({
            content,
            attachment_ids: attachmentIds ?? [],
          }),
          signal,
        },
      );
      if (!res.ok || !res.body) {
        let errDetail = "";
        try {
          const errJson = (await res.json()) as { detail?: string; message?: string };
          errDetail = errJson.detail || errJson.message || "";
        } catch {
          // ignore
        }
        onError?.(errDetail ? `Notice: ${errDetail}` : `Request failed (${res.status})`);
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
            else if (event.type === "title_updated" && onTitleUpdated) onTitleUpdated(event.title);
            else if (event.type === "done")
              onDone(
                event.citations ?? [],
                event.suggested_colleagues ?? [],
                event.conflict ?? null,
                event.freshness ?? null,
              );
            else if (event.type === "error") onError?.(event.message);
          } catch {
            /* skip malformed line */
          }
        }
      }
      // Flush any remaining buffered event (handles streams that end without trailing \n\n)
      if (buffer.trim().startsWith("data: ")) {
        try {
          const event = JSON.parse(buffer.trim().slice(6));
          if (event.type === "done")
            onDone(
              event.citations ?? [],
              event.suggested_colleagues ?? [],
              event.conflict ?? null,
              event.freshness ?? null,
            );
          else if (event.type === "error") onError?.(event.message);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") onError?.(String(err));
    }
  },
  async updateMessageApprovalStatus(convId: string, msgId: string, status: "approved" | "rejected"): Promise<TeamMessage> {
    return request<TeamMessage>(`/team-chats/${convId}/messages/${msgId}/approval`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },

  // Billing & Subscriptions
  async getSubscription(): Promise<SubscriptionInfo> {
    return request<SubscriptionInfo>("/billing/subscription");
  },

  async checkoutPlan(payload: CheckoutPayload): Promise<SubscriptionInfo> {
    return request<SubscriptionInfo>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async cancelSubscription(): Promise<SubscriptionInfo> {
    return request<SubscriptionInfo>("/billing/cancel", {
      method: "POST",
    });
  },

  async listInvoices(): Promise<InvoiceRecord[]> {
    return request<InvoiceRecord[]>("/billing/invoices");
  },

  // Contract Tracker
  async getContractObligations(wsId: string, status?: string): Promise<ContractObligation[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<ContractObligation[]>(`/workspaces/${wsId}/contracts/obligations${q}`);
  },

  async scanContractDocument(wsId: string, docId: string): Promise<ContractObligation[]> {
    return request<ContractObligation[]>(`/workspaces/${wsId}/contracts/scan/${docId}`, {
      method: "POST",
    });
  },

  async updateContractObligationStatus(wsId: string, obligationId: string, status: "active" | "resolved" | "expired"): Promise<ContractObligation> {
    return request<ContractObligation>(`/workspaces/${wsId}/contracts/obligations/${obligationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async deleteContractObligation(wsId: string, obligationId: string): Promise<void> {
    return request<void>(`/workspaces/${wsId}/contracts/obligations/${obligationId}`, {
      method: "DELETE",
    });
  },

  // Workspace Digests
  async getWorkspaceDigests(wsId: string): Promise<WorkspaceDigest[]> {
    return request<WorkspaceDigest[]>(`/workspaces/${wsId}/digests`);
  },

  async generateWorkspaceDigest(wsId: string): Promise<WorkspaceDigest> {
    return request<WorkspaceDigest>(`/workspaces/${wsId}/digests/generate`, {
      method: "POST",
    });
  },

  async deleteWorkspaceDigest(wsId: string, digestId: string): Promise<void> {
    return request<void>(`/workspaces/${wsId}/digests/${digestId}`, {
      method: "DELETE",
    });
  },

  // Workspace Document Health & Quality Score
  async getWorkspaceHealth(wsId: string): Promise<WorkspaceHealthReport> {
    return request<WorkspaceHealthReport>(`/workspaces/${wsId}/health`);
  },

  async scanWorkspaceHealth(wsId: string): Promise<WorkspaceHealthReport> {
    return request<WorkspaceHealthReport>(`/workspaces/${wsId}/health/scan`, {
      method: "POST",
    });
  },

  async updateHealthIssue(wsId: string, issueId: string, status: "resolved" | "active" | "dismissed"): Promise<DocumentHealthIssue> {
    return request<DocumentHealthIssue>(`/workspaces/${wsId}/health/issues/${issueId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // AskDocs Live AI Canvas
  async getWorkspaceCanvases(wsId: string): Promise<WorkspaceCanvas[]> {
    return request<WorkspaceCanvas[]>(`/workspaces/${wsId}/canvas`);
  },

  async getWorkspaceCanvas(wsId: string, canvasId: string): Promise<WorkspaceCanvas> {
    return request<WorkspaceCanvas>(`/workspaces/${wsId}/canvas/${canvasId}`);
  },

  async generateWorkspaceCanvas(wsId: string, documentIds: string[], title?: string): Promise<WorkspaceCanvas> {
    return request<WorkspaceCanvas>(`/workspaces/${wsId}/canvas/generate`, {
      method: "POST",
      body: JSON.stringify({ document_ids: documentIds, title }),
    });
  },

  async updateWorkspaceCanvas(wsId: string, canvasId: string, payload: { title?: string; checklists?: CanvasChecklistItem[] }): Promise<WorkspaceCanvas> {
    return request<WorkspaceCanvas>(`/workspaces/${wsId}/canvas/${canvasId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteWorkspaceCanvas(wsId: string, canvasId: string): Promise<void> {
    return request<void>(`/workspaces/${wsId}/canvas/${canvasId}`, {
      method: "DELETE",
    });
  },

  // Institutional Memory Preserver & Knowledge Graph
  async getWorkspaceMemories(wsId: string): Promise<WorkspaceMemory[]> {
    return request<WorkspaceMemory[]>(`/workspaces/${wsId}/memory`);
  },

  async getWorkspaceMemoryGraph(wsId: string): Promise<MemoryGraphOut> {
    return request<MemoryGraphOut>(`/workspaces/${wsId}/memory/graph`);
  },

  async queryWorkspaceMemory(wsId: string, query: string): Promise<MemoryQueryResponse> {
    return request<MemoryQueryResponse>(`/workspaces/${wsId}/memory/query`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },

  async ingestMeetingTranscript(wsId: string, title: string, transcriptText: string): Promise<WorkspaceMemory> {
    return request<WorkspaceMemory>(`/workspaces/${wsId}/memory/transcript`, {
      method: "POST",
      body: JSON.stringify({ title, transcript_text: transcriptText }),
    });
  },
};
