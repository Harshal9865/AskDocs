export type Role = "admin" | "member" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Member {
  user_id: string;
  email: string;
  name: string;
  role: Role;
  online: boolean;
  last_seen_at: string | null;
}

export interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  file_type: string;
  status: "pending" | "processing" | "ready" | "failed";
  error_msg: string | null;
  size_bytes: number;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  type?: string;
  created_at: string;
}

export interface Participant {
  user_id: string;
  email: string;
  name: string;
  online: boolean;
}

export interface TeamChat {
  id: string;
  type: "direct" | "group";
  title: string;
  created_at: string;
  participants: Participant[];
  last_message_at: string | null;
  last_message_preview: string | null;
}

export interface TeamMessage {
  id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
}

export interface Citation {
  document_id: string;
  document_title: string;
  chunk_ordinal: number;
  snippet: string;
}

export interface ConflictWarning {
  is_conflict: boolean;
  note: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  suggested_colleagues?: { user_id: string; name: string }[] | null;
  conflict?: ConflictWarning | null;
  created_at: string;
}
