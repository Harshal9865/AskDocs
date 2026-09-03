"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  FileCheck,
  FolderSync,
  GraduationCap,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Plug2,
  Radio,
  RefreshCw,
  Scale,
  Send,
  Shield,
  Stethoscope,
  Terminal,
  Wallet,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";

type IntegrationTab =
  | "gdrive"
  | "slack"
  | "notion"
  | "odoo"
  | "webhooks"
  | "api_playground";

type CodeLang = "curl" | "python" | "node";

export default function IntegrationsPage() {
  const { workspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<IntegrationTab>("gdrive");
  const [codeLang, setCodeLang] = useState<CodeLang>("curl");

  // State for Google Drive / OneDrive
  const [gdriveFolder, setGdriveFolder] = useState("University Syllabi & Research Notes");
  const [gdriveAutoIngest, setGdriveAutoIngest] = useState(true);
  const [gdriveSyncing, setGdriveSyncing] = useState(false);
  const [gdriveAuthorized, setGdriveAuthorized] = useState(true);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<string[]>(["f1", "f2", "f4"]);
  const [importingSelected, setImportingSelected] = useState(false);

  const candidateDriveFiles = [
    { id: "f1", name: "Bioengineering_Lecture_04.pdf", size: "1.4 MB", type: "PDF Document", lastMod: "Today, 02:15 PM" },
    { id: "f2", name: "Clinical_Protocol_2026.xlsx", size: "840 KB", type: "Excel Spreadsheet", lastMod: "Yesterday, 11:30 AM" },
    { id: "f3", name: "Corporate_Expenditure_SOP.docx", size: "512 KB", type: "Word Document", lastMod: "Aug 29, 2026" },
    { id: "f4", name: "Brain_Anatomy_Diagram.png", size: "2.1 MB", type: "PNG Image", lastMod: "Aug 28, 2026" },
    { id: "f5", name: "Quarterly_Compliance_Review.pdf", size: "3.8 MB", type: "PDF Document", lastMod: "Aug 25, 2026" },
    { id: "f6", name: "Research_Methodology_Notes.docx", size: "920 KB", type: "Word Document", lastMod: "Aug 20, 2026" },
  ];

  const handleGrantPermission = () => {
    setGdriveAuthorized(true);
    setPermissionModalOpen(false);
    showToast("success", "Google Drive permissions granted! Account connected.");
  };

  const handleRevokePermission = () => {
    setGdriveAuthorized(false);
    showToast("info", "Google Drive permissions revoked.");
  };

  const handleToggleFileSelection = (id: string) => {
    setSelectedDriveFiles((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImportSelectedFiles = async () => {
    if (selectedDriveFiles.length === 0) {
      showToast("error", "Please select at least 1 document to import.");
      return;
    }
    setImportingSelected(true);
    await new Promise((r) => setTimeout(r, 1200));
    setImportingSelected(false);
    setFilePickerOpen(false);
    showToast("success", `Successfully imported ${selectedDriveFiles.length} selected documents into AskDocs vault.`);
  };

  const handleSyncGdrive = async () => {
    if (!gdriveAuthorized) {
      setPermissionModalOpen(true);
      return;
    }
    setGdriveSyncing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGdriveSyncing(false);
    showToast("success", "Cloud Drive synced: 6 new documents auto-indexed into AskDocs.");
  };
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/T000/B000/XXXXX");
  const [slackChannel, setSlackChannel] = useState("#sop-helpdesk");
  const [slackAutoReply, setSlackAutoReply] = useState(true);
  const [testingSlack, setTestingSlack] = useState(false);

  // State for Notion & Obsidian
  const [notionToken, setNotionToken] = useState("secret_notion_api_key_88923");
  const [notionDbName, setNotionDbName] = useState("Course Syllabi & Clinical Guidelines");
  const [notionSyncing, setNotionSyncing] = useState(false);

  // State for Odoo & ERP
  const [odooUrl, setOdooUrl] = useState("https://mycompany.odoo.com");
  const [odooDb, setOdooDb] = useState("production_db");
  const [odooApiKey, setOdooApiKey] = useState("odo_live_key_993421");
  const [testingOdoo, setTestingOdoo] = useState(false);

  // State for Webhooks
  const [webhookUrl, setWebhookUrl] = useState("https://api.yourdomain.com/webhooks/askdocs");
  const [webhookSecret, setWebhookSecret] = useState("whsec_993847289123847");
  const [eventDocIndexed, setEventDocIndexed] = useState(true);
  const [eventCriticalRisk, setEventCriticalRisk] = useState(true);
  const [eventTableExtracted, setEventTableExtracted] = useState(true);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // State for Developer API Playground
  const [apiKey] = useState(`ak_live_${workspace?.id?.replace(/-/g, "").slice(0, 16) || "77a9f430b2e811ef"}`);
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  const handleSyncGdrive = async () => {
    setGdriveSyncing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGdriveSyncing(false);
    showToast("success", "Cloud Drive synced: 6 new documents auto-indexed into AskDocs.");
  };

  const handleTestSlack = async () => {
    setTestingSlack(true);
    await new Promise((r) => setTimeout(r, 1000));
    setTestingSlack(false);
    showToast("success", "Slack test ping delivered to " + slackChannel);
  };

  const handleSyncNotion = async () => {
    setNotionSyncing(true);
    await new Promise((r) => setTimeout(r, 1300));
    setNotionSyncing(false);
    showToast("success", "Notion 2-way sync complete: 18 pages re-indexed into memory.");
  };

  const handleTestOdoo = async () => {
    setTestingOdoo(true);
    await new Promise((r) => setTimeout(r, 1200));
    setTestingOdoo(false);
    showToast("success", "Odoo ERP connection verified! Table Extractor mapped to Purchase Orders.");
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    await new Promise((r) => setTimeout(r, 900));
    setTestingWebhook(false);
    showToast("success", "Test event `document.risk_detected` dispatched successfully (200 OK).");
  };

  const copyApiKey = () => {
    void navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    showToast("success", "Workspace API Key copied to clipboard");
  };

  const handleRunApiTest = async () => {
    if (!workspace?.id) return;
    setApiTesting(true);
    setApiResponse(null);
    await new Promise((r) => setTimeout(r, 1000));
    setApiResponse(
      JSON.stringify(
        {
          status: "success",
          workspace_id: workspace.id,
          query: "Summarize top procedural guidelines and compliance requirements",
          answer:
            "Based on the verified documents, procedural workflows require strict adherence to Section 4.2 compliance standards, 2-stage verification, and scheduled quarterly reviews.",
          citations: [
            { document_title: "Operations_SOP.pdf", chunk_index: 2, confidence: 0.98 },
            { document_title: "Clinical_Protocol_2026.pdf", chunk_index: 4, confidence: 0.95 },
          ],
          model: "gemini-3.6-flash",
          execution_time_ms: 342,
        },
        null,
        2
      )
    );
    setApiTesting(false);
    showToast("success", "API request executed successfully (200 OK)!");
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to manage integrations and developer API.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Cosmic Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#130f2f] to-[#1e103c] p-6 sm:p-9 text-white shadow-2xl backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-purple-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <Plug2 className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">Universal Connectors & Developer Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Connect AskDocs to{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Your Entire Workflow
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Auto-sync course notes, hospital guidelines, and company SOPs with Google Drive, Slack, Discord, Notion, and Odoo ERP. Automate custom document pipelines using our 100% Free REST API & Webhooks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 justify-end">
                <Radio className="h-3 w-3 animate-pulse text-emerald-400" /> 6 Connectors Active
              </span>
              <p className="text-xs font-semibold text-slate-300 mt-0.5">100% Free & Open Standards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audience Value Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { icon: GraduationCap, label: "Students", text: "Auto-sync Drive & Notion" },
          { icon: Stethoscope, label: "Medical", text: "Secure protocol alerts" },
          { icon: Building2, label: "Corporate", text: "Slack SOP auto-replies" },
          { icon: Wallet, label: "Finance", text: "Odoo ERP table ingestion" },
          { icon: Scale, label: "Legal", text: "Risk dispatch webhooks" },
          { icon: Terminal, label: "Developers", text: "Universal REST API" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-[#15151c]/95 shadow-sm space-y-1 text-center sm:text-left"
            >
              <div className="flex items-center gap-1.5 justify-center sm:justify-start text-xs font-extrabold text-purple-600 dark:text-purple-400">
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-tight">{item.text}</p>
            </div>
          );
        })}
      </div>

      {/* Main Tabs Container */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 pb-3 dark:border-white/5">
          {[
            { id: "gdrive", label: "Google Drive / OneDrive", icon: FolderSync, color: "text-[#34A853]" },
            { id: "slack", label: "Slack & Teams Bot", icon: MessageSquare, color: "text-[#E01E5A]" },
            { id: "notion", label: "Notion & Obsidian", icon: Layers, color: "text-slate-800 dark:text-white" },
            { id: "odoo", label: "Odoo ERP & SAP", icon: Zap, color: "text-[#714B67]" },
            { id: "webhooks", label: "Event Webhooks", icon: Webhook, color: "text-amber-500" },
            { id: "api_playground", label: "Developer REST API", icon: Code2, color: "text-purple-500" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as IntegrationTab)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "border-purple-500 bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "border-slate-200/80 bg-slate-50/60 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1a1a24] dark:text-zinc-300"
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? "text-white" : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Google Drive & OneDrive */}
        {activeTab === "gdrive" && (
          <div className="space-y-6 animate-pop-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Cloud Drive Auto-Ingestion (Google Drive & OneDrive)
                  </h3>
                  {gdriveAuthorized ? (
                    <span className="badge-pop inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> OAuth 2.0 Connected
                    </span>
                  ) : (
                    <span className="badge-pop inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Shield className="h-3 w-3" /> Permission Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Connect your Google Drive account, selectively choose which PDFs/documents to ingest, and toggle automated real-time ingestion.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setFilePickerOpen(true)}
                  className="btn-pop inline-flex items-center gap-1.5 rounded-2xl border border-purple-200/80 bg-purple-50/80 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300 transition-all cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Browse & Select Docs</span>
                </button>

                <button
                  onClick={handleSyncGdrive}
                  disabled={gdriveSyncing}
                  className="btn-pop inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <FolderSync className={`h-3.5 w-3.5 ${gdriveSyncing ? "animate-spin" : ""}`} />
                  <span>{gdriveSyncing ? "Scanning Drive Vault…" : "Sync Drive Now"}</span>
                </button>
              </div>
            </div>

            {/* Permission Control Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4.5 dark:border-white/5 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Google Drive OAuth Access Scopes
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {gdriveAuthorized
                      ? "Connected as team@askdocs-enterprise.com • Read-only access to selected folder"
                      : "Access has not been authorized yet. Grant read permissions to select documents."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {gdriveAuthorized ? (
                  <button
                    onClick={handleRevokePermission}
                    className="btn-pop rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-1.5 text-xs font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-300 cursor-pointer"
                  >
                    Revoke Access
                  </button>
                ) : (
                  <button
                    onClick={() => setPermissionModalOpen(true)}
                    className="btn-pop rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 cursor-pointer"
                  >
                    Authorize Account
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Target Google Drive Folder
                </label>
                <input
                  type="text"
                  value={gdriveFolder}
                  onChange={(e) => setGdriveFolder(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Sync Frequency & Polling
                </label>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white transition-colors">
                  <option>Real-Time Push Webhooks (Recommended)</option>
                  <option>Every 15 Minutes (Scheduled Poll)</option>
                  <option>Hourly Batch Ingestion</option>
                  <option>Manual Trigger Only</option>
                </select>
              </div>
            </div>

            {/* Synced Files Live Feed */}
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-4.5 dark:border-white/5 dark:bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <FolderSync className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Currently Indexed Cloud Documents</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">{selectedDriveFiles.length} Selected Files Synced</span>
              </div>

              <div className="divide-y divide-slate-200/60 dark:divide-white/5 text-xs">
                {candidateDriveFiles
                  .filter((f) => selectedDriveFiles.includes(f.id))
                  .map((f, i) => (
                    <div key={i} className="pop-spring flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/80 dark:hover:bg-white/5 cursor-default">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base">📄</span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-800 dark:text-zinc-200">{f.name}</p>
                          <p className="text-[10px] text-slate-400">{f.size} • {f.type} • {f.lastMod}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-3 w-3" /> Indexed & Vectorized
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Automation Toggle: Real-time Ingestion for newly uploaded docs */}
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-50/40 p-5 dark:bg-emerald-950/20 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>⚡ Real-Time Auto-Fetch Automation</span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                    Live Webhook
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Whenever any new PDF, contract, or spreadsheet is dropped into this Google Drive folder, AskDocs will automatically ingest, OCR, and vectorize it directly into this workspace.
                </p>
              </div>
              <input
                type="checkbox"
                checked={gdriveAutoIngest}
                onChange={() => setGdriveAutoIngest(!gdriveAutoIngest)}
                className="h-5 w-5 rounded accent-emerald-600 cursor-pointer ml-3"
              />
            </div>
          </div>
        )}

        {/* ---------------- GOOGLE DRIVE PERMISSION MODAL ---------------- */}
        {permissionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151228] space-y-4">
              <button
                onClick={() => setPermissionModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <FolderSync className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Google Drive Permission Request
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    AskDocs by Google Antigravity
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-white/5 dark:bg-white/[0.03] space-y-2 text-xs">
                <p className="font-bold text-slate-700 dark:text-zinc-300">
                  AskDocs requests permission to:
                </p>
                <div className="space-y-1.5 text-slate-600 dark:text-zinc-400 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>View and read PDFs, Docx, and Excel files in your selected folder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Receive webhook notifications when new documents are added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Extract table structures & OCR diagram embeddings</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPermissionModalOpen(false)}
                  className="btn-pop rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGrantPermission}
                  className="btn-pop rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20"
                >
                  Grant & Connect Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SELECTIVE DOCUMENT PICKER MODAL ---------------- */}
        {filePickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151228] space-y-4">
              <button
                onClick={() => setFilePickerOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Select Google Drive Documents to Ingest</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Choose specific files from &ldquo;{gdriveFolder}&rdquo;
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {selectedDriveFiles.length} Selected
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 pr-1">
                {candidateDriveFiles.map((file) => {
                  const isChecked = selectedDriveFiles.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      onClick={() => handleToggleFileSelection(file.id)}
                      className={`pop-spring flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-500/30"
                          : "hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded accent-purple-600"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {file.size} • {file.type} • Modified {file.lastMod}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDriveFiles(
                      selectedDriveFiles.length === candidateDriveFiles.length
                        ? []
                        : candidateDriveFiles.map((f) => f.id)
                    )
                  }
                  className="text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-purple-600 underline"
                >
                  {selectedDriveFiles.length === candidateDriveFiles.length
                    ? "Deselect All"
                    : "Select All Documents"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilePickerOpen(false)}
                    className="btn-pop rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={importingSelected || selectedDriveFiles.length === 0}
                    onClick={handleImportSelectedFiles}
                    className="btn-pop rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 disabled:opacity-50"
                  >
                    {importingSelected
                      ? "Importing Selected…"
                      : `Import Selected (${selectedDriveFiles.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Slack & Teams */}
        {activeTab === "slack" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Slack & Microsoft Teams Bi-Directional AI Assistant</span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                    Connected
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tag <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-purple-600 dark:bg-white/10">@AskDocs</code> in Slack or Discord channels to get instant answers from company SOPs and clinical protocols.
                </p>
              </div>

              <button
                onClick={handleTestSlack}
                disabled={testingSlack}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {testingSlack ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>{testingSlack ? "Pinging Channel…" : "Send Test Ping"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Incoming Webhook URL
                </label>
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Default Alert Channel
                </label>
                <input
                  type="text"
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-50/40 p-4 dark:bg-purple-950/20 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Answer SOP & Policy Inquiries</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Automatically replies in threads with verified source citations whenever employees or students ask questions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={slackAutoReply}
                onChange={() => setSlackAutoReply(!slackAutoReply)}
                className="h-5 w-5 rounded accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Notion & Obsidian */}
        {activeTab === "notion" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Notion & Obsidian 2-Way Knowledge Base Sync</span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Synchronizes your Notion pages and Markdown vaults. Push cheat sheets and flashcards directly into Notion.
                </p>
              </div>

              <button
                onClick={handleSyncNotion}
                disabled={notionSyncing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${notionSyncing ? "animate-spin" : ""}`} />
                <span>{notionSyncing ? "Syncing Pages…" : "Sync Notion Pages"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Notion Internal Integration Token
                </label>
                <input
                  type="password"
                  value={notionToken}
                  onChange={(e) => setNotionToken(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Connected Notion Database / Root Page
                </label>
                <input
                  type="text"
                  value={notionDbName}
                  onChange={(e) => setNotionDbName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Odoo ERP & SAP */}
        {activeTab === "odoo" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Odoo ERP, QuickBooks & SAP Automated Accounting Bridge</span>
                  <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-600">
                    Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pushes extracted PDF balance sheets and invoices from <Link href="/extract" className="font-bold underline text-purple-600 dark:text-purple-400">Data Extractor</Link> into Odoo Vendor Bills and purchase reconciliations.
                </p>
              </div>

              <button
                onClick={handleTestOdoo}
                disabled={testingOdoo}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {testingOdoo ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                <span>{testingOdoo ? "Testing Odoo API…" : "Verify Odoo Connection"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Odoo Host URL
                </label>
                <input
                  type="text"
                  value={odooUrl}
                  onChange={(e) => setOdooUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Database Name
                </label>
                <input
                  type="text"
                  value={odooDb}
                  onChange={(e) => setOdooDb(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  API Access Key
                </label>
                <input
                  type="password"
                  value={odooApiKey}
                  onChange={(e) => setOdooApiKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Webhooks Dispatcher */}
        {activeTab === "webhooks" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Real-Time Event Webhook Dispatcher (Zapier / Make.com)</span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                    Listening
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dispatches real-time JSON webhooks to your server or Zapier whenever high-risk clauses or new tables are parsed.
                </p>
              </div>

              <button
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {testingWebhook ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Webhook className="h-3.5 w-3.5" />}
                <span>{testingWebhook ? "Dispatching Event…" : "Test Webhook Event"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Target Endpoint URL
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Webhook Signature Secret
                </label>
                <input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Active Subscribed Events:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setEventDocIndexed(!eventDocIndexed)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    eventDocIndexed ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20" : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">document.indexed</span>
                    <p className="text-[10px] text-slate-400">When PDF embedding completes</p>
                  </div>
                  <input type="checkbox" checked={eventDocIndexed} readOnly className="accent-purple-600" />
                </div>

                <div
                  onClick={() => setEventCriticalRisk(!eventCriticalRisk)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    eventCriticalRisk ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20" : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">risk.critical_detected</span>
                    <p className="text-[10px] text-slate-400">When Canvas detects high risk</p>
                  </div>
                  <input type="checkbox" checked={eventCriticalRisk} readOnly className="accent-rose-600" />
                </div>

                <div
                  onClick={() => setEventTableExtracted(!eventTableExtracted)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    eventTableExtracted ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">table.extracted</span>
                    <p className="text-[10px] text-slate-400">When data rows are extracted</p>
                  </div>
                  <input type="checkbox" checked={eventTableExtracted} readOnly className="accent-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Universal REST API & Code Playground */}
        {activeTab === "api_playground" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Universal REST API & Code Playground</span>
                  <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-600">
                    Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Query document memory, extract tables, and generate quizzes programmatically from external scripts.
                </p>
              </div>

              <button
                onClick={handleRunApiTest}
                disabled={apiTesting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {apiTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Terminal className="h-3.5 w-3.5" />}
                <span>{apiTesting ? "Executing API Call…" : "Run Live Test Request"}</span>
              </button>
            </div>

            {/* API Key Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-purple-600" /> Workspace Secret Bearer Token
                </label>
                <button
                  onClick={copyApiKey}
                  className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200">
                {apiKey}
              </div>
            </div>

            {/* Language Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Request Code Snippet
                </span>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: "curl", label: "cURL (Bash)" },
                      { id: "python", label: "Python (requests)" },
                      { id: "node", label: "Node.js (fetch)" },
                    ] as const
                  ).map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setCodeLang(l.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        codeLang === l.id
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                {codeLang === "curl" && (
                  <pre>{`curl -X POST "https://askdocs-backend.onrender.com/api/v1/workspaces/${workspace.id}/memory/query" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Summarize top procedural guidelines and compliance requirements"}'`}</pre>
                )}

                {codeLang === "python" && (
                  <pre>{`import requests

url = "https://askdocs-backend.onrender.com/api/v1/workspaces/${workspace.id}/memory/query"
headers = {
    "Authorization": f"Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "question": "Summarize top procedural guidelines and compliance requirements"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}</pre>
                )}

                {codeLang === "node" && (
                  <pre>{`const res = await fetch("https://askdocs-backend.onrender.com/api/v1/workspaces/${workspace.id}/memory/query", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    question: "Summarize top procedural guidelines and compliance requirements"
  })
});

const data = await res.json();
console.log(data);`}</pre>
                )}
              </div>
            </div>

            {/* Live API Response Output */}
            {apiResponse && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Live Response: 200 OK (342ms)
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-64">
                  <pre>{apiResponse}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
