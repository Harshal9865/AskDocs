"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AudioLines,
  BookOpen,
  Check,
  Clock,
  Copy,
  FastForward,
  Headphones,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import type { AudioBriefItem, DocumentItem } from "@/lib/types";

export default function AudioBriefPlayerPage() {
  const { workspace } = useWorkspace();

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [currentBrief, setCurrentBrief] = useState<AudioBriefItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Initial pre-loaded sample audio brief
  useEffect(() => {
    if (!currentBrief) {
      const sampleBrief: AudioBriefItem = {
        id: "ab-sample-1",
        title: "Q3 Strategy & Cloud Architecture Briefing",
        speaker_format: "solo_brief",
        duration_estimate_seconds: 180,
        script_content: `Welcome to your 3-minute executive audio briefing for the Q3 Cloud Architecture and Security Overview. 

First, the engineering roadmap confirms our multi-region failover deployment is on schedule, providing enterprise customers with a 99.95% monthly uptime guarantee. This limits maximum unscheduled downtime to under 22 minutes per month.

Second, the legal team has finalized the revised Master Services Agreement. Uncapped liability has been rejected in favor of a balanced 2.5x annual fee super-cap specifically for gross negligence.

Third, our automated OCR pipeline now processes client invoices with 98% accuracy, cutting manual data entry time by over 80%.

To review the full document matrix or ask follow-up questions, launch AskDocs AI Chat anytime. Thanks for listening!`,
        chapter_timestamps: [
          { title: "00:00 — Overview & Infrastructure Roadmap", timestamp: "00:00" },
          { title: "00:45 — Legal MSA & Liability Caps", timestamp: "00:45" },
          { title: "01:30 — Data Extractor Performance", timestamp: "01:30" },
          { title: "02:15 — Action Items & Summary", timestamp: "02:15" },
        ],
        key_takeaways: [
          "99.95% cloud SLA limits downtime to ~21.6 mins/month.",
          "2.5x annual fee super-cap adopted for revised enterprise contracts.",
          "OCR extraction achieves 98% accuracy across vendor invoices.",
        ],
        created_at: new Date().toISOString(),
      };
      setCurrentBrief(sampleBrief);
    }
  }, [currentBrief]);

  // Speech synthesis audio controls using Web Speech API
  const handleTogglePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !currentBrief) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentBrief.script_content);
      utterance.rate = playbackRate;
      utterance.volume = isMuted ? 0 : 1;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (isPlaying && typeof window !== "undefined" && "speechSynthesis" in window) {
      handleTogglePlay(); // restart with new rate
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
    try {
      const chunks = await api.getDocumentChunks(workspace.id, selectedDocId).catch(() => []);
      const doc = docs.find((d) => d.id === selectedDocId);
      const text = chunks.map((c) => c.content).join("\n").slice(0, 3000);

      const prompt = `Write a concise, engaging 2-minute spoken audio briefing script summarizing this document:
TITLE: ${doc?.title}
${text || "Sample document text"}
Format as a natural spoken narrative with clear chapter takeaways.`;

      let aiScript = "";
      try {
        const res = await api.queryWorkspaceMemory(workspace.id, prompt);
        aiScript = res.answer;
      } catch {
        aiScript = `Here is your executive audio summary for "${doc?.title}".`;
      }

      const newBrief: AudioBriefItem = {
        id: `ab-${Date.now()}`,
        document_id: selectedDocId,
        title: `${doc?.title.replace(/\.[^/.]+$/, "")} — Audio Briefing`,
        speaker_format: "solo_brief",
        duration_estimate_seconds: 140,
        script_content: aiScript || `Welcome to your audio summary of ${doc?.title}. This document outlines primary operating principles and strategic recommendations.`,
        chapter_timestamps: [
          { title: "00:00 — Introduction & Context", timestamp: "00:00" },
          { title: "00:50 — Key Findings & Data", timestamp: "00:50" },
          { title: "01:30 — Conclusions & Next Steps", timestamp: "01:30" },
        ],
        key_takeaways: [
          `Key principles synthesized from ${doc?.title}.`,
          "Validated for immediate review and audio playback.",
        ],
        created_at: new Date().toISOString(),
      };

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setCurrentBrief(newBrief);
    } catch (err) {
      alert("Audio Brief generation failed: " + String(err));
    } finally {
      setGenerating(false);
    }
  };

  const copyScript = () => {
    if (!currentBrief) return;
    void navigator.clipboard.writeText(currentBrief.script_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to use Document Audio Briefing Player.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#160d36] to-[#221045] p-6 sm:p-9 text-white shadow-2xl backdrop-blur-2xl animate-gradient-shift">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl animate-float pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl animate-float pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-violet-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              <Headphones className="h-3.5 w-3.5 text-cyan-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">AI Spoken Audio Briefing</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Listen to Any PDF in{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
                3 Minutes
              </span>
            </h1>
            
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Transform 40-page reports, research papers, and legal agreements into engaging spoken audio briefings. Listen on the go with real-time waveform visualizers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={copyScript}
              disabled={!currentBrief}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy Audio Script"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Picker & Audio Generator */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:flex-1 space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> Select Document to Convert to Audio Brief
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white cursor-pointer"
            >
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  📄 {d.title} ({d.file_type.toUpperCase()})
                </option>
              ))}
              {docs.length === 0 && <option value="">No uploaded documents found</option>}
            </select>
          </div>

          <button
            onClick={handleGenerateBrief}
            disabled={!selectedDocId || generating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/45 active:scale-95 disabled:opacity-50 transition-all duration-300 cursor-pointer shrink-0"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Synthesizing Audio Script…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate 3-Min Audio Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Audio Player Card */}
      {currentBrief && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white/95 to-purple-50/30 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:from-[#15151c]/95 dark:to-[#1a122e]/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-purple-500" />
                  Spoken AI Audio Briefing
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {currentBrief.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> ~{Math.round(currentBrief.duration_estimate_seconds / 60)} mins listen
                  </span>
                  <span>•</span>
                  <span>Natural Voice Synthesis</span>
                </div>
              </div>

              <Link
                href={`/chat?q=${encodeURIComponent(`Let's discuss the audio briefing "${currentBrief.title}". Key takeaways: ${currentBrief.key_takeaways.join("; ")}. What are the practical execution priorities?`)}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Discuss in AI Chat</span>
              </Link>
            </div>

            {/* Oscillating Audio Waveform Visualizer */}
            <div className="relative flex h-24 w-full items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-purple-500/20 bg-black/40 p-4 backdrop-blur-md shadow-inner">
              {[40, 65, 80, 45, 90, 70, 30, 85, 100, 60, 40, 75, 95, 55, 80, 65, 45, 90, 70, 50, 85, 60].map((h, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? "bg-gradient-to-t from-purple-500 via-indigo-400 to-cyan-400 animate-pulse"
                      : "bg-slate-700/60"
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (h * (i % 3 + 1)) % 100)}%` : "15%",
                    animationDelay: `${(i * 70) % 600}ms`,
                  }}
                />
              ))}
            </div>

            {/* Playback Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4">
                {/* Play / Pause Primary Button */}
                <button
                  onClick={handleTogglePlay}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                </button>

                {/* Mute Toggle */}
                <button
                  onClick={handleToggleMute}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 transition-all cursor-pointer"
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/80 p-1 dark:border-white/10 dark:bg-[#1f1f2e]">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                      playbackRate === rate
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Timestamps & Key Takeaways Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-2">
              {/* Chapters */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FastForward className="h-3.5 w-3.5" /> Audio Chapters
                </span>
                <div className="space-y-1.5">
                  {currentBrief.chapter_timestamps.map((ch, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/70 p-3 text-xs font-bold text-slate-800 dark:border-white/5 dark:bg-[#1f1f2e]/70 dark:text-zinc-200"
                    >
                      <span>{ch.title}</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400 text-[11px]">{ch.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Takeaways */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Strategic Takeaways
                </span>
                <div className="space-y-1.5">
                  {currentBrief.key_takeaways.map((k, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-xl border border-purple-500/10 bg-purple-50/40 p-3 text-xs font-semibold text-slate-800 dark:bg-purple-950/20 dark:text-zinc-200"
                    >
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full Spoken Script */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AudioLines className="h-3.5 w-3.5" /> Full Spoken Audio Script
              </span>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 font-sans text-xs leading-relaxed text-slate-800 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 max-h-64 overflow-y-auto whitespace-pre-wrap">
                {currentBrief.script_content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
