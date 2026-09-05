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
  billing_interval?: "monthly" | "annual" | null;
  subscription_status?: "active" | "canceled" | "past_due";
  subscription_renews_at?: string | null;
  card_brand?: string | null;
  card_last4?: string | null;
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

export type AudienceMode = "academic" | "office" | "legal" | "finance" | "clinical" | "personal";

export interface AudienceModeConfig {
  id: AudienceMode;
  name: string;
  badge: string;
  tagline: string;
  chatLabel: string;
  chatPlaceholder: string;
  groupTypeLabel: string;
  groupPlaceholders: string[];
  themeColor: string;
  priorityStudios: string[]; // List of studio hrefs in order of priority
  securityNote?: string;
  defaultPiiRedaction: boolean;
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
  audience_mode?: AudienceMode;
}

export interface ContractObligation {
  id: string;
  workspace_id: string;
  document_id: string;
  title: string;
  party_name?: string | null;
  obligation_type: "renewal" | "payment" | "expiration" | "compliance" | "deliverable" | "other";
  due_date?: string | null;
  notice_days?: number | null;
  amount?: string | null;
  status: "active" | "resolved" | "expired";
  summary?: string | null;
  created_at: string;
}

export interface WorkspaceDigest {
  id: string;
  workspace_id: string;
  title: string;
  summary_markdown: string;
  key_takeaways: string[];
  document_count: number;
  contract_alerts_count: number;
  created_at: string;
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
  is_pinned?: boolean;
}

export interface ConversationPage {
  items: Conversation[];
  next_cursor: string | null;
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

export interface ApprovalCard {
  approval_id: string;
  action_type: string;
  requested_amount?: string | null;
  requested_by?: string | null;
  policy_citation?: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by?: string | null;
  updated_at?: string | null;
}

export interface TeamMessage {
  id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  attachments: ChatAttachment[];
  read_by: string[];
  reactions?: Record<string, string[]>;
  approval_card?: ApprovalCard | null;
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

export interface SubscriptionInfo {
  plan: "free" | "premium" | "ultra_premium" | string;
  plan_name: string;
  billing_interval: "monthly" | "annual" | string;
  subscription_status: "active" | "canceled" | "past_due" | string;
  subscription_renews_at: string | null;
  card_brand: string | null;
  card_last4: string | null;
  documents_used: number;
  questions_used: number;
  documents_limit: number;
  questions_limit: number;
  workspaces_limit: number;
  max_file_size_mb: number;
}

export interface CheckoutPayload {
  plan: "premium" | "ultra_premium" | string;
  billing_interval: "monthly" | "annual";
  payment_method: "credit_card" | "apple_pay" | "google_pay" | "paypal" | string;
  card_number?: string;
  card_exp?: string;
  card_cvc?: string;
  cardholder_name?: string;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  plan: string;
  billing_interval: string;
  status: string;
  payment_method: string;
  card_brand?: string | null;
  card_last4?: string | null;
  paid_at: string;
}

export interface DocumentHealthIssue {
  id: string;
  workspace_id: string;
  document_id?: string | null;
  issue_type: "low_text_quality" | "duplicate_file" | "outdated_document" | "missing_metadata" | "contract_risk" | string;
  severity: "critical" | "warning" | "info" | string;
  title: string;
  description: string;
  suggested_action?: string | null;
  status: "active" | "resolved" | "dismissed" | string;
  created_at: string;
}

export interface WorkspaceHealthReport {
  health_score: number;
  total_documents: number;
  critical_issues_count: number;
  warning_issues_count: number;
  healthy_documents_count: number;
  issues: DocumentHealthIssue[];
}

export interface CanvasChecklistItem {
  id: string;
  task: string;
  source_doc: string;
  completed: boolean;
}

export interface RiskHeatMapItem {
  category: string;
  risk_level: "critical" | "warning" | "info" | string;
  clause_title: string;
  description: string;
  recommendation: string;
}

export interface MatrixRow {
  topic: string;
  summary: string;
  values: string[];
}

export interface ComparisonMatrix {
  headers: string[];
  rows: MatrixRow[];
}

export interface WorkspaceCanvas {
  id: string;
  workspace_id: string;
  title: string;
  document_ids: string[];
  matrix_data: ComparisonMatrix;
  checklists: CanvasChecklistItem[];
  heat_map: RiskHeatMapItem[];
  created_at: string;
}

export interface WorkspaceMemory {
  id: string;
  workspace_id: string;
  source_type: "decision" | "contract" | "document" | "chat" | string;
  title: string;
  summary: string;
  entities: string[];
  tags: string[];
  created_at: string;
}

export interface MemoryGraphNode {
  id: string;
  label: string;
  type: "root" | "document" | "contract" | "decision" | "policy" | string;
  details: string;
}

export interface MemoryGraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface MemoryGraphOut {
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
  memories: WorkspaceMemory[];
}

export interface MemoryQueryResponse {
  answer: string;
  relevant_memories: WorkspaceMemory[];
}

export interface DiffClause {
  clause_title: string;
  category: "liability" | "pricing" | "termination" | "sla" | "general" | string;
  risk_level: "critical" | "warning" | "favorable" | "neutral";
  doc_a_text: string;
  doc_b_text: string;
  analysis: string;
  recommendation?: string;
}

export interface ContractDiffResult {
  id: string;
  doc_a_id: string;
  doc_a_title: string;
  doc_b_id: string;
  doc_b_title: string;
  overall_risk: "high_risk" | "moderate_risk" | "favorable" | "neutral";
  summary: string;
  key_changes: string[];
  clauses: DiffClause[];
  created_at: string;
}

export interface DecisionAuditRecord {
  id: string;
  workspace_id: string;
  title: string;
  decision_type: "expenditure" | "policy_exception" | "contract_signed" | "vendor_approval" | "general";
  actor_name: string;
  actor_email: string;
  context_source: "chat" | "document" | "contract" | "manual";
  context_ref?: string;
  rationale: string;
  status: "verified" | "flagged" | "pending";
  created_at: string;
}

export interface PolicyGapItem {
  id: string;
  workspace_id: string;
  policy_document_id?: string;
  policy_title: string;
  policy_clause: string;
  actual_practice_snippet: string;
  chat_id?: string;
  severity: "critical" | "warning" | "info";
  description: string;
  suggested_remedy: string;
  status: "open" | "reconciled" | "dismissed";
  detected_at: string;
}

export interface TranscriptActionItem {
  id: string;
  task: string;
  assignee: string;
  due_date?: string | null;
  completed: boolean;
}

export interface TranscriptContradiction {
  id: string;
  spoken_claim: string;
  source_document_title: string;
  written_rule: string;
  severity: "critical" | "warning" | "info";
  analysis: string;
}

export interface SpeakerParticipation {
  speaker: string;
  word_count: number;
  share_percent: number;
  sentiment: "positive" | "neutral" | "concerned";
}

export interface MeetingTranscript {
  id: string;
  workspace_id: string;
  title: string;
  meeting_date: string;
  duration_minutes: number;
  speakers: string[];
  executive_summary: string;
  key_decisions: string[];
  action_items: TranscriptActionItem[];
  contradictions: TranscriptContradiction[];
  speaker_stats: SpeakerParticipation[];
  raw_transcript: string;
  created_at: string;
}

export interface ExtractedTableData {
  id: string;
  document_id?: string;
  document_title: string;
  table_name: string;
  columns: string[];
  rows: Record<string, string | number>[];
  total_records: number;
  confidence_score: number;
  summary_insights: string[];
  created_at: string;
}

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  source_citation?: string;
}

export interface StemFormulaItem {
  topic: string;
  formula_latex: string;
  description: string;
  variables?: string;
  step_by_step_proof?: string;
}

export interface CodingSnippetItem {
  title: string;
  language: string;
  code: string;
  time_complexity?: string;
  space_complexity?: string;
  explanation: string;
}

export interface CollegeExamGuideSection {
  section_name: string;
  exam_yield: "High" | "Medium" | "Crucial" | string;
  key_takeaways: string[];
  lab_or_project_checklist?: string[];
}

export interface StudyGuideDeck {
  id: string;
  workspace_id: string;
  title: string;
  document_titles: string[];
  executive_cheat_sheet: string;
  key_concepts: { term: string; definition: string }[];
  formulas_and_stem?: StemFormulaItem[];
  coding_snippets?: CodingSnippetItem[];
  college_exam_guide?: CollegeExamGuideSection[];
  flashcards: FlashcardItem[];
  quiz: QuizQuestion[];
  created_at: string;
}

export interface AudioDialogueTurn {
  speaker: string;
  text: string;
}

export interface AudioBriefItem {
  id: string;
  document_id?: string;
  title: string;
  speaker_format: "solo_brief" | "dialogue_podcast" | "executive" | "clinical" | "lecture" | "legal" | string;
  script_content: string;
  dialogue_turns?: AudioDialogueTurn[];
  duration_estimate_seconds: number;
  chapter_timestamps: { title: string; timestamp: string }[];
  key_takeaways: string[];
  created_at: string;
}


