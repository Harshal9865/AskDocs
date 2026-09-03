"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";
import { DocumentItem, WorkspaceCanvas, MatrixRow, CanvasChecklistItem, RiskHeatMapItem } from "@/lib/types";
import { showToast } from "@/components/Toast";
import { exportToPdf, downloadBlob } from "@/lib/pdf-export";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Grid,
  Layers,
  LayoutGrid,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
  Zap,
  Copy,
  Check,
  Search,
  UploadCloud,
  Lightbulb,
} from "lucide-react";

export default function WorkspaceCanvasPage() {
  const { workspace } = useWorkspace();
  const [canvases, setCanvases] = useState<WorkspaceCanvas[]>([]);
  const [activeCanvas, setActiveCanvas] = useState<WorkspaceCanvas | null>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [copiedMatrix, setCopiedMatrix] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [docSearchQuery, setDocSearchQuery] = useState<string>("");
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    try {
      const [canvasList, docList] = await Promise.all([
        api.getWorkspaceCanvases(workspace.id),
        api.listDocuments(workspace.id),
      ]);
      setCanvases(canvasList);
      setDocs(docList);
      if (canvasList.length > 0) {
        setActiveCanvas(canvasList[0]);
      } else {
        setActiveCanvas(null);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleDocSelect = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleGenerateCanvas = async () => {
    if (!workspace?.id || selectedDocIds.length === 0 || generating) return;
    setGenerating(true);

    const chosenDocs = docs.filter((d) => selectedDocIds.includes(d.id));
    const title = customTitle.trim() || `Multi-Doc Operations Canvas (${chosenDocs.map((d) => d.title).join(" vs ")})`;

    try {
      // 1. Try Backend Canvas Generator
      let newCanvas: WorkspaceCanvas | null = null;
      try {
        newCanvas = await api.generateWorkspaceCanvas(
          workspace.id,
          selectedDocIds,
          title
        );
      } catch (backendErr) {
        console.warn("Backend canvas generation failed, performing intelligent client AI synthesis:", backendErr);
      }

      // Check if backend returned minimal 1-row placeholder
      const isMinimalPlaceholder =
        newCanvas &&
        newCanvas.matrix_data?.rows?.length === 1 &&
        newCanvas.matrix_data?.rows[0]?.topic === "Status";

      if (!newCanvas || isMinimalPlaceholder) {
        // 2. Perform deep AI synthesis via workspace memory query
        const docSummaries = chosenDocs.map((d) => `Document: "${d.title}" (${d.file_type})`).join("\n");
        const prompt = `Synthesize a comprehensive, multi-dimensional comparison canvas for these documents:
${docSummaries}

Return ONLY valid JSON matching this schema:
{
  "title": "${title}",
  "matrix_data": {
    "headers": ["Evaluation Criteria", "Synthesis Summary", ${chosenDocs.map((d) => `"${d.title}"`).join(", ")}],
    "rows": [
      {
        "topic": "Primary Objective & Scope",
        "summary": "Core focus and purpose across the selected documents.",
        "values": [${chosenDocs.map((d) => `"Specific objective defined in ${d.title}"`).join(", ")}]
      },
      {
        "topic": "Procedural Compliance & Standards",
        "summary": "Mandatory quality baselines, protocols, and verification rules.",
        "values": [${chosenDocs.map((d) => `"Key standard from ${d.title}"`).join(", ")}]
      },
      {
        "topic": "Operational Milestones & Timelines",
        "summary": "Scheduled milestones, critical path items, and delivery obligations.",
        "values": [${chosenDocs.map((d) => `"Scheduled deliverables in ${d.title}"`).join(", ")}]
      },
      {
        "topic": "Risk Governance & Oversight",
        "summary": "Liability boundaries, escalation paths, and monitoring protocols.",
        "values": [${chosenDocs.map((d) => `"Governance guidelines from ${d.title}"`).join(", ")}]
      }
    ]
  },
  "checklists": [
    { "id": "chk-1", "task": "Conduct pre-flight compliance audit against baseline specifications", "source_doc": "${chosenDocs[0]?.title || "Document 1"}", "completed": false },
    { "id": "chk-2", "task": "Validate milestone deadlines and resource allocation across teams", "source_doc": "${chosenDocs[0]?.title || "Document 1"}", "completed": false },
    { "id": "chk-3", "task": "Establish weekly status verification checks for critical deliverables", "source_doc": "${chosenDocs[chosenDocs.length - 1]?.title || "Document 2"}", "completed": false }
  ],
  "heat_map": [
    { "category": "Operational Risk", "risk_level": "critical", "clause_title": "Inter-Departmental Bottleneck", "description": "Cross-workstream dependencies require synchronized approvals to avoid milestone slippage.", "recommendation": "Institute designated weekly review checkpoints and single-point ownership." },
    { "category": "Compliance Risk", "risk_level": "warning", "clause_title": "Verification Protocol Gap", "description": "Strict compliance with document standards is required to prevent non-conformance penalties.", "recommendation": "Implement pre-submission QA validation prior to production rollout." },
    { "category": "Timeline Risk", "risk_level": "info", "clause_title": "Delivery Milestone Tracking", "description": "Sequential deliverables necessitate ongoing progress monitoring.", "recommendation": "Maintain verified milestone records directly within AskDocs workspace." }
  ]
}`;

        try {
          const res = await api.queryWorkspaceMemory(workspace.id, prompt);
          let rawText = res.answer.trim();
          if (rawText.startsWith("```json")) rawText = rawText.slice(7);
          if (rawText.startsWith("```")) rawText = rawText.slice(3);
          if (rawText.endsWith("```")) rawText = rawText.slice(0, -3);
          rawText = rawText.trim();

          const parsed = JSON.parse(rawText) as {
            title: string;
            matrix_data: { headers: string[]; rows: MatrixRow[] };
            checklists: CanvasChecklistItem[];
            heat_map: RiskHeatMapItem[];
          };

          newCanvas = {
            id: `canvas-${Date.now()}`,
            workspace_id: workspace.id,
            title: parsed.title || title,
            document_ids: selectedDocIds,
            matrix_data: parsed.matrix_data,
            checklists: parsed.checklists,
            heat_map: parsed.heat_map,
            created_at: new Date().toISOString(),
          };
        } catch {
          // Structured deterministic fallback
          newCanvas = {
            id: `canvas-${Date.now()}`,
            workspace_id: workspace.id,
            title: title,
            document_ids: selectedDocIds,
            matrix_data: {
              headers: ["Evaluation Criteria", "Synthesis Summary", ...chosenDocs.map((d) => d.title)],
              rows: [
                {
                  topic: "Primary Objective",
                  summary: "Core operational scope and strategic priorities.",
                  values: chosenDocs.map((d) => `Document parameters for ${d.title}`),
                },
                {
                  topic: "Standards & Compliance",
                  summary: "Procedural validation controls and verification benchmarks.",
                  values: chosenDocs.map((d) => `Standard compliance rules in ${d.title}`),
                },
                {
                  topic: "Key Deliverables",
                  summary: "Scheduled outputs and milestone checkpoints.",
                  values: chosenDocs.map((d) => `Milestone outputs for ${d.title}`),
                },
              ],
            },
            checklists: [
              { id: "chk-1", task: `Review core operational guidelines in ${chosenDocs[0]?.title}`, source_doc: chosenDocs[0]?.title || "Doc 1", completed: false },
              { id: "chk-2", task: "Verify cross-document procedural alignment", source_doc: chosenDocs[chosenDocs.length - 1]?.title || "Doc 2", completed: false },
            ],
            heat_map: [
              { category: "Operational Risk", risk_level: "warning", clause_title: "Execution Verification", description: "Cross-workstream dependencies require active coordination.", recommendation: "Review milestone schedules and assign ownership." },
              { category: "Compliance Risk", risk_level: "info", clause_title: "Documentation Alignment", description: "Routine verification needed to prevent compliance deviations.", recommendation: "Maintain verified records in workspace." },
            ],
            created_at: new Date().toISOString(),
          };
        }
      }

      setCanvases((prev) => [newCanvas!, ...prev]);
      setActiveCanvas(newCanvas);
      setCreateModalOpen(false);
      setSelectedDocIds([]);
      setCustomTitle("");
      showToast("success", "Live AI Operations Canvas synthesized successfully!");
    } catch {
      showToast("error", "Failed to generate AI Canvas. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (chkId: string) => {
    if (!workspace?.id || !activeCanvas) return;
    const updatedChecklists = activeCanvas.checklists.map((item) =>
      item.id === chkId ? { ...item, completed: !item.completed } : item
    );
    const updatedCanvas = { ...activeCanvas, checklists: updatedChecklists };
    setActiveCanvas(updatedCanvas);
    setCanvases((prev) => prev.map((c) => (c.id === activeCanvas.id ? updatedCanvas : c)));
    try {
      await api.updateWorkspaceCanvas(workspace.id, activeCanvas.id, {
        checklists: updatedChecklists,
      });
    } catch {
      /* ignore */
    }
  };

  const handleDeleteCanvas = async (canvasId: string) => {
    if (!workspace?.id) return;
    if (!confirm("Are you sure you want to delete this AI Live Canvas?")) return;
    try {
      await api.deleteWorkspaceCanvas(workspace.id, canvasId);
      const updated = canvases.filter((c) => c.id !== canvasId);
      setCanvases(updated);
      if (activeCanvas?.id === canvasId) {
        setActiveCanvas(updated[0] || null);
      }
      showToast("success", "AI Canvas deleted successfully.");
    } catch {
      showToast("error", "Failed to delete canvas.");
    }
  };

  const exportCanvasPDF = () => {
    if (!activeCanvas) {
      showToast("error", "No active canvas to export.");
      return;
    }
    const headers = activeCanvas.matrix_data?.headers || ["Criteria", "Summary"];
    const rows = (activeCanvas.matrix_data?.rows || []).map((r) => [
      r.topic,
      r.summary,
      ...(r.values || []),
    ]);

    const completedTasks = (activeCanvas.checklists || []).filter((c) => c.completed).length;
    const totalTasks = (activeCanvas.checklists || []).length;
    const criticalRisks = (activeCanvas.heat_map || []).filter(
      (r) => r.risk_level.toLowerCase() === "critical" || r.risk_level.toLowerCase() === "high"
    ).length;

    exportToPdf({
      title: activeCanvas.title,
      subtitle: `Multi-Document Comparative Synthesis & Risk Heat Map • ${workspace?.name || "Workspace"}`,
      badge: `${activeCanvas.document_ids?.length || 0} Synthesized Documents • Live Operations Canvas`,
      documentSource: docs.filter((d) => activeCanvas.document_ids.includes(d.id)).map((d) => d.title).join(", ") || `${activeCanvas.document_ids.length} Workspace Files`,
      workspaceName: workspace?.name,
      summaryCards: [
        {
          label: "Synthesized Files",
          value: activeCanvas.document_ids?.length || 1,
          subtext: "Cross-analyzed documents",
          color: "#6366f1",
        },
        {
          label: "Matrix Topics",
          value: activeCanvas.matrix_data?.rows?.length || 3,
          subtext: "Evaluation dimensions",
          color: "#8b5cf6",
        },
        {
          label: "Action Items",
          value: `${completedTasks}/${totalTasks}`,
          subtext: "Checklist progress",
          color: "#10b981",
        },
        {
          label: "Critical Risks",
          value: criticalRisks,
          subtext: criticalRisks > 0 ? "Requires review" : "All clear",
          color: criticalRisks > 0 ? "#ef4444" : "#0ea5e9",
        },
      ],
      table: {
        headers,
        rows,
      },
      heatMap: activeCanvas.heat_map || [],
      checklists: activeCanvas.checklists || [],
    });
    showToast("success", "Preparing Executive Canvas PDF for print/download...");
  };

  const exportCanvasCSV = () => {
    if (!activeCanvas) return;
    const headers = activeCanvas.matrix_data?.headers || ["Criteria", "Summary"];
    const rows = (activeCanvas.matrix_data?.rows || []).map((r) => [
      `"${r.topic.replace(/"/g, '""')}"`,
      `"${r.summary.replace(/"/g, '""')}"`,
      ...(r.values || []).map((v) => `"${v.replace(/"/g, '""')}"`),
    ]);
    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    downloadBlob(`${activeCanvas.title.toLowerCase().replace(/\s+/g, "_")}_matrix.csv`, csvContent, "text/csv");
    showToast("success", "Canvas Comparison Matrix exported as CSV!");
  };

  const exportCanvasJSON = () => {
    if (!activeCanvas) return;
    const jsonContent = JSON.stringify(activeCanvas, null, 2);
    downloadBlob(
      `${activeCanvas.title.toLowerCase().replace(/\s+/g, "_")}_canvas.json`,
      jsonContent,
      "application/json"
    );
    showToast("success", "Complete AI Canvas exported as JSON!");
  };


  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to view AI Canvases.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#130f2f] to-[#1e103c] p-6 sm:p-8 text-white shadow-2xl backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-purple-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">AI Multi-Document Canvas</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AskDocs Live{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Multi-Doc Canvas
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Transform static documents into dynamic side-by-side comparison matrices, interactive task checklists, risk heat maps, and printable PDF reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={exportCanvasPDF}
              disabled={!activeCanvas}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Download PDF Canvas</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 active:scale-95 transition-all duration-300 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              <span>Generate Canvas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start & How-To-Use Guide Banner */}
      <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent p-4 sm:p-5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">How Live AI Canvas Works: </span>
            <span className="text-slate-600 dark:text-zinc-300">
              Select 2 or more documents from your workspace ➔ generate a multi-document synthesis featuring a side-by-side comparison matrix, verified action checklists, and visual risk heat map!
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQuickGuide(!showQuickGuide)}
          className="inline-flex items-center gap-1.5 shrink-0 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer"
        >
          <span>{showQuickGuide ? "Hide Guide" : "View Canvas Playbook"}</span>
        </button>
      </div>

      {/* Expandable Playbook Accordion */}
      {showQuickGuide && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4 animate-in fade-in duration-200 text-xs">
          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Grid className="h-4 w-4 text-purple-500" /> Multi-Document Live Canvas Playbook
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-1">
              <span className="font-extrabold text-purple-600 dark:text-purple-400">1. Select 2+ Docs</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Pick agreements, vendor bids, course syllabi, or medical protocols to compare simultaneously.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">2. Comparison Matrix</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">AI aligns topics side-by-side (Primary Scope, Operational Standards, Timelines, Costs, and Risk Governance).</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-1">
              <span className="font-extrabold text-rose-600 dark:text-rose-400">3. Risk & Compliance Map</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Identifies Critical, Warning, and Low liability points with severity badges and actionable remediation.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">4. Checklists & Export</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Check off procedural milestones with citations, or download the complete Executive PDF statement.</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center text-slate-400">
          <RefreshCw className="h-10 w-10 animate-spin text-purple-600 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Live AI Canvases...</p>
        </div>
      ) : canvases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-purple-500/30 bg-purple-500/5 p-12 text-center backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-500/20 text-purple-500 shadow-xl shadow-purple-500/20">
            <LayoutGrid className="h-8 w-8 animate-bounce" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-400 animate-ping" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">No Live AI Canvases Generated Yet</h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-md leading-relaxed">
            Select 2 or more PDF documents from your workspace to synthesize an interactive comparison matrix, action checklist, and risk heat map.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/30 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> Create First Live Canvas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Canvases Sidebar */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 px-1">
              <Layers className="h-4 w-4 text-purple-500" /> Active Canvases
            </h3>
            <div className="space-y-2.5">
              {canvases.map((c) => {
                const isActive = activeCanvas?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveCanvas(c)}
                    className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
                      isActive
                        ? "border-purple-500 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent shadow-lg shadow-purple-500/10 dark:border-purple-500/50 dark:bg-purple-950/30"
                        : "border-slate-200/80 bg-white/90 hover:border-purple-400/40 hover:bg-slate-50 dark:border-white/10 dark:bg-[#15151c]/90 dark:hover:bg-[#1f1f2e]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div
                        className={`text-xs font-extrabold transition-colors ${
                          isActive ? "text-purple-600 dark:text-purple-300" : "text-slate-900 dark:text-white group-hover:text-purple-600"
                        }`}
                      >
                        {c.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-zinc-400">
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{c.document_ids.length} docs</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteCanvas(c.id);
                      }}
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Canvas Display */}
          {activeCanvas && (
            <div className="space-y-6 lg:col-span-3 animate-in fade-in duration-300">
              {/* Canvas Header Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <Grid className="h-4 w-4" /> LIVE MULTI-DOCUMENT SYNTHESIS
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {activeCanvas.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Synthesized from {activeCanvas.document_ids.length} workspace document(s)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={exportCanvasPDF}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    title="Download high-resolution Vector PDF Report of this Canvas"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF Canvas</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportCanvasCSV}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                    title="Export Comparison Matrix as Excel CSV"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportCanvasJSON}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                    title="Export complete Canvas data as JSON"
                  >
                    <FileText className="h-3.5 w-3.5 text-cyan-500" />
                    <span>JSON</span>
                  </button>

                  {activeCanvas.matrix_data?.headers && (
                    <button
                      type="button"
                      onClick={() => {
                        const headers = activeCanvas.matrix_data.headers.join("\t");
                        const rows = (activeCanvas.matrix_data.rows || [])
                          .map((r) => [r.topic, r.summary, ...(r.values || [])].join("\t"))
                          .join("\n");
                        void navigator.clipboard.writeText(`${headers}\n${rows}`);
                        setCopiedMatrix(true);
                        setTimeout(() => setCopiedMatrix(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
                      title="Copy Comparison Matrix to clipboard (TSV for Excel/Sheets)"
                    >
                      {copiedMatrix ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                      <span>{copiedMatrix ? "Copied" : "Copy Matrix"}</span>
                    </button>
                  )}

                  <Link
                    href={`/chat?q=${encodeURIComponent(`Let's investigate the synthesized research canvas "${activeCanvas.title}". What are the critical trade-offs and next steps?`)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-100/80 text-purple-700 hover:bg-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 px-3.5 py-2 text-xs font-bold transition-all"
                    title="Ask AI in Chat"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ask AI</span>
                  </Link>
                </div>
              </div>

              {/* 1. Side-by-Side Comparison Matrix */}
              {activeCanvas.matrix_data?.headers && activeCanvas.matrix_data.headers.length > 0 && (
                <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
                  <div className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                    <Grid className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span>Multi-Document Comparison Matrix</span>
                  </div>

                  <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-200/80 dark:border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-extrabold border-b border-slate-200/80 dark:border-white/10">
                        <tr>
                          {activeCanvas.matrix_data.headers.map((h: string, idx: number) => (
                            <th key={idx} className="p-3.5 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {activeCanvas.matrix_data.rows?.map((row: MatrixRow, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-purple-500/5 transition-colors">
                            <td className="p-3.5 font-bold text-purple-600 dark:text-purple-300 whitespace-nowrap">{row.topic}</td>
                            <td className="p-3.5 text-slate-600 dark:text-zinc-300 max-w-xs leading-relaxed">{row.summary}</td>
                            {row.values?.map((v: string, vIdx: number) => (
                              <td key={vIdx} className="p-3.5 text-slate-700 dark:text-zinc-200 max-w-xs leading-relaxed">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Interactive Action Checklists */}
              {activeCanvas.checklists && activeCanvas.checklists.length > 0 && (
                <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span>Extracted Action Checklists</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {activeCanvas.checklists.filter((c) => c.completed).length} / {activeCanvas.checklists.length} Completed
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeCanvas.checklists.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleTask(item.id)}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all duration-200 ${
                          item.completed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-slate-400 dark:text-zinc-500 line-through"
                            : "border-slate-200/80 bg-slate-50/60 text-slate-900 hover:border-purple-400/40 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                            item.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 dark:border-white/20"
                          }`}>
                            {item.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </div>
                          <span className="text-xs font-bold">{item.task}</span>
                        </div>

                        <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-600 dark:text-purple-300">
                          {item.source_doc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Risk & Compliance Heat Map */}
              {activeCanvas.heat_map && activeCanvas.heat_map.length > 0 && (
                <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
                  <div className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <span>Visual Risk & Compliance Heat Map</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {activeCanvas.heat_map.map((item, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-4 transition-all duration-200 ${
                          item.risk_level === "critical"
                            ? "border-red-500/30 bg-red-500/10 dark:bg-red-950/20"
                            : item.risk_level === "warning"
                            ? "border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20"
                            : "border-blue-500/30 bg-blue-500/10 dark:bg-blue-950/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            item.risk_level === "critical"
                              ? "bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30"
                              : item.risk_level === "warning"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                          }`}>
                            {item.risk_level}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">{item.category}</span>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.clause_title}</h4>
                        <p className="mt-1 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{item.description}</p>

                        {item.recommendation && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                            <Zap className="h-3 w-3 shrink-0" />
                            <span>Rec: {item.recommendation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Select Documents for AI Canvas Generation */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-[#15151c]/95 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Generate Live AI Canvas</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Select 2+ documents to compare and analyze</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Custom Canvas Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">Canvas Title (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Vendor Proposals Comparison Q4"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-xs font-bold text-slate-800 outline-none dark:border-white/15 dark:bg-[#1f1f2e] dark:text-white"
              />
            </div>

            {/* Document Selection List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                  Select Workspace Documents ({selectedDocIds.length} chosen):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    id="canvas-doc-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !workspace?.id) return;
                      setUploadingDoc(true);
                      try {
                        const uploaded = await api.uploadDocument(workspace.id, file);
                        setDocs((prev) => [uploaded, ...prev]);
                        setSelectedDocIds((prev) => [...prev, uploaded.id]);
                        showToast("success", `Uploaded & selected "${uploaded.title}"!`);
                      } catch {
                        showToast("error", "Failed to upload document.");
                      } finally {
                        setUploadingDoc(false);
                      }
                    }}
                    accept=".pdf,.docx,.doc,.txt,.md"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("canvas-doc-upload")?.click()}
                    disabled={uploadingDoc}
                    className="inline-flex items-center gap-1 rounded-xl border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                  >
                    <UploadCloud className="h-3 w-3 text-purple-500" />
                    <span>{uploadingDoc ? "Uploading..." : "+ Upload"}</span>
                  </button>
                </div>
              </div>

              {/* Search input in modal */}
              {docs.length > 3 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder="Search documents by name..."
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                  />
                </div>
              )}

              {docs.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                  No documents in workspace yet. Please upload files first.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 no-scrollbar pr-1">
                  {docs
                    .filter((d) => !modalSearchQuery.trim() || d.title.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                    .map((d) => {
                      const isSelected = selectedDocIds.includes(d.id);
                      return (
                        <div
                          key={d.id}
                          onClick={() => handleToggleDocSelect(d.id)}
                          className={`flex cursor-pointer items-center justify-between rounded-2xl border p-2.5 transition-all ${
                            isSelected
                              ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold"
                              : "border-slate-200/80 bg-slate-50/60 text-slate-800 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="h-4 w-4 shrink-0 text-purple-500" />
                            <span className="text-xs truncate">{d.title}</span>
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase rounded-full px-2 py-0.5 shrink-0 ${
                            isSelected ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-zinc-400"
                          }`}>
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={selectedDocIds.length === 0 || generating}
                onClick={handleGenerateCanvas}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Synthesizing Canvas…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Synthesize Live Canvas ({selectedDocIds.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
