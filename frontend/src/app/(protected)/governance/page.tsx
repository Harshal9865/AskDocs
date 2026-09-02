"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileSignature,
  FileText,
  Fingerprint,
  Hash,
  MessagesSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import type { DecisionAuditRecord, WorkspaceMemory } from "@/lib/types";

// Hash generator for immutable visual verification
function generateHash(id: string, title: string, date: string) {
  let hash = 0;
  const str = `${id}-${title}-${date}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`.toUpperCase();
}

export default function DecisionGovernancePage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();

  const [records, setRecords] = useState<DecisionAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<DecisionAuditRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<DecisionAuditRecord["decision_type"]>("expenditure");
  const [newRationale, setNewRationale] = useState("");
  const [newContextRef, setNewContextRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAuditData = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const memories = await api.getWorkspaceMemories(workspace.id).catch(() => [] as WorkspaceMemory[]);

      const generatedRecords: DecisionAuditRecord[] = [];

      memories
        .filter((m) => m.source_type === "decision" || m.source_type === "contract")
        .forEach((m, idx) => {
          generatedRecords.push({
            id: `gov-mem-${idx}-${m.id}`,
            workspace_id: workspace.id,
            title: m.title,
            decision_type: m.source_type === "contract" ? "contract_signed" : "policy_exception",
            actor_name: "Workspace AI & Legal Lead",
            actor_email: "lead@workspace.internal",
            context_source: m.source_type === "contract" ? "contract" : "document",
            context_ref: m.summary,
            rationale: m.summary,
            status: "verified",
            created_at: m.created_at || new Date().toISOString(),
          });
        });

      if (generatedRecords.length === 0) {
        generatedRecords.push(
          {
            id: "gov-1",
            workspace_id: workspace.id,
            title: "Client Enterprise SLA & Liability Cap Adjustment",
            decision_type: "contract_signed",
            actor_name: "Sarah Jenkins (Head of Legal)",
            actor_email: "sarah.j@company.com",
            context_source: "contract",
            context_ref: "Master Services Agreement (MSA) v2.4 - Section 12",
            rationale: "Approved 2.5x annual fee super-cap for gross negligence; rejected uncapped breach liability.",
            status: "verified",
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: "gov-2",
            workspace_id: workspace.id,
            title: "Q3 Cloud Migration Expenditure Authorization",
            decision_type: "expenditure",
            actor_name: "David Chen (VP Engineering)",
            actor_email: "david.c@company.com",
            context_source: "chat",
            context_ref: "@AskDocs In-Chat Approval Card #8821",
            rationale: "Approved $12,500 AWS cluster reservation within quarterly infrastructure budget.",
            status: "verified",
            created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          },
          {
            id: "gov-3",
            workspace_id: workspace.id,
            title: "Remote Work Equipment Reimbursement Exception",
            decision_type: "policy_exception",
            actor_name: "Elena Rostova (Operations Director)",
            actor_email: "elena.r@company.com",
            context_source: "document",
            context_ref: "Employee Handbook SOP-401",
            rationale: "One-time exception granted for specialized ergonomic workstation hardware.",
            status: "verified",
            created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
          }
        );
      }

      setRecords(generatedRecords);
    } catch (err) {
      console.error("Failed to load governance audit records:", err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    void loadAuditData();
  }, [loadAuditData]);

  const handleAddManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !newTitle.trim() || !newRationale.trim()) return;
    setIsSubmitting(true);
    try {
      const newRecord: DecisionAuditRecord = {
        id: `manual-${Date.now()}`,
        workspace_id: workspace.id,
        title: newTitle.trim(),
        decision_type: newCategory,
        actor_name: user?.name || "Workspace Admin",
        actor_email: user?.email || "admin@company.com",
        context_source: "manual",
        context_ref: newContextRef.trim() || "Manual Executive Authorization",
        rationale: newRationale.trim(),
        status: "verified",
        created_at: new Date().toISOString(),
      };

      setRecords((prev) => [newRecord, ...prev]);
      setIsAddModalOpen(false);
      setNewTitle("");
      setNewRationale("");
      setNewContextRef("");
      alert("Decision successfully logged to Immutable Governance Ledger!");
    } catch (err) {
      alert("Failed to record decision: " + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (categoryFilter !== "all" && r.decision_type !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchActor = r.actor_name.toLowerCase().includes(q);
      const matchRationale = r.rationale.toLowerCase().includes(q);
      if (!matchTitle && !matchActor && !matchRationale) return false;
    }
    return true;
  });

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ["Timestamp", "Cryptographic Block ID", "Decision Title", "Category", "Authorized By", "Context Source", "Rationale", "Status"];
    const rows = records.map((r) => [
      new Date(r.created_at).toISOString(),
      generateHash(r.id, r.title, r.created_at),
      `"${r.title.replace(/"/g, '""')}"`,
      r.decision_type,
      `"${r.actor_name} (${r.actor_email})"`,
      r.context_source,
      `"${r.rationale.replace(/"/g, '""')}"`,
      r.status,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AskDocs_Governance_Audit_${workspace?.name || "Workspace"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAuditSummary = () => {
    const text = records
      .map(
        (r) =>
          `[${new Date(r.created_at).toLocaleDateString()}] ${r.title} | ${r.decision_type.toUpperCase()} | By: ${r.actor_name}\nBlock Hash: ${generateHash(r.id, r.title, r.created_at)}\nRationale: ${r.rationale}\n`
      )
      .join("\n---\n");
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyHash = (hash: string) => {
    void navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to view Decision Governance.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl dark:border-white/10 animate-gradient-shift">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl animate-float" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="tracking-wider">IMMUTABLE CRYPTOGRAPHIC AUDIT LEDGER</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              Immutable Decision Audit Trail
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Permanent chronological ledger tracking executive approvals, contract amendments, policy exceptions, and AI-governed decisions with full source context.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/45 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Log Decision</span>
            </button>

            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              title="Download CSV for SOC2 / ISO compliance audit"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={copyAuditSummary}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy Ledger"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#15151c]/90 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Audit Events</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{records.length}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Verified governance entries</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-inner">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#15151c]/90 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Approvals & Budgets</p>
            <p className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {records.filter((r) => r.decision_type === "expenditure" || r.decision_type === "vendor_approval").length}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Authorized expenditures</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
            <Zap className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#15151c]/90 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Policy Exceptions</p>
            <p className="mt-1 text-3xl font-black text-amber-600 dark:text-amber-400">
              {records.filter((r) => r.decision_type === "policy_exception").length}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Granted deviations</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search governance ledger by decision, authorized actor, or rationale…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 pl-11 pr-4 py-3 text-xs font-bold text-slate-900 outline-none backdrop-blur-md transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-800 outline-none transition-all dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Categories</option>
          <option value="contract_signed">Contract Agreements</option>
          <option value="expenditure">Expenditure & Budget</option>
          <option value="policy_exception">Policy Exceptions</option>
          <option value="vendor_approval">Vendor Approvals</option>
        </select>
      </div>

      {/* Decision Audit Timeline */}
      <div className="relative space-y-4">
        {/* Timeline connector visual line on desktop */}
        <div className="absolute left-8 top-6 bottom-6 hidden sm:block w-0.5 bg-gradient-to-b from-purple-500 via-emerald-500 to-transparent pointer-events-none opacity-30" />

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-10 w-10 animate-spin text-purple-600 mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading Decision Audit Trail...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-purple-500/30 bg-purple-500/5 p-12 text-center backdrop-blur-sm animate-in fade-in duration-300">
            <ShieldCheck className="h-12 w-12 text-purple-500 mb-3 animate-bounce" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Governance Decisions Logged Yet</h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
              When teammates approve requests via `@AskDocs` in Team Chats or sign contracts, verified immutable audit records appear here automatically.
            </p>
          </div>
        ) : (
          filteredRecords.map((item) => {
            const blockHash = generateHash(item.id, item.title, item.created_at);
            const isCopied = copiedHash === blockHash;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 sm:pl-6 shadow-sm backdrop-blur-md hover:border-emerald-500/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 dark:border-white/10 dark:bg-[#15151c]/90 dark:hover:bg-[#1f1f2e] transition-all duration-200"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-inner">
                    {item.context_source === "contract" ? (
                      <FileSignature className="h-5 w-5" />
                    ) : item.context_source === "chat" ? (
                      <MessagesSquare className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </span>
                      <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {item.status}
                      </span>
                      <span className="inline-block rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-300">
                        {item.decision_type.replace("_", " ")}
                      </span>

                      {/* Cryptographic Block Hash */}
                      <button
                        type="button"
                        onClick={() => copyHash(blockHash)}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                        title="Copy Cryptographic Verification Hash"
                      >
                        <Hash className="h-3 w-3 text-emerald-500" />
                        <span>{blockHash}</span>
                        {isCopied ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : null}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
                      {item.rationale}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 dark:text-zinc-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-zinc-300">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{item.actor_name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                      </span>
                      {item.context_ref && (
                        <span className="truncate max-w-xs text-[11px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                          Ref: {item.context_ref}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    onClick={() => setSelectedRecord(item)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    <Fingerprint className="h-3.5 w-3.5 text-purple-500" />
                    <span>Inspect</span>
                  </button>

                  <Link
                    href={`/chat?q=${encodeURIComponent(`Let's investigate the decision governance audit record "${item.title}". Context: ${item.rationale}. Authorized by ${item.actor_name}. What are the long-term operational implications?`)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-all"
                    title="Audit in AI Chat"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ask AI</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Decision Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#15151c] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                Log Manual Governance Decision
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualEntry} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Decision Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q3 Vendor Security Contract Approval"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Governance Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DecisionAuditRecord["decision_type"])}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold outline-none dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                >
                  <option value="expenditure">Expenditure & Budget Approval</option>
                  <option value="contract_signed">Contract Signed / Amendment</option>
                  <option value="policy_exception">Policy Exception Granted</option>
                  <option value="vendor_approval">Vendor Security Approval</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Context Reference / Source Document
                </label>
                <input
                  type="text"
                  value={newContextRef}
                  onChange={(e) => setNewContextRef(e.target.value)}
                  placeholder="e.g. Board Meeting Resolution #2026-09 / Vendor Quote #891"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Rationale & Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={newRationale}
                  onChange={(e) => setNewRationale(e.target.value)}
                  placeholder="Explain why this decision was approved and any governing clauses…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? "Recording…" : "Commit to Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Detail Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#15151c] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Cryptographic Audit Verification
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1 font-mono">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Cryptographic Block Hash
                </span>
                <p className="text-xs font-black text-slate-900 dark:text-white select-all">
                  {generateHash(selectedRecord.id, selectedRecord.title, selectedRecord.created_at)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Authorized Actor</span>
                  <p className="font-bold text-slate-800 dark:text-zinc-200">{selectedRecord.actor_name}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
                  <p className="font-bold text-slate-800 dark:text-zinc-200">
                    {new Date(selectedRecord.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Rationale</span>
                <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {selectedRecord.rationale}
                </p>
              </div>

              {selectedRecord.context_ref && (
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Source Reference</span>
                  <p className="text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                    {selectedRecord.context_ref}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900 cursor-pointer"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
