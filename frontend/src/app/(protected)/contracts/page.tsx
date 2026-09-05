"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileSignature,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
  Scale,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import type { ContractObligation, DocumentItem } from "@/lib/types";

export default function ContractsPage() {
  const { workspace } = useWorkspace();
  const [obligations, setObligations] = useState<ContractObligation[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scanningDocId, setScanningDocId] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [selectedScanDocId, setSelectedScanDocId] = useState<string>("");

  const loadData = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [obList, docList] = await Promise.all([
        api.getContractObligations(workspace.id),
        api.listDocuments(workspace.id),
      ]);
      setObligations(obList);
      setDocs(docList);
    } catch (err) {
      console.error("Failed to load contract obligations:", err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (obId: string, newStatus: "active" | "resolved" | "expired") => {
    if (!workspace) return;
    try {
      const updated = await api.updateContractObligationStatus(workspace.id, obId, newStatus);
      setObligations((prev) => prev.map((item) => (item.id === obId ? updated : item)));
    } catch (err) {
      alert("Failed to update status: " + String(err));
    }
  };

  const handleDelete = async (obId: string) => {
    if (!workspace || !confirm("Are you sure you want to remove this contract deadline record?")) return;
    try {
      await api.deleteContractObligation(workspace.id, obId);
      setObligations((prev) => prev.filter((item) => item.id !== obId));
    } catch (err) {
      alert("Failed to delete record: " + String(err));
    }
  };

  const handleScanDocument = async (docId: string) => {
    if (!workspace || !docId) return;
    setScanningDocId(docId);
    try {
      const newItems = await api.scanContractDocument(workspace.id, docId);
      setScanModalOpen(false);
      await loadData();
      alert(`AI Scan Complete! Extracted ${newItems.length} contractual obligation(s).`);
    } catch (err) {
      alert("AI Scan failed: " + String(err));
    } finally {
      setScanningDocId(null);
    }
  };

  const now = new Date();
  const getDaysDiff = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const due = new Date(dateStr);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (item: ContractObligation) => {
    if (item.status === "resolved") {
      return { label: "Resolved", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
    }
    const days = getDaysDiff(item.due_date);
    if (days === null) {
      return { label: "Active", bg: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30" };
    }
    if (days < 0) {
      return { label: `Overdue by ${Math.abs(days)}d`, bg: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 font-black animate-pulse" };
    }
    if (days <= 7) {
      return { label: `Urgent (${days}d left)`, bg: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-black" };
    }
    if (days <= 30) {
      return { label: `Upcoming (${days}d)`, bg: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30" };
    }
    return { label: `In ${days} days`, bg: "bg-slate-200/60 text-slate-700 dark:bg-white/10 dark:text-zinc-300 border-slate-300 dark:border-white/10" };
  };

  const activeCount = obligations.filter((o) => o.status === "active").length;
  const urgentCount = obligations.filter((o) => o.status === "active" && getDaysDiff(o.due_date) !== null && (getDaysDiff(o.due_date)! <= 7)).length;
  const upcomingCount = obligations.filter((o) => o.status === "active" && getDaysDiff(o.due_date) !== null && (getDaysDiff(o.due_date)! > 7 && getDaysDiff(o.due_date)! <= 30)).length;
  const resolvedCount = obligations.filter((o) => o.status === "resolved").length;

  const filtered = obligations.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (typeFilter !== "all" && o.obligation_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = o.title.toLowerCase().includes(q);
      const matchParty = o.party_name?.toLowerCase().includes(q);
      const matchSummary = o.summary?.toLowerCase().includes(q);
      if (!matchTitle && !matchParty && !matchSummary) return false;
    }
    return true;
  });

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl dark:border-white/10">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 backdrop-blur-md shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span className="tracking-wider">AI-POWERED CONTRACT INTELLIGENCE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              Contract Expiry & Obligation Tracker
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Automated monitoring of renewal deadlines, payment terms, and notice windows across workspace contracts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/contracts/compare"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <Scale className="h-4 w-4 text-purple-300" />
              <span>Redline & Diff Studio</span>
            </Link>

            <button
              onClick={() => setScanModalOpen(true)}
              className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1db954] via-purple-600 to-indigo-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-[#1db954]/25 hover:shadow-[#1db954]/45 hover:brightness-110 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              <span>Scan Contract with AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Active Count */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/10 dark:bg-[#131220] transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Tracked</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{activeCount}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">Monitored obligations</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-inner">
            <FileSignature className="h-6 w-6" />
          </div>
        </div>

        {/* Urgent Count */}
        <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10 dark:border-red-500/30 dark:bg-red-950/20 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-500">Urgent (&le; 7 Days)</p>
            <p className="mt-1 text-3xl font-black text-red-600 dark:text-red-400">{urgentCount}</p>
            <p className="mt-1 text-[11px] font-medium text-red-500/80 dark:text-red-400/80">Immediate attention</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-inner">
            <AlertCircle className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        {/* Upcoming Count */}
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 dark:border-amber-500/30 dark:bg-amber-950/20 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500">Upcoming (&le; 30 Days)</p>
            <p className="mt-1 text-3xl font-black text-amber-600 dark:text-amber-400">{upcomingCount}</p>
            <p className="mt-1 text-[11px] font-medium text-amber-500/80 dark:text-amber-400/80">Coming up soon</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Resolved Count */}
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-emerald-500/30 dark:bg-emerald-950/20 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">Resolved</p>
            <p className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
            <p className="mt-1 text-[11px] font-medium text-emerald-500/80 dark:text-emerald-400/80">Completed terms</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#131220] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search contracts by title, party, or summary…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none backdrop-blur-md transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(["all", "active", "resolved", "expired"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-2xl px-4 py-2 text-xs font-extrabold capitalize transition-all duration-200 cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-105"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Type Select */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="renewal">Renewal</option>
            <option value="payment">Payment</option>
            <option value="expiration">Expiration</option>
            <option value="compliance">Compliance</option>
            <option value="deliverable">Deliverable</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Contract Obligations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-purple-500/30 bg-purple-500/5 p-12 text-center backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-500/20 text-purple-500 shadow-xl shadow-purple-500/20">
            <CalendarClock className="h-8 w-8 animate-bounce" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-400 animate-ping" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {obligations.length === 0 ? "No Contract Deadlines Tracked Yet" : "No Contract Obligations Match Filter"}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
            {obligations.length === 0
              ? "Click &quot;Scan Contract with AI&quot; to automatically parse renewal dates, notice windows, and payment terms from your workspace PDFs."
              : "Try adjusting your search query or status filter."}
          </p>
          {obligations.length === 0 && (
            <button
              onClick={() => setScanModalOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/30 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" /> Scan First Contract
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => {
            const urgency = getUrgencyBadge(item);
            return (
              <div
                key={item.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md hover:border-purple-500/40 hover:bg-white hover:shadow-xl hover:shadow-purple-500/5 dark:border-white/10 dark:bg-[#15151c]/90 dark:hover:bg-[#1f1f2e] transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-inner">
                    <FileSignature className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {item.title}
                      </span>
                      <span className={`inline-block rounded-full border px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${urgency.bg}`}>
                        {urgency.label}
                      </span>
                      <span className="inline-block rounded-full bg-slate-200/60 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-700 dark:bg-white/10 dark:text-zinc-300">
                        {item.obligation_type}
                      </span>
                    </div>

                    {item.summary && (
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{item.summary}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-zinc-400 pt-1">
                      {item.party_name && (
                        <span>
                          <strong className="font-extrabold text-slate-700 dark:text-zinc-300">Party:</strong> {item.party_name}
                        </span>
                      )}
                      {item.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <strong className="font-extrabold text-slate-700 dark:text-zinc-300">Due Date:</strong>{" "}
                          {new Date(item.due_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                      {item.notice_days && (
                        <span>
                          <strong className="font-extrabold text-slate-700 dark:text-zinc-300">Notice Period:</strong> {item.notice_days} days
                        </span>
                      )}
                      {item.amount && (
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {item.amount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 border-t border-slate-100 dark:border-white/5 pt-3 sm:border-0 sm:pt-0">
                  <Link
                    href={`/chat?q=${encodeURIComponent(`Analyze the contractual obligation "${item.title}" for party "${item.party_name || "the counterparty"}": ${item.summary || ""}`)}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-all"
                    title="Ask AI in Chat"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ask AI</span>
                  </Link>

                  {item.status === "active" ? (
                    <button
                      onClick={() => handleStatusChange(item.id, "resolved")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(item.id, "active")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reopen
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Document Scan Modal */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-[#15151c]/95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Scan Contract with AI</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Extract renewal dates & payment milestones</p>
                </div>
              </div>
              <button
                onClick={() => setScanModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {docs.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                  No uploaded documents in this workspace yet. Upload a PDF contract first.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">Choose Workspace Document:</label>
                  <select
                    value={selectedScanDocId}
                    onChange={(e) => setSelectedScanDocId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-800 outline-none dark:border-white/15 dark:bg-[#1f1f2e] dark:text-white transition-all cursor-pointer"
                  >
                    <option value="">-- Select a contract document --</option>
                    {docs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.file_type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  onClick={() => setScanModalOpen(false)}
                  className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedScanDocId || Boolean(scanningDocId)}
                  onClick={() => handleScanDocument(selectedScanDocId)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {scanningDocId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Scanning with Gemini AI…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Start AI Extraction
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
