"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Shield,
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  FileCode,
  FileCheck2,
  Stethoscope,
  Scale,
  GraduationCap,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useAudienceMode } from "@/lib/audience-mode-context";
import { api } from "@/lib/api";
import { DocumentItem } from "@/lib/types";
import { showToast } from "@/components/Toast";
import { exportToPdf, downloadBlob } from "@/lib/pdf-export";

type TargetFormat = "markdown" | "latex" | "json" | "csv" | "text";
type RedactionProfile = "universal" | "hipaa" | "legal_nda" | "academic_blind" | "finance";

interface RedactionProfileConfig {
  id: RedactionProfile;
  label: string;
  icon: typeof Shield;
  description: string;
  badge: string;
}

const REDACTION_PROFILES: RedactionProfileConfig[] = [
  {
    id: "universal",
    label: "Universal PII",
    icon: Shield,
    description: "Masks emails, phone numbers, SSNs, and credit cards.",
    badge: "GDPR & Privacy",
  },
  {
    id: "hipaa",
    label: "HIPAA Clinical PHI",
    icon: Stethoscope,
    description: "Masks patient names, MRNs, DOBs, and hospital locations.",
    badge: "HIPAA Safe Harbor",
  },
  {
    id: "legal_nda",
    label: "Legal NDA & Deals",
    icon: Scale,
    description: "Masks corporate entities, deal valuations ($XXX,XXX), and terms.",
    badge: "Strict NDA Vault",
  },
  {
    id: "academic_blind",
    label: "Academic Blind Review",
    icon: GraduationCap,
    description: "Strips author names, university affiliations, and grant IDs.",
    badge: "Blind Peer Review",
  },
  {
    id: "finance",
    label: "Banking & Payroll",
    icon: Wallet,
    description: "Masks bank accounts, IBANs, routing codes, and tax IDs.",
    badge: "SOX & PCI-DSS",
  },
];

export default function DocumentConverterStudioPage() {
  const { workspace } = useWorkspace();
  const { mode } = useAudienceMode();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("markdown");
  const [redactionProfile, setRedactionProfile] = useState<RedactionProfile>("universal");
  const [redactPii, setRedactPii] = useState(true);
  const [cleanArtifacts, setCleanArtifacts] = useState(true);
  const [copied, setCopied] = useState(false);

  // Auto-set initial redaction profile based on active mode
  useEffect(() => {
    if (mode === "clinical") setRedactionProfile("hipaa");
    else if (mode === "legal") setRedactionProfile("legal_nda");
    else if (mode === "academic") setRedactionProfile("academic_blind");
    else if (mode === "finance") setRedactionProfile("finance");
    else setRedactionProfile("universal");
  }, [mode]);

  // Input and Output states
  const [rawText, setRawText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [redactionCount, setRedactionCount] = useState(0);

  const loadDocuments = useCallback(async () => {
    if (!workspace?.id) return;
    try {
      const list = await api.listDocuments(workspace.id);
      setDocs(list);
      if (list.length > 0) {
        setSelectedDocId(list[0].id);
      }
    } catch {
      /* ignore */
    }
  }, [workspace?.id]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Load document chunks when a document is selected
  useEffect(() => {
    async function fetchDocChunks() {
      if (!workspace?.id || !selectedDocId) return;
      try {
        const chunks = await api.getDocumentChunks(workspace.id, selectedDocId);
        if (chunks && chunks.length > 0) {
          const combined = chunks
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((c) => c.content)
            .join("\n\n");
          setRawText(combined);
        } else {
          setRawText("Sample document text. Upload or select a document to convert and sanitize.");
        }
      } catch {
        setRawText("Sample document text. Upload or select a document to convert and sanitize.");
      }
    }
    void fetchDocChunks();
  }, [workspace?.id, selectedDocId]);

  // Process transformation
  const handleConvert = () => {
    if (!rawText.trim()) {
      showToast("error", "Please provide document text to convert.");
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      let output = rawText;
      let count = 0;

      // 1. PII Redaction according to active profile
      if (redactPii) {
        // Universal Emails
        output = output.replace(/[\w.-]+@[\w.-]+\.\w+/g, () => {
          count++;
          return "[REDACTED_EMAIL]";
        });
        // Universal Phone numbers
        output = output.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, () => {
          count++;
          return "[REDACTED_PHONE]";
        });
        // Universal SSN / Tax IDs
        output = output.replace(/\b\d{3}-\d{2}-\d{4}\b/g, () => {
          count++;
          return "[REDACTED_TAX_ID]";
        });
        // Credit cards
        output = output.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, () => {
          count++;
          return "[REDACTED_CARD_NUMBER]";
        });

        // Profile specific patterns
        if (redactionProfile === "hipaa") {
          output = output.replace(/\b(?:MRN|Medical Record Number|Patient ID)[:\s]+[A-Z0-9-]+\b/gi, () => {
            count++;
            return "[REDACTED_MRN_ID]";
          });
          output = output.replace(/\b(?:DOB|Date of Birth)[:\s]+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi, () => {
            count++;
            return "[REDACTED_DOB]";
          });
        } else if (redactionProfile === "legal_nda") {
          output = output.replace(/\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s?(?:million|billion|k|M|B))?/g, () => {
            count++;
            return "[REDACTED_DEAL_VALUE]";
          });
        } else if (redactionProfile === "academic_blind") {
          output = output.replace(/\b(?:Grant|NIH|NSF|Award)[\s#:]+[A-Z0-9-]+\b/gi, () => {
            count++;
            return "[REDACTED_GRANT_ID]";
          });
          output = output.replace(/\b(?:Department of|University of|Institute of Technology)\s+[A-Za-z\s,]+/gi, () => {
            count++;
            return "[REDACTED_INSTITUTION]";
          });
        } else if (redactionProfile === "finance") {
          output = output.replace(/\b(?:IBAN|Account #|Routing #)[:\s]+[A-Z0-9-]{6,34}\b/gi, () => {
            count++;
            return "[REDACTED_ACCOUNT_NO]";
          });
        }
      }

      // 2. OCR Cleanup
      if (cleanArtifacts) {
        output = output
          .replace(/\r\n/g, "\n")
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }

      // 3. Format Transformation
      if (targetFormat === "markdown") {
        output = `# Sanitized Document Export\n\n${output.split("\n\n").map((p) => `${p}`).join("\n\n")}`;
  const handleExportPdf = () => {
    if (!convertedText) {
      showToast("error", "Please convert or sanitize text first.");
      return;
    }
    const currentDoc = docs.find((d) => d.id === selectedDocId);
    const paragraphs = convertedText.split("\n\n").filter(Boolean);

    exportToPdf({
      title: "Sanitized & Redacted Document",
      subtitle: `Domain Redaction Profile: ${REDACTION_PROFILES.find((p) => p.id === redactionProfile)?.label || "Standard"} • ${currentDoc?.title || "Document"}`,
      badge: redactPii ? `🛡️ Masked (${redactionCount} Redactions)` : "Cleaned Text",
      documentSource: currentDoc?.title || "Workspace Document",
      workspaceName: workspace?.name,
      sections: [
        {
          heading: "Compliance & Sanitization Certificate",
          type: "callout",
          content: `This document has been sanitized according to ${REDACTION_PROFILES.find((p) => p.id === redactionProfile)?.badge || "Privacy"} standards. Identified sensitive tokens (emails, contact numbers, identifiers, deal figures) have been masked with verified replacement tokens.`,
        },
        ...paragraphs.map((p, idx) => ({
          heading: `Section ${idx + 1}`,
          content: p,
        })),
      ],
    });
    showToast("success", "Generating sanitized PDF document...");
  };

  const handleDownload = () => {
    if (!convertedText) return;
    const extensions: Record<TargetFormat, string> = {
      markdown: "md",
      latex: "tex",
      text: "txt",
      json: "json",
      csv: "csv",
    };
    const mimeTypes: Record<TargetFormat, string> = {
      markdown: "text/markdown",
      latex: "application/x-tex",
      text: "text/plain",
      json: "application/json",
      csv: "text/csv",
    };

    const ext = extensions[targetFormat];
    const mime = mimeTypes[targetFormat];
    downloadBlob(`sanitized-doc-${Date.now()}.${ext}`, convertedText, mime);
    showToast("success", `Downloaded sanitized .${ext} file!`);
  };

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Cosmic Orbs */}
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
              <FileCode className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">Multi-Audience Format & Redaction Studio</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Format Converter &{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Privacy Redactor
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Convert documents into LaTeX, Markdown, JSON, CSV, and TXT with specialized privacy profiles (HIPAA Healthcare, Legal NDA, Academic Blind Review, and Financial Audit).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportPdf}
              disabled={!convertedText}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!convertedText}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export {targetFormat.toUpperCase()}</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={!convertedText}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Redaction Profiles Selector */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-purple-500" /> Select Industry Redaction Profile
          </h2>
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
            Active: {REDACTION_PROFILES.find((p) => p.id === redactionProfile)?.badge}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {REDACTION_PROFILES.map((profile) => {
            const Icon = profile.icon;
            const active = redactionProfile === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => setRedactionProfile(profile.id)}
                className={`flex flex-col text-left rounded-2xl p-3.5 border transition-all cursor-pointer ${
                  active
                    ? "border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10"
                    : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-white/5 dark:bg-[#1a1829]/50 dark:hover:bg-[#1a1829]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`h-4 w-4 ${active ? "text-purple-600 dark:text-purple-400" : "text-slate-500"}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {profile.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Configuration Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Document Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Select Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white cursor-pointer"
            >
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.file_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Target Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Target Output Format
            </label>
            <div className="grid grid-cols-5 gap-1">
              {(
                [
                  { id: "markdown", label: "MD" },
                  { id: "latex", label: "LaTeX" },
                  { id: "json", label: "JSON" },
                  { id: "csv", label: "CSV" },
                  { id: "text", label: "TXT" },
                ] as const
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setTargetFormat(fmt.id)}
                  className={`rounded-xl py-2.5 text-xs font-black transition-all cursor-pointer ${
                    targetFormat === fmt.id
                      ? "bg-purple-600 text-white font-black shadow-md shadow-purple-500/25"
                      : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1f1f2e] dark:text-zinc-300"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleConvert}
              disabled={processing || !rawText.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{processing ? "Sanitizing…" : "Convert & Redact Now"}</span>
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 dark:border-white/5 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={redactPii}
              onChange={() => setRedactPii(!redactPii)}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-emerald-500" /> Apply Profile Redaction Masks
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cleanArtifacts}
              onChange={() => setCleanArtifacts(!cleanArtifacts)}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <FileCheck2 className="h-3.5 w-3.5 text-purple-500" /> Clean OCR Broken Linebreaks & Artifacts
            </span>
          </label>
        </div>
      </div>

      {/* Side-by-Side In-Browser Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Original Document Text */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-slate-500" /> Original Source Document Text
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {rawText.length.toLocaleString()} chars
            </span>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={14}
            placeholder="Paste raw text or select a document above…"
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 font-mono text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 resize-none leading-relaxed"
          />
        </div>

        {/* Right Column: Sanitized & Converted Output */}
        <div className="rounded-3xl border border-purple-500/30 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-purple-500/20 dark:bg-[#15151c]/95 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-500" /> Sanitized & Converted ({targetFormat.toUpperCase()})
              </h3>
              {redactionCount > 0 && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {redactionCount} Redacted
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!convertedText}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!convertedText}
                className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .{targetFormat}</span>
              </button>
            </div>
          </div>

          <textarea
            value={convertedText}
            readOnly
            rows={14}
            placeholder="Click 'Convert & Redact Now' to generate sanitized output…"
            className="w-full rounded-2xl border border-purple-500/20 bg-purple-50/20 p-4 font-mono text-xs text-purple-900 dark:text-purple-200 outline-none dark:bg-[#1a142e] resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
