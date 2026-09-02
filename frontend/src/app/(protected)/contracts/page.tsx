"use client";

import { useCallback, useEffect, useState } from "react";
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

  // Helper calculations
  const now = new Date();
  const getDaysDiff = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const due = new Date(dateStr);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (item: ContractObligation) => {
    if (item.status === "resolved") {
      return { label: "Resolved", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
    }
    const days = getDaysDiff(item.due_date);
    if (days === null) {
      return { label: "Active", bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800" };
    }
    if (days < 0) {
      return { label: `Overdue by ${Math.abs(days)}d`, bg: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800 font-bold" };
    }
    if (days <= 7) {
      return { label: `Urgent (${days}d left)`, bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold" };
    }
    if (days <= 30) {
      return { label: `Upcoming (${days}d)`, bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
    }
    return { label: `In ${days} days`, bg: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700" };
  };

  // Metrics
  const activeCount = obligations.filter((o) => o.status === "active").length;
  const urgentCount = obligations.filter((o) => o.status === "active" && getDaysDiff(o.due_date) !== null && (getDaysDiff(o.due_date)! <= 7)).length;
  const upcomingCount = obligations.filter((o) => o.status === "active" && getDaysDiff(o.due_date) !== null && (getDaysDiff(o.due_date)! > 7 && getDaysDiff(o.due_date)! <= 30)).length;
  const resolvedCount = obligations.filter((o) => o.status === "resolved").length;

  // Filtered List
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
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Contract Expiry & Obligation Tracker
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                AI-driven monitoring of renewal deadlines, payment terms, and notice windows across workspace contracts
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setScanModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" /> Scan Document with AI
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-[#13111f]/90">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Tracked</span>
            <FileSignature className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{activeCount}</div>
        </div>

        <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-4 shadow-2xs backdrop-blur-md dark:border-red-900/30 dark:bg-red-950/20">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-xs font-bold uppercase tracking-wider">Urgent (&le; 7 Days)</span>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-red-700 dark:text-red-300">{urgentCount}</div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-2xs backdrop-blur-md dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming (&le; 30 Days)</span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800 dark:text-amber-300">{upcomingCount}</div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-2xs backdrop-blur-md dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-300">{resolvedCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search contracts by title, party, or summary…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/80 bg-white/90 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 outline-none backdrop-blur-md transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#13111f]/90 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(["all", "active", "resolved", "expired"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition-all ${
                statusFilter === st
                  ? "bg-purple-600 text-white shadow-xs"
                  : "border border-slate-200/80 bg-white/80 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
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
            className="rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none backdrop-blur-md transition-all dark:border-white/10 dark:bg-[#13111f]/90 dark:text-zinc-200"
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
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600 dark:text-purple-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-[#13111f]/50">
          <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            {obligations.length === 0 ? "No contract deadlines tracked yet" : "No contract obligations match your filter"}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
            {obligations.length === 0
              ? "Click 'Scan Document with AI' above to extract renewal dates and payment milestones automatically from your PDFs."
              : "Try adjusting your search query or status filters."}
          </p>
          {obligations.length === 0 && (
            <button
              onClick={() => setScanModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition-all"
            >
              <Sparkles className="h-4 w-4" /> Scan First Contract
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const urgency = getUrgencyBadge(item);
            return (
              <div
                key={item.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-purple-300/80 dark:border-white/10 dark:bg-[#13111f]/90 dark:hover:border-purple-500/30"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 shadow-xs">
                    <FileSignature className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase ${urgency.bg}`}>
                        {urgency.label}
                      </span>
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-white/10 dark:text-zinc-300">
                        {item.obligation_type}
                      </span>
                    </div>

                    {item.summary && (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{item.summary}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                      {item.party_name && (
                        <span>
                          <strong className="font-semibold text-slate-700 dark:text-zinc-300">Party:</strong> {item.party_name}
                        </span>
                      )}
                      {item.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <strong className="font-semibold text-slate-700 dark:text-zinc-300">Due Date:</strong>{" "}
                          {new Date(item.due_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                      {item.notice_days && (
                        <span>
                          <strong className="font-semibold text-slate-700 dark:text-zinc-300">Notice Period:</strong> {item.notice_days} days
                        </span>
                      )}
                      {item.amount && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {item.amount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 border-t border-slate-100 dark:border-white/5 pt-2 sm:border-0 sm:pt-0">
                  {item.status === "active" ? (
                    <button
                      onClick={() => handleStatusChange(item.id, "resolved")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(item.id, "active")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reopen
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-[#13111f]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Scan Contract with AI</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Select a document to extract obligations</p>
                </div>
              </div>
              <button
                onClick={() => setScanModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Choose Document:</label>
                  <select
                    value={selectedScanDocId}
                    onChange={(e) => setSelectedScanDocId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none dark:border-white/15 dark:bg-[#1a172c] dark:text-white"
                  >
                    <option value="">-- Select a document --</option>
                    {docs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.file_type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  onClick={() => setScanModalOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedScanDocId || Boolean(scanningDocId)}
                  onClick={() => handleScanDocument(selectedScanDocId)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {scanningDocId ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning with Gemini…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" /> Start AI Extraction
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
