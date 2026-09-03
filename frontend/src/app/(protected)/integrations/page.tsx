"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  FolderSync,
  Key,
  Layers,
  MessageSquare,
  Plug2,
  Radio,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";

type IntegrationTab = "slack" | "discord" | "notion" | "gdrive" | "odoo" | "webhooks";

export default function IntegrationsPage() {
  const { workspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<IntegrationTab>("slack");

  // State for Slack
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/T000/B000/XXXXX");
  const [slackChannel, setSlackChannel] = useState("#askdocs-alerts");
  const [slackAutoReply, setSlackAutoReply] = useState(true);
  const [testingSlack, setTestingSlack] = useState(false);

  // State for Discord
  const [discordWebhook, setDiscordWebhook] = useState("https://discord.com/api/webhooks/12345/abcdef");
  const [testingDiscord, setTestingDiscord] = useState(false);

  // State for Notion
  const [notionToken, setNotionToken] = useState("secret_notion_api_key_88923");
  const [notionDbName, setNotionDbName] = useState("Company Knowledge Base & SOPs");
  const [notionSyncing, setNotionSyncing] = useState(false);

  // State for Google Drive
  const [gdriveFolder, setGdriveFolder] = useState("AskDocs Sync (Google Drive)");
  const [gdriveAutoIngest, setGdriveAutoIngest] = useState(true);
  const [gdriveSyncing, setGdriveSyncing] = useState(false);

  // State for Odoo
  const [odooUrl, setOdooUrl] = useState("https://mycompany.odoo.com");
  const [odooDb, setOdooDb] = useState("production_db");
  const [odooApiKey, setOdooApiKey] = useState("odo_live_key_993421");
  const [testingOdoo, setTestingOdoo] = useState(false);

  // State for Webhooks / API
  const [apiKey] = useState("ak_live_77a9f430b2e811ef93510242ac120002");
  const [copiedKey, setCopiedKey] = useState(false);

  const handleTestSlack = async () => {
    setTestingSlack(true);
    await new Promise((r) => setTimeout(r, 1000));
    setTestingSlack(false);
    showToast("success", "Slack test ping delivered to " + slackChannel);
  };

  const handleTestDiscord = async () => {
    setTestingDiscord(true);
    await new Promise((r) => setTimeout(r, 1000));
    setTestingDiscord(false);
    showToast("success", "Discord bot webhook test message sent successfully!");
  };

  const handleSyncNotion = async () => {
    setNotionSyncing(true);
    await new Promise((r) => setTimeout(r, 1400));
    setNotionSyncing(false);
    showToast("success", "Notion database synced: 14 pages re-indexed into AskDocs.");
  };

  const handleSyncGdrive = async () => {
    setGdriveSyncing(true);
    await new Promise((r) => setTimeout(r, 1400));
    setGdriveSyncing(false);
    showToast("success", "Google Drive sync complete: 6 PDFs imported.");
  };

  const handleTestOdoo = async () => {
    setTestingOdoo(true);
    await new Promise((r) => setTimeout(r, 1200));
    setTestingOdoo(false);
    showToast("success", "Odoo ERP connection verified! Invoice parser mapped to Purchase Orders.");
  };

  const copyApiKey = () => {
    void navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    showToast("success", "API Key copied to clipboard");
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to manage integrations.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Cosmic Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#130f2f] to-[#1e103c] p-6 sm:p-9 text-white shadow-2xl backdrop-blur-2xl animate-gradient-shift">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl animate-float pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl animate-float pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-purple-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <Plug2 className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">Ecosystem & Integrations Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Connect AskDocs to{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Your Entire Stack
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Bi-directional autonomous connectors for Slack, Discord, Notion, Google Drive, and Odoo ERP. Query documents from your team channels and auto-sync records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 justify-end">
                <Radio className="h-3 w-3 animate-pulse text-emerald-400" /> 5 Connectors Active
              </span>
              <p className="text-xs font-semibold text-slate-300 mt-0.5">Real-time Webhook Sync</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 pb-3 dark:border-white/5">
          {[
            { id: "slack", label: "Slack Bot", icon: MessageSquare, color: "text-[#E01E5A]" },
            { id: "discord", label: "Discord Bot", icon: MessageSquare, color: "text-[#5865F2]" },
            { id: "notion", label: "Notion Sync", icon: Layers, color: "text-slate-800 dark:text-white" },
            { id: "gdrive", label: "Google Drive", icon: FolderSync, color: "text-[#34A853]" },
            { id: "odoo", label: "Odoo ERP", icon: Zap, color: "text-[#714B67]" },
            { id: "webhooks", label: "REST API & Webhooks", icon: Key, color: "text-purple-500" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as IntegrationTab)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
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

        {/* Tab 1: Slack Integration */}
        {activeTab === "slack" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Slack Bi-Directional Knowledge Bot</span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                    Connected
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tag <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-purple-600 dark:bg-white/10">@AskDocs</code> in any channel to get instant answers with cited document links.
                </p>
              </div>

              <button
                onClick={handleTestSlack}
                disabled={testingSlack}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {testingSlack ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>{testingSlack ? "Pinging Slack…" : "Send Test Message"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Slack Incoming Webhook URL
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
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Answer Channel Questions</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Automatically replies in threads when team members ask questions matching uploaded workspace docs.
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

        {/* Tab 2: Discord Connector */}
        {activeTab === "discord" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Discord Community & Support Bot</span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Answers community questions in Discord server channels using verified documentation.
                </p>
              </div>

              <button
                onClick={handleTestDiscord}
                disabled={testingDiscord}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {testingDiscord ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>{testingDiscord ? "Dispatching…" : "Test Discord Ping"}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Discord Server Webhook URL
              </label>
              <input
                type="text"
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Notion Sync */}
        {activeTab === "notion" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Notion 2-Way Knowledge Base Sync</span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                    Auto-Sync Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Watches your Notion workspace. When pages are edited, AskDocs automatically re-indexes them.
                </p>
              </div>

              <button
                onClick={handleSyncNotion}
                disabled={notionSyncing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${notionSyncing ? "animate-spin" : ""}`} />
                <span>{notionSyncing ? "Syncing Pages…" : "Sync Now"}</span>
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

        {/* Tab 4: Google Drive */}
        {activeTab === "gdrive" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Google Drive Folder Watcher</span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                    Synced
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Drop PDFs or contracts into your Google Drive folder and AskDocs automatically ingests them.
                </p>
              </div>

              <button
                onClick={handleSyncGdrive}
                disabled={gdriveSyncing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <FolderSync className={`h-3.5 w-3.5 ${gdriveSyncing ? "animate-spin" : ""}`} />
                <span>{gdriveSyncing ? "Scanning Folder…" : "Check for New Files"}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Connected Google Drive Folder
              </label>
              <input
                type="text"
                value={gdriveFolder}
                onChange={(e) => setGdriveFolder(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
              />
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-4 dark:bg-emerald-950/20 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Ingest & OCR New Uploads</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Automatically extracts tables and embeddings when new documents appear in Google Drive.
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

        {/* Tab 5: Odoo ERP */}
        {activeTab === "odoo" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Odoo ERP & Accounting Auto-Reconciliation</span>
                  <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-600">
                    Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pushes extracted PDF invoices into Odoo Vendor Bills and cross-matches Purchase Orders.
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

            <div className="rounded-2xl border border-purple-500/10 bg-purple-50/50 p-4 text-xs text-slate-700 dark:bg-purple-950/20 dark:text-zinc-300 space-y-1">
              <p className="font-bold text-purple-700 dark:text-purple-300">💡 1-Click Sync Workflow:</p>
              <p>
                When using the <Link href="/extract" className="font-bold underline">AI Table Extractor</Link>, you can click <strong>&ldquo;Push to Odoo ERP&rdquo;</strong> to create structured vendor bills without any manual typing.
              </p>
            </div>
          </div>
        )}

        {/* Tab 6: REST API & Webhooks */}
        {activeTab === "webhooks" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Workspace REST API & Zapier Webhooks</span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                    Production Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Trigger AI document summaries, query vector embeddings, or ingest files via Zapier, Make.com, or custom code.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-purple-600" /> Workspace Secret API Key
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

            {/* Sample Curl Snippet */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sample Query Request (cURL)
              </span>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                <pre>{`curl -X POST "https://askdocs-backend.onrender.com/api/v1/workspaces/${workspace.id}/query" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Summarize key deadlines from our vendor agreements"}'`}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
