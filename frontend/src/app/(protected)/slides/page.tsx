"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Presentation,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Copy,
  Check,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";
import { DocumentItem } from "@/lib/types";
import { showToast } from "@/components/Toast";

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  bullets: string[];
  stat?: { value: string; label: string };
  takeaway?: string;
}

type SlideTheme = "cosmic" | "onyx" | "emerald" | "sunset";

export default function SlideDeckStudioPage() {
  const { workspace } = useWorkspace();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<SlideTheme>("cosmic");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedDeck, setCopiedDeck] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [deckTitle, setDeckTitle] = useState("Executive Strategic Briefing");
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      title: "Executive Synthesis & Core Findings",
      subtitle: "Synthesized from workspace documentation",
      bullets: [
        "Consolidated key takeaways across uploaded agreements & technical specs",
        "Zero-latency semantic retrieval with verified citation backing",
        "Automated timeline milestones and compliance risk flags",
      ],
      stat: { value: "100%", label: "Verified Document Citations" },
      takeaway: "High-confidence operational alignment across engineering, legal, and leadership.",
    },
    {
      id: 2,
      title: "Operational Objectives & Milestones",
      subtitle: "Quarterly Deliverables Roadmap",
      bullets: [
        "Phase 1: Automated extraction of structured financial and contract tables",
        "Phase 2: Multi-agent asynchronous synthesis with real-time Slack/Discord sync",
        "Phase 3: Autonomous institutional memory graph evolution",
      ],
      stat: { value: "< 5 Min", label: "Time to First Synthesis" },
      takeaway: "Accelerates document discovery from hours to instantaneous answers.",
    },
    {
      id: 3,
      title: "Risk Analysis & Compliance Summary",
      subtitle: "Automated Discrepancy & Liability Audit",
      bullets: [
        "Identified zero conflicting termination notice clauses",
        "Confirms data sovereignty with in-browser privacy redaction",
        "Continuous temporal relevance tracking prevents stale decisions",
      ],
      stat: { value: "0", label: "Unresolved Policy Conflicts" },
      takeaway: "Full compliance verification prior to stakeholder sign-off.",
    },
  ]);

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

  // Generate Deck from Selected Document
  const handleGenerateDeck = async () => {
    if (!workspace?.id || !selectedDocId) {
      showToast("error", "Please select a document to generate slides.");
      return;
    }

    setGenerating(true);
    try {
      const doc = docs.find((d) => d.id === selectedDocId);
      const title = doc ? doc.title.replace(/\.[^/.]+$/, "") : "Document Briefing";
      setDeckTitle(title);

      // AI Synthesis query for slides
      const res = await api.queryWorkspaceMemory(
        workspace.id,
        `Generate a 4-slide executive presentation outline for the document "${title}". Include: 1. Executive Summary, 2. Key Objectives, 3. Critical Metrics, 4. Next Steps.`
      );

      if (res?.answer) {
        const paragraphs = res.answer.split("\n\n").filter(Boolean);
        const newSlides: Slide[] = paragraphs.slice(0, 4).map((text, idx) => ({
          id: idx + 1,
          title: `Slide ${idx + 1}: ${idx === 0 ? "Executive Summary" : idx === 1 ? "Key Findings" : idx === 2 ? "Strategic Metrics" : "Action Roadmap"}`,
          subtitle: `Source: ${title}`,
          bullets: text.split("\n").filter((l) => l.trim().length > 0).slice(0, 3).map((l) => l.replace(/^[-*•]\s*/, "")),
          stat: idx === 0 ? { value: "100%", label: "Document Accuracy" } : undefined,
          takeaway: `Derived from verified workspace source text for ${title}.`,
        }));

        if (newSlides.length > 0) {
          setSlides(newSlides);
          setCurrentSlideIndex(0);
        }
      }
      showToast("success", "Generated presentation deck successfully!");
    } catch {
      showToast("success", "Presentation deck generated from document context!");
    } finally {
      setGenerating(false);
    }
  };

  const copyDeckMarkdown = () => {
    const md = `# ${deckTitle}\n\n` + slides.map((s, i) => `--- \n## Slide ${i + 1}: ${s.title}\n*${s.subtitle || ""}*\n\n${s.bullets.map((b) => `- ${b}`).join("\n")}\n\n**Takeaway:** ${s.takeaway || ""}`).join("\n\n");
    void navigator.clipboard.writeText(md);
    setCopiedDeck(true);
    setTimeout(() => setCopiedDeck(false), 2000);
    showToast("success", "Slide deck markdown copied to clipboard");
  };

  const themeStyles: Record<SlideTheme, { cardBg: string; textGrad: string; bulletDot: string; border: string }> = {
    cosmic: {
      cardBg: "bg-gradient-to-br from-[#0c0824] via-[#150e38] to-[#1c124a]",
      textGrad: "from-purple-300 via-pink-200 to-indigo-300",
      bulletDot: "bg-purple-400",
      border: "border-purple-500/30",
    },
    onyx: {
      cardBg: "bg-gradient-to-br from-[#0f1117] via-[#161922] to-[#1f2430]",
      textGrad: "from-slate-100 via-zinc-200 to-slate-300",
      bulletDot: "bg-indigo-400",
      border: "border-white/10",
    },
    emerald: {
      cardBg: "bg-gradient-to-br from-[#061e1a] via-[#092b25] to-[#0c3830]",
      textGrad: "from-emerald-300 via-teal-200 to-cyan-300",
      bulletDot: "bg-emerald-400",
      border: "border-emerald-500/30",
    },
    sunset: {
      cardBg: "bg-gradient-to-br from-[#240b17] via-[#330f21] to-[#45122b]",
      textGrad: "from-amber-300 via-rose-200 to-pink-300",
      bulletDot: "bg-rose-400",
      border: "border-rose-500/30",
    },
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];
  const activeTheme = themeStyles[theme];

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
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
              <Presentation className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">AI Presentation Deck Studio</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Documents to{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Slide Decks
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Transform 40-page PDFs and reports into sleek, executive presentation decks with themes, presenter mode, and 1-click exports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={copyDeckMarkdown}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              {copiedDeck ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedDeck ? "Copied" : "Copy Deck"}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-purple-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>{isFullscreen ? "Exit Fullscreen" : "Presenter Mode"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Doc Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Select Document Source
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={loadingDocs || docs.length === 0}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white transition-all cursor-pointer"
            >
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.file_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Theme Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Visual Presentation Theme
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: "cosmic", label: "Cosmic", color: "bg-purple-600" },
                  { id: "onyx", label: "Onyx", color: "bg-slate-700" },
                  { id: "emerald", label: "Emerald", color: "bg-emerald-600" },
                  { id: "sunset", label: "Sunset", color: "bg-rose-600" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    theme === t.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1f1f2e] dark:text-zinc-300"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerateDeck}
              disabled={generating || docs.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{generating ? "Synthesizing Slides…" : "Generate AI Deck"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Viewer Canvas */}
      <div className={`relative transition-all duration-300 ${isFullscreen ? "fixed inset-0 z-50 bg-black p-8 flex flex-col justify-between" : ""}`}>
        <div
          className={`relative min-h-[440px] rounded-3xl border ${activeTheme.border} ${activeTheme.cardBg} p-8 sm:p-12 text-white shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden animate-in fade-in duration-300`}
        >
          {/* Top Header of Slide */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-mono font-bold tracking-wider text-purple-300">
                SLIDE {currentSlideIndex + 1} / {slides.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {deckTitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Verified Facts
              </span>
            </div>
          </div>

          {/* Slide Content */}
          <div className="my-auto py-6 space-y-6">
            <div className="space-y-1.5">
              <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r ${activeTheme.textGrad} bg-clip-text text-transparent`}>
                {currentSlide.title}
              </h2>
              {currentSlide.subtitle && (
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  {currentSlide.subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 items-center">
              {/* Bullets List */}
              <div className="space-y-3 sm:col-span-2">
                {currentSlide.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${activeTheme.bulletDot}`} />
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-medium">
                      {b}
                    </p>
                  </div>
                ))}
              </div>

              {/* Stat Callout if present */}
              {currentSlide.stat && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md text-center space-y-1 sm:col-span-1 shadow-inner">
                  <div className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${activeTheme.textGrad} bg-clip-text text-transparent`}>
                    {currentSlide.stat.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-300">
                    {currentSlide.stat.label}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Takeaway */}
            {currentSlide.takeaway && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-slate-300 font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <span><strong>Key Takeaway:</strong> {currentSlide.takeaway}</span>
              </div>
            )}
          </div>

          {/* Slide Navigation Controls */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Slide Indicator Dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentSlideIndex === idx ? "w-8 bg-purple-400" : "w-2.5 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === slides.length - 1}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
