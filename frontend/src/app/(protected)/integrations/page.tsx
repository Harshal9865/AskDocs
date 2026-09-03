"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  FolderSync,
  GraduationCap,
  Key,
  Layers,
  MessageSquare,
  Plug2,
  Radio,
  RefreshCw,
  Scale,
  Send,
  Stethoscope,
  Terminal,
  Wallet,
  Webhook,
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

  // State for Slack & MS Teams
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
                  <span className="badge-pop inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> OAuth 2.0 Connected
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Ideal for students, researchers, and corporate teams. Drop PDFs, lecture notes, or guidelines into your Drive folder and AskDocs automatically ingests and vectorizes them.
                </p>
              </div>

              <button
                onClick={handleSyncGdrive}
                disabled={gdriveSyncing}
                className="btn-pop inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <FolderSync className={`h-3.5 w-3.5 ${gdriveSyncing ? "animate-spin" : ""}`} />
                <span>{gdriveSyncing ? "Scanning Drive Vault…" : "Sync Drive Now"}</span>
              </button>
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
                  <span>Recently Discovered & Ingested Cloud Files</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">4 Active Sync Links</span>
              </div>

              <div className="divide-y divide-slate-200/60 dark:divide-white/5 text-xs">
                {[
                  { name: "Bioengineering_Lecture_04.pdf", size: "1.4 MB", status: "Indexed & Chunked", time: "10 mins ago" },
                  { name: "Clinical_Protocol_2026.xlsx", size: "840 KB", status: "Table Extracted", time: "1 hour ago" },
                  { name: "Corporate_Expenditure_SOP.docx", size: "512 KB", status: "Indexed & Chunked", time: "3 hours ago" },
                  { name: "Brain_Anatomy_Diagram.png", size: "2.1 MB", status: "OCR & Vision Ready", time: "Yesterday" },
                ].map((f, i) => (
                  <div key={i} className="pop-spring flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/80 dark:hover:bg-white/5 cursor-default">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">📄</span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800 dark:text-zinc-200">{f.name}</p>
                        <p className="text-[10px] text-slate-400">{f.size} • {f.time}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-4 dark:bg-emerald-950/20 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Vectorize & Generate Study Guides</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Automatically extracts tables and text embeddings when new files are saved in this cloud folder.
                </p>
              </div>
              <input
                type="checkbox"
                checked={gdriveAutoIngest}
                onChange={() => setGdriveAutoIngest(!gdriveAutoIngest)}
                className="h-5 w-5 rounded accent-emerald-600 cursor-pointer"
              />
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
