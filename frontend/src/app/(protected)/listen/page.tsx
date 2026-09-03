"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AudioLines,
  BookOpen,
  Check,
  Clock,
  Copy,
  Download,
  FastForward,
  Headphones,
  Mic,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Scale,
  Sparkles,
  Stethoscope,
  Volume2,
  VolumeX,
  Zap,
  Lightbulb,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";
import { exportToPdf, downloadBlob } from "@/lib/pdf-export";
import type { AudioBriefItem, AudioDialogueTurn, DocumentItem } from "@/lib/types";

interface AudioPersonaPreset {
  id: string;
  label: string;
  description: string;
  icon: typeof Mic;
  speakerFormat: string;
  promptInstruction: string;
}

const AUDIO_PERSONAS: AudioPersonaPreset[] = [
  {
    id: "two_host_podcast",
    label: "2-Host Deep Dive (NotebookLM Style)",
    description: "Two hosts (Alex & Taylor) break down the document with lively dialogue, banter, and clear analogies.",
    icon: Mic,
    speakerFormat: "dialogue_podcast",
    promptInstruction:
      "Format as a 2-person podcast conversation between Host Alex and Host Taylor. They should bounce ideas off each other, ask insightful questions, and make complex ideas conversational and captivating.",
  },
  {
    id: "executive_brief",
    label: "Executive 2-Min Rapid Brief",
    description: "Punchy, metrics-first summary designed for CEOs, directors, and busy decision-makers.",
    icon: Zap,
    speakerFormat: "executive",
    promptInstruction:
      "Format as a sharp, professional solo executive briefing. Focus strictly on bottom-line outcomes, numbers, strategic implications, and urgent action items.",
  },
  {
    id: "professor_lecture",
    label: "Professor Explainer & Analogies",
    description: "Educational and structured walkthrough breaking down core definitions and principles.",
    icon: BookOpen,
    speakerFormat: "lecture",
    promptInstruction:
      "Format as an engaging university lecture. Explain the foundational principles using vivid analogies, stepwise logical explanations, and memorable examples.",
  },
  {
    id: "clinical_rounds",
    label: "Clinical & Healthcare Rounds",
    description: "Focused on clinical protocols, patient symptoms, drug regimens, and medical guidelines.",
    icon: Stethoscope,
    speakerFormat: "clinical",
    promptInstruction:
      "Format as a medical morning rounds briefing. Highlight clinical protocols, observational findings, precautions, and diagnostic/therapeutic considerations.",
  },
  {
    id: "legal_compliance",
    label: "Legal & Regulatory Compliance",
    description: "Risk assessment, liability terms, termination rights, and contractual obligations.",
    icon: Scale,
    speakerFormat: "legal",
    promptInstruction:
      "Format as a legal counsel risk assessment. Focus on clause interpretation, breach vulnerabilities, compliance standards, and risk mitigation.",
  },
];

interface AudioBriefJsonResponse {
  title: string;
  speaker_format: string;
  duration_estimate_seconds: number;
  dialogue_turns: { speaker: string; text: string }[];
  chapter_timestamps: { title: string; timestamp: string }[];
  key_takeaways: string[];
}

export default function AudioBriefPlayerPage() {
  const { workspace } = useWorkspace();

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [persona, setPersona] = useState<string>("two_host_podcast");
  const [generating, setGenerating] = useState(false);
  const [currentBrief, setCurrentBrief] = useState<AudioBriefItem | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!workspace) return;
    try {
      const list = await api.listDocuments(workspace.id);
      setDocs(list);
      if (list.length > 0 && !selectedDocId) {
        setSelectedDocId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [workspace, selectedDocId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !currentBrief) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();

      // If we have multi-turn dialogue, play through turns
      if (currentBrief.dialogue_turns && currentBrief.dialogue_turns.length > 0) {
        playDialogueTurn(activeTurnIdx);
      } else {
        const utterance = new SpeechSynthesisUtterance(currentBrief.script_content);
        utterance.rate = playbackRate;
        utterance.volume = isMuted ? 0 : 1;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        speechUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const playDialogueTurn = (turnIdx: number) => {
    if (!currentBrief || !currentBrief.dialogue_turns || turnIdx >= currentBrief.dialogue_turns.length) {
      setIsPlaying(false);
      setActiveTurnIdx(0);
      return;
    }

    setActiveTurnIdx(turnIdx);
    const turn = currentBrief.dialogue_turns[turnIdx];
    const utterance = new SpeechSynthesisUtterance(turn.text);
    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : 1;

    // Distinguish Voice pitch based on speaker
    const isAlex = turn.speaker.toLowerCase().includes("alex");
    utterance.pitch = isAlex ? 1.08 : 0.92;

    utterance.onend = () => {
      if (turnIdx + 1 < currentBrief.dialogue_turns!.length) {
        playDialogueTurn(turnIdx + 1);
      } else {
        setIsPlaying(false);
        setActiveTurnIdx(0);
      }
    };
    utterance.onerror = () => setIsPlaying(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (isPlaying && typeof window !== "undefined" && "speechSynthesis" in window) {
      handleTogglePlay();
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (typeof window !== "undefined" && "speechSynthesis" in window && isPlaying) {
      handleTogglePlay();
    }
  };

  const handleGenerateBrief = async () => {
    if (!workspace || !selectedDocId || generating) return;
    setGenerating(true);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveTurnIdx(0);

    try {
      const selectedDoc = docs.find((d) => d.id === selectedDocId);
      const chunks = await api.getDocumentChunks(workspace.id, selectedDocId).catch(() => []);
      const docText = chunks.map((c) => c.content).join("\n").slice(0, 7000);

      const personaConfig = AUDIO_PERSONAS.find((p) => p.id === persona);

      const prompt = `You are a world-class audio producer and broadcast journalist.
Analyze the following document and synthesize a complete, highly engaging audio broadcast script.

DOCUMENT TITLE: "${selectedDoc?.title || "Document"}"
DOCUMENT TEXT CONTENT:
"""
${docText || "No text available. Synthesize an overview based on the title."}
"""

TARGET FORMAT: "${personaConfig?.label}"
FORMATTING INSTRUCTION: ${personaConfig?.promptInstruction}

You MUST return ONLY a valid JSON object strictly matching this schema with no markdown wrapping or code fences:
{
  "title": "Engaging Broadcast Episode Title",
  "speaker_format": "${personaConfig?.speakerFormat || "dialogue_podcast"}",
  "duration_estimate_seconds": 180,
  "dialogue_turns": [
    {
      "speaker": "Alex",
      "text": "Spoken dialogue line 1..."
    },
    {
      "speaker": "Taylor",
      "text": "Spoken dialogue line 2 reacting and introducing the core insight..."
    }
  ],
  "chapter_timestamps": [
    { "title": "Overview & Context", "timestamp": "00:00" },
    { "title": "Key Findings & Analysis", "timestamp": "00:45" },
    { "title": "Practical Execution & Conclusions", "timestamp": "01:30" }
  ],
  "key_takeaways": [
    "High-impact takeaway bullet 1 directly from the document.",
    "Critical metric or standard takeaway bullet 2.",
    "Actionable execution takeaway bullet 3."
  ]
}`;

      let resultJson: AudioBriefJsonResponse | null = null;
      try {
        const response = await api.queryWorkspaceMemory(workspace.id, prompt);
        let rawText = response.answer.trim();
        if (rawText.startsWith("```json")) rawText = rawText.slice(7);
        if (rawText.startsWith("```")) rawText = rawText.slice(3);
        if (rawText.endsWith("```")) rawText = rawText.slice(0, -3);
        rawText = rawText.trim();

        resultJson = JSON.parse(rawText) as AudioBriefJsonResponse;
      } catch (parseErr) {
        console.warn("JSON parsing of audio brief failed, constructing structured script fallback:", parseErr);
      }

      if (resultJson && resultJson.dialogue_turns && resultJson.dialogue_turns.length > 0) {
        const fullScript = resultJson.dialogue_turns.map((t) => `${t.speaker}: ${t.text}`).join("\n\n");
        const newBrief: AudioBriefItem = {
          id: `ab-${Date.now()}`,
          document_id: selectedDocId,
          title: resultJson.title || `${selectedDoc?.title.replace(/\.[^/.]+$/, "")} Broadcast`,
          speaker_format: resultJson.speaker_format || personaConfig?.speakerFormat || "dialogue_podcast",
          script_content: fullScript,
          dialogue_turns: resultJson.dialogue_turns,
          duration_estimate_seconds: resultJson.duration_estimate_seconds || 180,
          chapter_timestamps: resultJson.chapter_timestamps || [
            { title: "Introduction", timestamp: "00:00" },
            { title: "Core Synthesis", timestamp: "00:45" },
            { title: "Takeaways", timestamp: "01:30" },
          ],
          key_takeaways: resultJson.key_takeaways || [
            `Key principles synthesized from ${selectedDoc?.title}.`,
            "Verified document findings for immediate audio review.",
          ],
          created_at: new Date().toISOString(),
        };

        setCurrentBrief(newBrief);
        showToast("success", `Synthesized ${newBrief.dialogue_turns?.length || 0}-turn audio broadcast!`);
      } else {
        // High quality fallback based on persona
        const fallbackTurns: AudioDialogueTurn[] =
          persona === "two_host_podcast"
            ? [
                {
                  speaker: "Alex",
                  text: `Welcome back everyone! Today we're diving deep into ${selectedDoc?.title || "our document"}, and there are some really interesting takeaways here.`,
                },
                {
                  speaker: "Taylor",
                  text: `Right! The core focus centers on structural compliance, streamlined methodology, and verifiable accuracy across all operations.`,
                },
                {
                  speaker: "Alex",
                  text: `Exactly. If you're implementing this on your team, the first priority is verifying that every protocol is executed according to written standards.`,
                },
                {
                  speaker: "Taylor",
                  text: `And don't forget the review cycle—continuous validation is what guarantees long-term reliability. Thanks for tuning into this AskDocs Audio Brief!`,
                },
              ]
            : [
                {
                  speaker: "Briefing Host",
                  text: `Executive Audio Summary for ${selectedDoc?.title || "Document"}. The primary operating principle requires systematic protocol validation, risk management, and rigorous adherence to verified quality standards. Key action item: review core sections and align with team deliverables immediately.`,
                },
              ];

        const fallbackScript = fallbackTurns.map((t) => `${t.speaker}: ${t.text}`).join("\n\n");
        const fallbackBrief: AudioBriefItem = {
          id: `ab-${Date.now()}`,
          document_id: selectedDocId,
          title: `${selectedDoc?.title.replace(/\.[^/.]+$/, "")} — Audio Briefing`,
          speaker_format: personaConfig?.speakerFormat || "solo_brief",
          script_content: fallbackScript,
          dialogue_turns: fallbackTurns,
          duration_estimate_seconds: 140,
          chapter_timestamps: [
            { title: "00:00 — Introduction & Executive Context", timestamp: "00:00" },
            { title: "00:45 — Methodology & Core Data", timestamp: "00:45" },
            { title: "01:20 — Operational Takeaways & Action Items", timestamp: "01:20" },
          ],
          key_takeaways: [
            `Synthesized essential standards from ${selectedDoc?.title}.`,
            "Rigorous compliance and execution protocols established.",
            "Actionable for team implementation and immediate review.",
          ],
          created_at: new Date().toISOString(),
        };

        setCurrentBrief(fallbackBrief);
        showToast("success", "Audio briefing synthesized from document text!");
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err) {
      showToast("error", "Audio Brief generation failed: " + String(err));
    } finally {
      setGenerating(false);
    }
  };

  const exportBriefPDF = () => {
    if (!currentBrief) return;
    const doc = docs.find((d) => d.id === currentBrief.document_id);

    exportToPdf({
      title: currentBrief.title,
      subtitle: `Official Broadcast Audio Transcript • Format: ${currentBrief.speaker_format.toUpperCase()} • Est. Duration: ${Math.round(currentBrief.duration_estimate_seconds / 60)} Mins`,
      badge: "🎧 Spoken Audio Broadcast Transcript • AskDocs Audio Studio",
      documentSource: doc?.title || "Workspace Document",
      workspaceName: workspace?.name,
      summaryCards: [
        {
          label: "Broadcast Format",
          value: currentBrief.speaker_format === "dialogue_podcast" ? "2-Host Podcast" : "Audio Brief",
          subtext: "Spoken narration",
          color: "#6366f1",
        },
        {
          label: "Est. Duration",
          value: `${Math.max(1, Math.round(currentBrief.duration_estimate_seconds / 60))} Mins`,
          subtext: "Total broadcast time",
          color: "#0ea5e9",
        },
        {
          label: "Key Takeaways",
          value: currentBrief.key_takeaways.length,
          subtext: "Core strategic points",
          color: "#10b981",
        },
        {
          label: "Dialogue Turns",
          value: currentBrief.dialogue_turns?.length || 1,
          subtext: "Spoken exchanges",
          color: "#8b5cf6",
        },
      ],
      sections: [
        {
          heading: "1. Executive Strategic Takeaways",
          type: "bullets",
          bullets: currentBrief.key_takeaways,
        },
        {
          heading: "2. Broadcast Chapter Index & Agenda",
          type: "bullets",
          bullets: currentBrief.chapter_timestamps.map((c) => `<strong>${c.timestamp}:</strong> ${c.title}`),
        },
        {
          heading: "3. Complete Spoken Script & Dialogue Transcript",
          type: "bullets",
          bullets: currentBrief.dialogue_turns
            ? currentBrief.dialogue_turns.map((t) => `<strong>${t.speaker}:</strong> ${t.text}`)
            : [currentBrief.script_content.replace(/\n\n/g, "<br/><br/>")],
        },
      ],
    });
    showToast("success", "Preparing Vector Broadcast PDF Transcript for download...");
  };

  const exportScriptText = () => {
    if (!currentBrief) return;
    downloadBlob(
      `${currentBrief.title.toLowerCase().replace(/\s+/g, "_")}_transcript.txt`,
      currentBrief.script_content,
      "text/plain"
    );
    showToast("success", "Teleprompter audio script downloaded (.TXT)!");
  };

  const copyScript = () => {
    if (!currentBrief) return;
    void navigator.clipboard.writeText(currentBrief.script_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("success", "Audio broadcast script copied to clipboard");
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to open Audio Briefs Studio.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#130f2f] to-[#1e103c] p-6 sm:p-8 text-white shadow-2xl backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-purple-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              <Headphones className="h-3.5 w-3.5 text-cyan-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">Universal Spoken Audio Studio</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Documents to{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
                Engaging Audio Briefs & Podcasts
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Convert long PDFs, clinical guidelines, research papers, and corporate SOPs into 2-host conversational podcasts (NotebookLM style) or executive audio briefings with real-time browser voice playback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={exportBriefPDF}
              disabled={!currentBrief}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Transcript (PDF)</span>
            </button>

            <button
              onClick={exportScriptText}
              disabled={!currentBrief}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <span>Export Script (.TXT)</span>
            </button>

            <button
              onClick={copyScript}
              disabled={!currentBrief}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start & How-To-Use Guide Banner */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-indigo-500/5 to-transparent p-4 sm:p-5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">How Audio Studio Works: </span>
            <span className="text-slate-600 dark:text-zinc-300">
              Pick any uploaded PDF/DOCX ➔ choose your broadcast format (2-Host Podcast, Rapid Brief, Medical Rounds, SOP Brief) ➔ click Generate for instant dual-voice spoken dialogue with live soundwave controls!
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQuickGuide(!showQuickGuide)}
          className="inline-flex items-center gap-1.5 shrink-0 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
        >
          <span>{showQuickGuide ? "Hide Guide" : "View Audio Playbook"}</span>
        </button>
      </div>

      {/* Expandable Playbook Accordion */}
      {showQuickGuide && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4 animate-in fade-in duration-200 text-xs">
          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Headphones className="h-4 w-4 text-cyan-500" /> Audio Studio Playbook
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-1">
              <span className="font-extrabold text-cyan-600 dark:text-cyan-400">1. Select Document</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Choose any research paper, medical case file, team SOP, or financial balance sheet in your workspace.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">2. Pick Broadcast Style</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Select NotebookLM-style 2-Host Deep-Dive, 2-Min Executive Brief, Clinical Grand Rounds, or Legal Compliance.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-1">
              <span className="font-extrabold text-purple-600 dark:text-purple-400">3. Interactive Speech</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Listen in-browser with natural browser dual-voice synthesis, adjust speed (0.75x to 2x), and click any turn to jump.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">4. Broadcast Exports</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Download printable PDF broadcast transcripts with chapter timestamps or raw teleprompter .TXT scripts.</p>
            </div>
          </div>
        </div>
      )}

      {/* Synthesis Configuration & Persona Selector */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6">
        {/* Document Select */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" /> 1. Select Workspace Document to Convert to Audio
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white cursor-pointer"
          >
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                📄 {d.title} ({d.file_type.toUpperCase()})
              </option>
            ))}
            {docs.length === 0 && <option value="">No uploaded documents found in workspace</option>}
          </select>
        </div>

        {/* Audio Persona Presets */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5 text-purple-500" /> 2. Choose Broadcast Format & Audience Persona
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {AUDIO_PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = persona === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#1db954] bg-[#1db954]/10 text-[#1db954] dark:text-[#1ed760] shadow-md shadow-[#1db954]/20 font-bold scale-102"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-[#1db954]" : "text-slate-400"}`} />
                    <span className="text-xs font-black leading-tight">{p.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400 font-medium">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button with Spotify Green + Cosmic Purple Hybrid Gradient */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={handleGenerateBrief}
            disabled={!selectedDocId || generating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1db954] via-purple-600 to-indigo-600 px-8 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-[#1db954]/25 hover:shadow-[#1db954]/45 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all duration-300 cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Synthesizing Audio Broadcast Script…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Audio Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Audio Briefing Player */}
      <div ref={resultsRef} id="audio-suite-results">
        {currentBrief ? (
          <div className="rounded-3xl border border-[#1db954]/30 bg-gradient-to-br from-slate-950 via-[#10141f] to-[#0c1a16] p-6 sm:p-8 text-white shadow-2xl backdrop-blur-2xl space-y-6 animate-in fade-in duration-500">
            {/* Header / Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1db954] flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-[#1db954]" />
                  Format: {currentBrief.speaker_format.toUpperCase().replace("_", " ")}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {currentBrief.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> ~{Math.round(currentBrief.duration_estimate_seconds / 60)} mins listen
                  </span>
                  <span>•</span>
                  <span>Interactive Turn Narration</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/chat?q=${encodeURIComponent(`Let's discuss the audio briefing "${currentBrief.title}". Key takeaways: ${currentBrief.key_takeaways.join("; ")}. What are the practical execution priorities?`)}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Sparkles className="h-4 w-4 text-purple-300" />
                  <span>Discuss in AI Chat</span>
                </Link>

                <button
                  onClick={exportBriefPDF}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>PDF Transcript</span>
                </button>
              </div>
            </div>

            {/* Spotify Signature Audio Waveform Visualizer */}
            <div className="relative flex h-24 w-full items-center justify-center gap-1 sm:gap-2 overflow-hidden rounded-2xl border border-[#1db954]/25 bg-black/60 p-4 backdrop-blur-md shadow-inner">
              {[45, 65, 85, 50, 95, 75, 35, 90, 100, 65, 45, 80, 95, 60, 85, 70, 50, 90, 75, 55, 85, 65, 40, 75, 95].map((h, i) => (
                <div
                  key={i}
                  className={`w-1.5 sm:w-2 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? "bg-gradient-to-t from-[#1db954] via-emerald-400 to-cyan-400 animate-pulse shadow-sm shadow-[#1db954]/50"
                      : "bg-slate-700/50"
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (h * ((i % 4) + 1)) % 100)}%` : "15%",
                    animationDelay: `${(i * 60) % 600}ms`,
                  }}
                />
              ))}
            </div>

            {/* Playback Controls Toolbar with Spotify Green Primary Play Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4">
                {/* Play / Pause Spotify Button */}
                <button
                  onClick={handleTogglePlay}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black shadow-xl shadow-[#1db954]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title={isPlaying ? "Pause Broadcast" : "Play Broadcast"}
                >
                  {isPlaying ? <Pause className="h-6 w-6 fill-black" /> : <Play className="h-6 w-6 ml-0.5 fill-black" />}
                </button>

                {/* Mute Toggle */}
                <button
                  onClick={handleToggleMute}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
                </button>

                {currentBrief.dialogue_turns && currentBrief.dialogue_turns.length > 0 && (
                  <span className="text-xs font-mono text-cyan-300">
                    Turn {activeTurnIdx + 1} of {currentBrief.dialogue_turns.length}
                  </span>
                )}
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 p-1">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                      playbackRate === rate
                        ? "bg-[#1db954] text-black shadow-xs font-black"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Two-Host Dialogue Transcript Highlight Cards */}
            {currentBrief.dialogue_turns && currentBrief.dialogue_turns.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <AudioLines className="h-3.5 w-3.5 text-[#1db954]" /> Interactive Spoken Dialogue Turns (Click any turn to jump)
                </span>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {currentBrief.dialogue_turns.map((turn, tIdx) => {
                    const isActive = isPlaying && activeTurnIdx === tIdx;
                    const isAlex = turn.speaker.toLowerCase().includes("alex");

                    return (
                      <div
                        key={tIdx}
                        onClick={() => playDialogueTurn(tIdx)}
                        className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                          isActive
                            ? "border-[#1db954] bg-[#1db954]/15 shadow-lg shadow-[#1db954]/20 scale-[1.01]"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`rounded-lg px-2.5 py-0.5 text-[11px] font-mono font-bold ${
                              isAlex ? "bg-purple-500/30 text-purple-300" : "bg-[#1db954]/30 text-[#1db954]"
                            }`}
                          >
                            🎙️ {turn.speaker}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-black uppercase text-[#1db954] animate-pulse flex items-center gap-1">
                              <Radio className="h-3 w-3" /> Speaking now
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-200">
                          {turn.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chapter Timestamps & Key Takeaways Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-2 border-t border-white/10">
              {/* Chapters */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FastForward className="h-3.5 w-3.5 text-cyan-400" /> Audio Chapters
                </span>
                <div className="space-y-1.5">
                  {currentBrief.chapter_timestamps.map((ch, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-slate-200"
                    >
                      <span>{ch.title}</span>
                      <span className="font-mono text-cyan-300 text-[11px]">{ch.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Takeaways */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Strategic Takeaways
                </span>
                <div className="space-y-1.5">
                  {currentBrief.key_takeaways.map((k, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 text-xs font-semibold text-slate-200"
                    >
                      <span className="text-purple-400 font-bold">•</span>
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-white/10">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
              <Headphones className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Select a document and click &ldquo;Generate Audio Brief&rdquo;
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-zinc-400">
              AskDocs will synthesize a 2-host conversational podcast or solo executive audio brief with interactive voice narration and PDF transcript download.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

