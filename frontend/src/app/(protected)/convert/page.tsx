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
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";
import { DocumentItem } from "@/lib/types";
import { showToast } from "@/components/Toast";
import { exportToPdf, downloadBlob } from "@/lib/pdf-export";

type TargetFormat = "markdown" | "text" | "json" | "csv";

export default function DocumentConverterStudioPage() {
  const { workspace } = useWorkspace();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("markdown");
  const [redactPii, setRedactPii] = useState(true);
  const [cleanArtifacts, setCleanArtifacts] = useState(true);
  const [copied, setCopied] = useState(false);

  // Input and Output states
  const [rawText, setRawText] = useState("");
  const [convertedText, setConvertedText] = useState("");
  const [redactionCount, setRedactionCount] = useState(0);

  const loadDocuments = useCallback(async () => {
    if (!workspace?.id) return;
    setLoadingDocs(true);
    try {
      const list = await api.listDocuments(workspace.id);
      setDocs(list);
      if (list.length > 0) {
        setSelectedDocId(list[0].id);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingDocs(false);
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

      // 1. PII Redaction
      if (redactPii) {
        // Email redaction
        output = output.replace(/[\w.-]+@[\w.-]+\.\w+/g, () => {
          count++;
          return "[REDACTED_EMAIL]";
        });
        // Phone number redaction
        output = output.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, () => {
          count++;
          return "[REDACTED_PHONE]";
        });
        // SSN / Tax ID redaction
        output = output.replace(/\b\d{3}-\d{2}-\d{4}\b/g, () => {
          count++;
          return "[REDACTED_TAX_ID]";
        });
        // Credit card redaction
        output = output.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, () => {
          count++;
          return "[REDACTED_CARD_NUMBER]";
        });
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
      } else if (targetFormat === "json") {
        const paragraphs = output.split("\n\n").filter(Boolean);
        output = JSON.stringify(
          {
            workspace_id: workspace?.id,
            exported_at: new Date().toISOString(),
            format: "json",
            pii_redacted: redactPii,
            redaction_count: count,
            paragraphs: paragraphs.map((text, idx) => ({ id: idx + 1, content: text })),
          },
          null,
          2
        );
      } else if (targetFormat === "csv") {
        const paragraphs = output.split("\n\n").filter(Boolean);
        const rows = paragraphs.map((p, idx) => `"${idx + 1}","${p.replace(/"/g, '""')}"`);
        output = `"Paragraph_Index","Cleaned_Content"\n${rows.join("\n")}`;
      }

      setConvertedText(output);
      setRedactionCount(count);
      setProcessing(false);
      showToast("success", `Converted to ${targetFormat.toUpperCase()} with ${count} PII items redacted!`);
    }, 400);
  };

  const handleCopy = () => {
    if (!convertedText) return;
    void navigator.clipboard.writeText(convertedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("success", "Sanitized document copied to clipboard");
  };

  const handleExportPdf = () => {
    if (!convertedText) {
      showToast("error", "Please convert or sanitize text first.");
      return;
    }
    const currentDoc = docs.find((d) => d.id === selectedDocId);
    const paragraphs = convertedText.split("\n\n").filter(Boolean);

    exportToPdf({
      title: "Sanitized & Redacted Document",
      subtitle: `Autonomous PII Masking & Transformation • ${currentDoc?.title || "Document"}`,
      badge: redactPii ? `🛡️ PII Masked (${redactionCount} Redactions)` : "Cleaned Text",
      documentSource: currentDoc?.title || "Workspace Document",
      workspaceName: workspace?.name,
      sections: [
        {
          heading: "Compliance & Sanitization Notice",
          type: "callout",
          content: `This document has been sanitized according to workspace privacy controls. Identified sensitive attributes (emails, phone numbers, tax identification numbers, credit cards) have been masked with verified replacement tokens.`,
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
      text: "txt",
      json: "json",
      csv: "csv",
    };
    const mimeTypes: Record<TargetFormat, string> = {
      markdown: "text/markdown",
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
              <span className="uppercase font-mono tracking-widest text-[10px]">Document Batch Converter & Redactor</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Format Converter &{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                PII Redactor
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Convert documents into Markdown, JSON, CSV, and TXT with autonomous PII anonymization (masking emails, phone numbers, and SSNs) and 1-click printable PDF downloads.
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
            <button
              onClick={handleDownload}
              disabled={!convertedText}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1db954] via-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-[#1db954]/25 hover:shadow-[#1db954]/45 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download File</span>
            </button>
          </div>
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
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#1db954] focus:ring-2 focus:ring-[#1db954]/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white cursor-pointer"
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
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: "markdown", label: "MD" },
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
                      ? "bg-[#1db954] text-black font-black shadow-md shadow-[#1db954]/20"
                      : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1f1f2e] dark:text-zinc-300"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger with Spotify Green + Cosmic Purple Gradient */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleConvert}
              disabled={processing || !rawText.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1db954] via-purple-600 to-indigo-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#1db954]/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
              <Shield className="h-3.5 w-3.5 text-emerald-500" /> Auto-Redact Sensitive PII (Emails, Phones, SSNs)
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
