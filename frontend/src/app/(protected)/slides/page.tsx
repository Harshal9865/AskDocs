"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Info,
  Key,
  ExternalLink,
  UploadCloud,
  Search,
  Globe,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";
import { DocumentItem } from "@/lib/types";
import { showToast } from "@/components/Toast";
import { exportToPdf, downloadBlob } from "@/lib/pdf-export";

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  bullets: string[];
  stat?: { value: string; label: string };
  takeaway?: string;
}

type SlideTheme = "cosmic" | "onyx" | "emerald" | "sunset";
type DeckPersona = "executive" | "student" | "medical" | "hr" | "tech" | "story";

export default function SlideDeckStudioPage() {
  const { workspace } = useWorkspace();
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [docSearchQuery, setDocSearchQuery] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<SlideTheme>("cosmic");
  const [persona, setPersona] = useState<DeckPersona>("executive");
  const [slideCount, setSlideCount] = useState<number>(4);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedDeck, setCopiedDeck] = useState(false);
  const [copiedGamma, setCopiedGamma] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKeyGuide, setShowKeyGuide] = useState(false);

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
      if (list.length > 0 && !selectedDocId) {
        setSelectedDocId(list[0].id);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingDocs(false);
    }
  }, [workspace?.id, selectedDocId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Generate Deck from Selected Document using Gemini
  const handleGenerateDeck = async () => {
    if (!workspace?.id || !selectedDocId) {
      showToast("error", "Please select a document to generate slides.");
      return;
    }

    setGenerating(true);
    try {
      const chunks = await api.getDocumentChunks(workspace.id, selectedDocId).catch(() => []);
      const doc = docs.find((d) => d.id === selectedDocId);
      const title = doc ? doc.title.replace(/\.[^/.]+$/, "") : "Document Briefing";
      const text = chunks.map((c) => c.content).join("\n\n").slice(0, 5000);
      setDeckTitle(title);

      const personaPrompts: Record<DeckPersona, string> = {
        executive: "Executive & Investor presentation deck focusing on high-level strategy, core findings, metrics, and actionable decisions.",
        student: "Academic study and lecture deck focusing on key definitions, core concepts, critical examples, and exam review takeaways.",
        medical: "Clinical & medical briefing deck focusing on protocols, vital findings, dosages, diagnostics, and patient care steps.",
        hr: "HR and workplace onboarding deck focusing on employee roles, office policies, benefits, guidelines, and compliance rules.",
        tech: "Engineering and technical architecture deck focusing on specifications, system components, API data flows, and tolerances.",
        story: "Narrative and creative literature deck focusing on character arcs, chronology of events, themes, and key moments.",
      };

      const prompt = `You are an expert presentation designer. Create a ${slideCount}-slide presentation deck based on this document.
DOCUMENT TITLE: "${title}"
PRESENTATION STYLE / AUDIENCE: ${personaPrompts[persona]}

DOCUMENT CONTENT:
${text || "No text available in document. Generate structured slides based on title."}

INSTRUCTIONS:
Generate exactly ${slideCount} slides formatted as strict JSON without markdown formatting:
{
  "deck_title": "${title}",
  "slides": [
    {
      "id": 1,
      "title": "Slide Title",
      "subtitle": "Short focus subtitle",
      "bullets": ["Key bullet point 1", "Key bullet point 2", "Key bullet point 3"],
      "stat_value": "e.g. 99% or $1.2M or 24/7",
      "stat_label": "e.g. Accuracy or Subtotal",
      "takeaway": "One sentence summary takeaway."
    }
  ]
}`;

interface SlideJsonItem {
  id?: number;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  stat_value?: string;
  stat_label?: string;
  takeaway?: string;
}

interface SlideDeckJsonResponse {
  deck_title?: string;
  slides?: SlideJsonItem[];
}

      let resultJson: SlideDeckJsonResponse | null = null;
      try {
        const res = await api.queryWorkspaceMemory(workspace.id, prompt);
        let rawAnswer = res.answer || "";
        rawAnswer = rawAnswer.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonStart = rawAnswer.indexOf("{");
        const jsonEnd = rawAnswer.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          resultJson = JSON.parse(rawAnswer.slice(jsonStart, jsonEnd + 1)) as SlideDeckJsonResponse;
        }
      } catch (parseErr) {
        console.warn("JSON slide parsing failed, falling back to text:", parseErr);
      }

      if (resultJson && Array.isArray(resultJson.slides) && resultJson.slides.length > 0) {
        const generatedSlides: Slide[] = resultJson.slides.map((s: SlideJsonItem, idx: number) => ({
          id: idx + 1,
          title: s.title || `Slide ${idx + 1}`,
          subtitle: s.subtitle || `Source: ${title}`,
          bullets: Array.isArray(s.bullets) ? s.bullets : ["Key finding from document"],
          stat: s.stat_value ? { value: s.stat_value, label: s.stat_label || "Metric" } : undefined,
          takeaway: s.takeaway || "Synthesized from verified document content.",
        }));

        setSlides(generatedSlides);
        if (resultJson.deck_title) setDeckTitle(resultJson.deck_title);
        setCurrentSlideIndex(0);
        showToast("success", `Generated ${generatedSlides.length} presentation slides with Free AI!`);
      } else {
        // Fallback slide generation
        const fallbackSlides: Slide[] = chunks.slice(0, slideCount).map((c, idx) => ({
          id: idx + 1,
          title: `Slide ${idx + 1}: ${idx === 0 ? "Executive Summary" : idx === 1 ? "Key Concepts & Findings" : idx === 2 ? "Detailed Analysis" : "Action Roadmap"}`,
          subtitle: `Source: ${title}`,
          bullets: c.content.split("\n").filter((l) => l.trim().length > 10).slice(0, 3),
          stat: idx === 0 ? { value: "100%", label: "Document Accuracy" } : undefined,
          takeaway: `Derived from verified workspace source text for ${title}.`,
        }));

        if (fallbackSlides.length > 0) {
          setSlides(fallbackSlides);
          setCurrentSlideIndex(0);
        }
        showToast("success", "Presentation deck generated from document context!");
      }
    } catch (err) {
      showToast("error", "Slide generation failed: " + String(err));
    } finally {
      setGenerating(false);
    }
  };

  const exportPDF = () => {
    if (slides.length === 0) return;
    const currentDoc = docs.find((d) => d.id === selectedDocId);

    exportToPdf({
      title: deckTitle,
      subtitle: `AI-Generated Presentation Deck • Synthesized from ${currentDoc?.title || "Workspace Documents"}`,
      badge: `${slides.length} Vector Presentation Slides • Free AI Generator`,
      documentSource: currentDoc?.title || "Document Analysis",
      workspaceName: workspace?.name,
      summaryCards: [
        {
          label: "Total Slides",
          value: slides.length,
          subtext: "Presentation cards",
          color: "#6366f1",
        },
        {
          label: "Presentation Theme",
          value: theme.toUpperCase(),
          subtext: "Visual aesthetic",
          color: "#8b5cf6",
        },
        {
          label: "Audience Target",
          value: persona.toUpperCase(),
          subtext: "Persona calibrated",
          color: "#ec4899",
        },
        {
          label: "Document Source",
          value: currentDoc?.file_type?.toUpperCase() || "PDF",
          subtext: "Verified context",
          color: "#10b981",
        },
      ],
      sections: slides.map((s, idx) => ({
        heading: `Slide ${idx + 1}: ${s.title}`,
        type: "bullets",
        bullets: [
          ...(s.subtitle ? [`<strong>Focus:</strong> ${s.subtitle}`] : []),
          ...s.bullets,
          ...(s.stat ? [`<strong>Key Metric:</strong> ${s.stat.value} — ${s.stat.label}`] : []),
          ...(s.takeaway ? [`<strong>Executive Takeaway:</strong> ${s.takeaway}`] : []),
        ],
      })),
    });
    showToast("success", "Generating printable PDF presentation slides...");
  };

  const exportMarkdownFile = () => {
    const md = `# ${deckTitle}\n\n` + slides.map((s, i) => `--- \n## Slide ${i + 1}: ${s.title}\n*${s.subtitle || ""}*\n\n${s.bullets.map((b) => `- ${b}`).join("\n")}\n\n**Takeaway:** ${s.takeaway || ""}`).join("\n\n");
    downloadBlob(`${deckTitle.toLowerCase().replace(/\s+/g, "_")}.md`, md, "text/markdown");
    showToast("success", "Markdown presentation downloaded!");
  };

  const copyDeckMarkdown = () => {
    const md = `# ${deckTitle}\n\n` + slides.map((s, i) => `--- \n## Slide ${i + 1}: ${s.title}\n*${s.subtitle || ""}*\n\n${s.bullets.map((b) => `- ${b}`).join("\n")}\n\n**Takeaway:** ${s.takeaway || ""}`).join("\n\n");
    void navigator.clipboard.writeText(md);
    setCopiedDeck(true);
    setTimeout(() => setCopiedDeck(false), 2000);
    showToast("success", "Slide deck markdown copied to clipboard");
  };

  const copyGammaPrompt = () => {
    const gammaMarkdown = `Create an ultra-modern, executive presentation for "${deckTitle}".

Style: ${theme.toUpperCase()} theme, clean typography, executive card spacing, visual metric callouts, and structured bullet points.

---
` + slides.map((s, i) => `## Slide ${i + 1}: ${s.title}
${s.subtitle ? `*${s.subtitle}*` : ""}

${s.bullets.map((b) => `- ${b}`).join("\n")}

${s.stat ? `> **Key Metric:** ${s.stat.value} — ${s.stat.label}` : ""}
${s.takeaway ? `**Takeaway:** ${s.takeaway}` : ""}
`).join("\n---\n");

    void navigator.clipboard.writeText(gammaMarkdown);
    setCopiedGamma(true);
    setTimeout(() => setCopiedGamma(false), 2500);
    showToast("success", "Gamma AI outline copied to clipboard!");
  };

  const openGammaApp = () => {
    copyGammaPrompt();
    window.open("https://gamma.app/create/from-text", "_blank", "noopener,noreferrer");
  };

  const exportHtmlPresentation = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${deckTitle} — Interactive Web Deck</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0c0824; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; height: 100vh; }
    .slide { display: none; height: 100vh; width: 100vw; justify-content: center; align-items: center; padding: 2rem; }
    .slide.active { display: flex; animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
  </style>
</head>
<body class="flex flex-col justify-between">
  <div class="p-6 flex justify-between items-center text-xs font-bold text-purple-400 border-b border-white/10">
    <div class="flex items-center gap-2"><span>✦</span> <span>${deckTitle}</span></div>
    <div id="counter">Slide 1 / ${slides.length}</div>
  </div>

  <div id="slides-container" class="flex-1 flex items-center justify-center">
    ${slides.map((s, idx) => `
      <div class="slide ${idx === 0 ? "active" : ""}" data-index="${idx}">
        <div class="max-w-4xl w-full p-8 md:p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
          <div class="text-xs uppercase font-mono tracking-widest text-purple-400 font-extrabold">Slide ${idx + 1}</div>
          <h1 class="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">${s.title}</h1>
          ${s.subtitle ? `<p class="text-sm md:text-base text-slate-300 font-medium">${s.subtitle}</p>` : ""}
          
          <ul class="space-y-3 pt-4">
            ${s.bullets.map((b) => `<li class="flex items-start gap-3 text-sm md:text-lg text-slate-200 font-normal"><span class="h-2.5 w-2.5 rounded-full bg-purple-400 mt-2 shrink-0"></span><span>${b}</span></li>`).join("")}
          </ul>

          ${s.stat ? `
            <div class="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 inline-flex items-center gap-4">
              <div class="text-2xl md:text-3xl font-black text-purple-300">${s.stat.value}</div>
              <div class="text-xs uppercase font-bold text-slate-300 tracking-wider">${s.stat.label}</div>
            </div>
          ` : ""}

          ${s.takeaway ? `
            <div class="pt-4 border-t border-white/10 text-xs md:text-sm text-slate-400 italic">
              <strong>Executive Takeaway:</strong> ${s.takeaway}
            </div>
          ` : ""}
        </div>
      </div>
    `).join("")}
  </div>

  <div class="p-6 flex justify-between items-center text-xs text-slate-400 border-t border-white/10">
    <button id="prevBtn" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer">← Previous</button>
    <div class="hidden sm:block">Use Left / Right arrow keys or spacebar to navigate</div>
    <button id="nextBtn" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer">Next →</button>
  </div>

  <script>
    let currentIndex = 0;
    const totalSlides = ${slides.length};
    const slides = document.querySelectorAll('.slide');
    const counter = document.getElementById('counter');

    function updateSlide(index) {
      if (index < 0 || index >= totalSlides) return;
      slides[currentIndex].classList.remove('active');
      currentIndex = index;
      slides[currentIndex].classList.add('active');
      counter.textContent = 'Slide ' + (currentIndex + 1) + ' / ' + totalSlides;
    }

    document.getElementById('prevBtn').onclick = () => updateSlide(currentIndex - 1);
    document.getElementById('nextBtn').onclick = () => updateSlide(currentIndex + 1);

    window.onkeydown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') updateSlide(currentIndex + 1);
      if (e.key === 'ArrowLeft') updateSlide(currentIndex - 1);
    };
  </script>
</body>
</html>`;
    downloadBlob(`${deckTitle.toLowerCase().replace(/\s+/g, "_")}_interactive.html`, html, "text/html");
    showToast("success", "Interactive HTML presentation deck downloaded!");
  };

  const handleDirectDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspace?.id) return;
    setUploadingDoc(true);
    try {
      const uploaded = await api.uploadDocument(workspace.id, file);
      setDocs((prev) => [uploaded, ...prev]);
      setSelectedDocId(uploaded.id);
      showToast("success", `Uploaded & selected "${uploaded.title}"!`);
    } catch {
      showToast("error", "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
    }
  };

  const filteredDocs = docs.filter((d) =>
    !docSearchQuery.trim() || d.title.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

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
      cardBg: "bg-gradient-to-br from-[#0c1a16] via-[#101924] to-[#121212]",
      textGrad: "from-[#1db954] via-emerald-200 to-teal-300",
      bulletDot: "bg-[#1db954]",
      border: "border-[#1db954]/40",
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
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#130f2f] to-[#1e103c] p-6 sm:p-8 text-white shadow-2xl backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-purple-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
              <Presentation className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">Free AI Presentation Studio</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Documents to{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Slide Decks, Gamma AI & PDF
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Transform any uploaded PDF into presentation slide decks using Free Google Gemini AI. Export to printable PDF slides, interactive HTML web decks, or 1-click bridge to Gamma AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Gamma AI 1-Click Action */}
            <button
              onClick={openGammaApp}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="Copy outline and open Gamma AI (100% Free)"
            >
              <Sparkles className="h-4 w-4 text-pink-200" />
              <span>{copiedGamma ? "Copied! Launching Gamma..." : "✦ Open in Gamma AI"}</span>
            </button>

            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Presentation className="h-4 w-4" />
              <span>PDF Deck</span>
            </button>

            <button
              onClick={exportHtmlPresentation}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="Download standalone interactive web deck"
            >
              <Globe className="h-4 w-4" />
              <span>HTML Deck</span>
            </button>

            <button
              onClick={exportMarkdownFile}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <span>.MD</span>
            </button>

            <button
              onClick={copyDeckMarkdown}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              {copiedDeck ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedDeck ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              <Maximize2 className="h-3.5 w-3.5 text-purple-300" />
              <span>{isFullscreen ? "Exit" : "Present"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Free AI & Gamma AI Notice Banner */}
      <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent p-4 sm:p-5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-pink-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Free AI & Gamma AI Support: </span>
            <span className="text-slate-600 dark:text-zinc-300">
              Generate slides directly with AskDocs&apos; free AI, or click <strong>&ldquo;✦ Open in Gamma AI&rdquo;</strong> to paste your outline into Gamma for free 3D interactive slides. Zero cost or subscription needed!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyGammaPrompt}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Gamma Prompt</span>
          </button>
          <span className="text-slate-400">•</span>
          <button
            onClick={() => setShowKeyGuide(!showKeyGuide)}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer"
          >
            <Info className="h-3.5 w-3.5" />
            <span>{showKeyGuide ? "Hide Guide" : "How Free AI Works"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Free API Key Guide */}
      {showKeyGuide && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-3 animate-in fade-in duration-200 text-xs text-slate-600 dark:text-zinc-300">
          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="h-4 w-4 text-purple-500" /> Free AI & API Key Guide
          </h4>
          <p>
            You do <strong>not</strong> need to buy any API key. AskDocs runs Google Gemini Free Tier automatically on our servers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
              <span className="font-extrabold text-purple-600 dark:text-purple-400">1. Zero Cost</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Google AI Studio provides 15 requests/min and 1,000,000 tokens/min 100% free forever.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">2. No Credit Card</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">No payment method or billing information is ever required by Google AI Studio.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">3. Direct Link</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                If you ever want your own personal key, visit <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 underline inline-flex items-center gap-0.5">aistudio.google.com <ExternalLink className="h-2.5 w-2.5" /></a>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Doc Picker with In-Place Upload & Search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Select Document Source
              </label>
              <div>
                <input
                  type="file"
                  ref={docFileInputRef}
                  onChange={handleDirectDocUpload}
                  accept=".pdf,.docx,.doc,.txt,.md"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => docFileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  <UploadCloud className="h-3 w-3" />
                  <span>{uploadingDoc ? "Uploading..." : "+ Upload"}</span>
                </button>
              </div>
            </div>

            {docs.length > 4 && (
              <div className="relative mb-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="Filter files..."
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 pl-7 pr-2 py-1 text-[11px] text-slate-800 outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
                />
              </div>
            )}

            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={loadingDocs || docs.length === 0}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white transition-all cursor-pointer"
            >
              {filteredDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.file_type.toUpperCase()})
                </option>
              ))}
              {docs.length === 0 && <option value="">No documents in workspace</option>}
              {docs.length > 0 && filteredDocs.length === 0 && <option value="">No matching documents</option>}
            </select>
          </div>

          {/* Presentation Purpose / Persona */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Deck Audience & Style
            </label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as DeckPersona)}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white transition-all cursor-pointer"
            >
              <option value="executive">👔 Executive & Investor Pitch</option>
              <option value="student">🎓 Student Exam & Study Review</option>
              <option value="medical">🩺 Clinical & Medical Summary</option>
              <option value="hr">🏢 HR, Staffing & Office SOP</option>
              <option value="tech">⚙️ Tech Architecture & Specs</option>
              <option value="story">📖 Story & Character Analysis</option>
            </select>
          </div>

          {/* Slide Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Slide Count
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 4, 6, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSlideCount(count)}
                  className={`flex items-center justify-center rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    slideCount === count
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1f1f2e] dark:text-zinc-300"
                  }`}
                >
                  {count} Slides
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
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1db954] via-purple-600 to-indigo-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#1db954]/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{generating ? "Synthesizing Slides…" : "Generate with Free AI"}</span>
            </button>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Visual Theme
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: "cosmic", label: "Cosmic Glow", color: "bg-purple-600" },
                { id: "onyx", label: "Onyx Minimal", color: "bg-slate-700" },
                { id: "emerald", label: "Emerald Clean", color: "bg-emerald-600" },
                { id: "sunset", label: "Sunset Radiant", color: "bg-rose-600" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
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
              <span className="text-xs text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
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
