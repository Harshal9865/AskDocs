export type Role = "admin" | "member" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  avatar_kind?: "initials" | "sticker" | "upload";
  avatar_value?: string | null;
  bio?: string | null;
  phone?: string | null;
  status?: string | null;
  location?: string | null;
  pronouns?: string | null;
  job_title?: string | null;
  job_role?: string | null;
  plan?: string;
  documents_used?: number;
  questions_used?: number;
  online?: boolean;
  friendship_status?: string;
  friendship_id?: string | null;
  friendship_by_me?: boolean;
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
  brand_kind?: "default" | "sticker" | "upload";
  brand_value?: string | null;
  is_public?: boolean;
  member_count?: number | null;
  role?: string;
}

export interface JoinRequest {
  id: string;
  workspace_id: string;
  workspace_name?: string | null;
  user_id: string;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
  reviewed_at?: string | null;
  user_email?: string | null;
  user_name?: string | null;
}

export interface Member {
  user_id: string;
  email: string;
  name: string;
  avatar_kind?: string;
  avatar_value?: string | null;
  role: Role;
  online: boolean;
  last_seen_at: string | null;
  bio?: string | null;
  phone?: string | null;
  status?: string | null;
  location?: string | null;
  pronouns?: string | null;
  job_title?: string | null;
  job_role?: string | null;
}

export interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  expires_at: string | null;
}

export interface DocumentItem {
  id: string;
  title: string;
  file_type: string;
  status: "pending" | "processing" | "ready" | "failed";
  error_msg: string | null;
  size_bytes: number;
  uploader_id?: string;
  created_at?: string;
  workspace_id?: string;
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
  avatar_kind?: string | null;
  avatar_value?: string | null;
  bio?: string | null;
  phone?: string | null;
  status?: string | null;
  location?: string | null;
  pronouns?: string | null;
  job_title?: string | null;
  job_role?: string | null;
}

export interface TeamChat {
  id: string;
  type: "direct" | "group";
  title: string;
  created_at: string;
  participants: Participant[];
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
}

export interface ChatAttachment {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  url: string;
}

export interface TeamMessage {
  id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  attachments: ChatAttachment[];
  read_by: string[];
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

export interface FreshnessWarning {
  oldest_days: number;
  document_title: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  suggested_colleagues?: { user_id: string; name: string }[] | null;
  conflict?: ConflictWarning | null;
  freshness?: FreshnessWarning | null;
  created_at: string;
}

export interface PlanInfo {
  plan: string;
  documents_used: number;
  questions_used: number;
  documents_limit: number;
  questions_limit: number;
  workspaces_limit: number;
  plan_reset_at: string | null;
}
