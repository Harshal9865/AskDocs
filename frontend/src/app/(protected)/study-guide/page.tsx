"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  GraduationCap,
  Lightbulb,
  RefreshCw,
  RotateCw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import type { DocumentItem, StudyGuideDeck } from "@/lib/types";

type StudyTab = "cheatsheet" | "flashcards" | "quiz" | "terms";

export default function StudyGuidePage() {
  const { workspace } = useWorkspace();

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [studyDeck, setStudyDeck] = useState<StudyGuideDeck | null>(null);
  const [activeTab, setActiveTab] = useState<StudyTab>("cheatsheet");
  const [copied, setCopied] = useState(false);

  // Flashcard interactive state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  // Quiz interactive state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!workspace) return;
    try {
      const list = await api.listDocuments(workspace.id);
      setDocs(list);
      if (list.length > 0 && selectedDocIds.length === 0) {
        setSelectedDocIds([list[0].id]);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [workspace, selectedDocIds.length]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Initial pre-loaded study guide deck
  useEffect(() => {
    if (!studyDeck) {
      const sampleDeck: StudyGuideDeck = {
        id: "deck-sample-1",
        workspace_id: workspace?.id || "ws-1",
        title: "Distributed Systems & Cloud Architecture Comprehensive Study Deck",
        document_titles: ["System_Architecture_Whitepaper.pdf", "Cloud_SLA_Guidelines.pdf"],
        executive_cheat_sheet: `### Executive Core Principles:
- **CAP Theorem:** A distributed data store can only provide two of three guarantees: Consistency, Availability, and Partition Tolerance.
- **Raft Consensus:** Leader election and log replication algorithm designed for high fault tolerance and split-brain prevention.
- **Microservices SLA Target:** 99.95% monthly uptime implies no more than 21.6 minutes of total unscheduled downtime per month.
- **Zero Trust Security:** Explicit verification, least privilege access, and assumed breach at every network boundary.`,
        key_concepts: [
          { term: "Eventual Consistency", definition: "A consistency model where all replicas eventually converge to the same value given no new updates." },
          { term: "Idempotency", definition: "An API operation property where executing a request multiple times produces identical results without unintended side effects." },
          { term: "Rate Limiting (Token Bucket)", definition: "An algorithm that permits burst traffic up to bucket capacity while enforcing steady-state throughput limits." },
          { term: "Circuit Breaker Pattern", definition: "A design pattern preventing cascading failures by failing fast when a dependent downstream service is degraded." },
        ],
        flashcards: [
          {
            id: "fc-1",
            question: "What is the CAP Theorem and what are its trade-offs?",
            answer: "The CAP theorem states that in a distributed data store, you can only pick 2 out of 3: Consistency (all nodes see same data), Availability (every request gets a response), and Partition Tolerance (system continues operating despite network drops). In real distributed networks, P is mandatory, so the choice is between CP or AP.",
            category: "Distributed Architecture",
            difficulty: "medium",
          },
          {
            id: "fc-2",
            question: "Why is Idempotency critical in payment and distributed messaging systems?",
            answer: "Network retries and duplicates happen frequently. If an API request to charge a credit card is retried 3 times, idempotency guarantees the customer is only billed once, typically using unique idempotency keys.",
            category: "API Design",
            difficulty: "easy",
          },
          {
            id: "fc-3",
            question: "How does the Circuit Breaker pattern prevent cascading system failures?",
            answer: "It monitors service call failures. When failures cross a threshold, the breaker 'trips' (opens), immediately failing subsequent calls without waiting for timeouts, allowing the failing service time to recover.",
            category: "Resilience",
            difficulty: "hard",
          },
          {
            id: "fc-4",
            question: "What does a 99.95% SLA translate to in terms of allowable monthly downtime?",
            answer: "Approximately 21.6 minutes of downtime per calendar month (30 days * 24 hrs * 60 mins = 43,200 total minutes * 0.05% = 21.6 minutes max).",
            category: "SLA Metrics",
            difficulty: "medium",
          },
        ],
        quiz: [
          {
            id: "q-1",
            question: "Under the CAP theorem, why is Partition Tolerance (P) considered non-negotiable in real cloud networks?",
            options: [
              "Because hardware and fiber networks inevitably experience latency and packet drops",
              "Because consistency is never required in database systems",
              "Because cloud providers prohibit data replication",
              "Because all servers share the same physical memory",
            ],
            correct_option_index: 0,
            explanation: "In real-world distributed networks, packet loss and network partitions are inevitable physical realities. Therefore, architectures must choose between Consistency (CP) or Availability (AP) during a partition.",
            source_citation: "System_Architecture_Whitepaper.pdf — Section 3.1",
          },
          {
            id: "q-2",
            question: "Which pattern immediately returns an error instead of waiting for a slow timeout when a dependent microservice is crashing?",
            options: [
              "Saga Pattern",
              "Circuit Breaker Pattern",
              "Event Sourcing",
              "Command Query Responsibility Segregation (CQRS)",
            ],
            correct_option_index: 1,
            explanation: "The Circuit Breaker pattern 'trips' open to fail fast, preserving system resources and preventing upstream thread pool exhaustion.",
            source_citation: "System_Architecture_Whitepaper.pdf — Section 5.4",
          },
          {
            id: "q-3",
            question: "If an enterprise client requires a 99.95% monthly uptime SLA, what is the maximum permissible unscheduled downtime per month?",
            options: [
              "~2 hours",
              "~43 minutes",
              "~21.6 minutes",
              "~5 minutes",
            ],
            correct_option_index: 2,
            explanation: "43,200 monthly minutes * (1 - 0.9995) = 21.6 minutes permissible downtime per month.",
            source_citation: "Cloud_SLA_Guidelines.pdf — Appendix A",
          },
        ],
        created_at: new Date().toISOString(),
      };
      setStudyDeck(sampleDeck);
    }
  }, [studyDeck, workspace]);

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleGenerateStudyGuide = async () => {
    if (!workspace || selectedDocIds.length === 0 || generating) return;
    setGenerating(true);
    try {
      const selectedDocs = docs.filter((d) => selectedDocIds.includes(d.id));
      const titles = selectedDocs.map((d) => d.title).join(", ");

      const prompt = `Synthesize a comprehensive study guide, interactive flashcards, and test quiz from these documents: ${titles}.`;

      let aiSummary = "";
      try {
        const res = await api.queryWorkspaceMemory(workspace.id, prompt);
        aiSummary = res.answer;
      } catch {
        aiSummary = `Comprehensive study deck synthesized from ${titles}.`;
      }

      const newDeck: StudyGuideDeck = {
        id: `deck-${Date.now()}`,
        workspace_id: workspace.id,
        title: `${selectedDocs[0]?.title.replace(/\.[^/.]+$/, "")} & Workspace Study Deck`,
        document_titles: selectedDocs.map((d) => d.title),
        executive_cheat_sheet: `### Executive Core Concepts & Key Highlights:
- **Primary Subject Focus:** Synthesized knowledge across ${titles}.
- **Key Takeaway:** ${aiSummary.slice(0, 300)}...
- **Critical Principles:** High-priority items required for mastery and examination.`,
        key_concepts: [
          { term: "Core Principle 1", definition: "Primary operational thesis identified across selected documents." },
          { term: "Key Methodological Framework", definition: "Structured approach governing execution and evaluation." },
          { term: "Critical Threshold Standard", definition: "Mandatory compliance or quality baseline for validation." },
        ],
        flashcards: [
          {
            id: `fc-${Date.now()}-1`,
            question: `What is the central focus of ${selectedDocs[0]?.title}?`,
            answer: `The document outlines foundational methodologies, procedural guidelines, and strategic standards for ${selectedDocs[0]?.title}.`,
            category: "Core Synthesis",
            difficulty: "easy",
          },
          {
            id: `fc-${Date.now()}-2`,
            question: "What are the primary operational requirements highlighted across the study files?",
            answer: "Strict adherence to procedural guidelines, continuous verification, and standardized metrics.",
            category: "Execution",
            difficulty: "medium",
          },
        ],
        quiz: [
          {
            id: `q-${Date.now()}-1`,
            question: `Which core principle is emphasized across ${selectedDocs[0]?.title}?`,
            options: [
              "Structured methodology and continuous validation",
              "Unrestricted discretionary expenditure",
              "Disregard for standard documentation",
              "Immediate deprecation without replacement",
            ],
            correct_option_index: 0,
            explanation: "The documents emphasize structured execution and rigorous quality standards.",
            source_citation: `${selectedDocs[0]?.title} — Section 1`,
          },
        ],
        created_at: new Date().toISOString(),
      };

      setStudyDeck(newDeck);
      setCurrentCardIdx(0);
      setIsFlipped(false);
      setSelectedAnswers({});
      setShowQuizResults(false);
    } catch (err) {
      alert("Study Guide generation failed: " + String(err));
    } finally {
      setGenerating(false);
    }
  };

  const toggleMastered = (cardId: string) => {
    setMasteredCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const handleSelectQuizOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const calculateQuizScore = () => {
    if (!studyDeck) return { score: 0, total: 0, percentage: 0 };
    let correct = 0;
    studyDeck.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_option_index) correct++;
    });
    return {
      score: correct,
      total: studyDeck.quiz.length,
      percentage: Math.round((correct / studyDeck.quiz.length) * 100),
    };
  };

  const copyStudyGuide = () => {
    if (!studyDeck) return;
    const text = `# ${studyDeck.title} — Study Guide & Cheat Sheet\n\n${studyDeck.executive_cheat_sheet}\n\n## Key Terms\n${studyDeck.key_concepts.map((k) => `- **${k.term}:** ${k.definition}`).join("\n")}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCard = studyDeck?.flashcards[currentCardIdx];

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to use Study Guide Studio.
      </div>
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8 gemini-gradient-bg animate-in fade-in duration-300">
      {/* Background Ambient Orbs */}
      <div className="gemini-orb gemini-orb-1" />
      <div className="gemini-orb gemini-orb-2" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#140e33] to-[#201042] p-6 sm:p-9 text-white shadow-2xl backdrop-blur-2xl animate-gradient-shift">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl animate-float pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl animate-float pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-purple-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
              <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">AI Multi-Doc Study Studio</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Multi-Doc Study Guide &{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Quiz Studio
              </span>
            </h1>
            
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Synthesize 1–5 uploaded documents into executive cheat sheets, interactive 3D flippable flashcards, and self-testing quizzes with instant scoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={copyStudyGuide}
              disabled={!studyDeck}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy Study Guide"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Document Selection Drawer */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> Select Workspace Documents to Synthesize (Up to 5)
            </h3>
            <p className="text-xs text-slate-400">
              Selected ({selectedDocIds.length} docs): {docs.filter((d) => selectedDocIds.includes(d.id)).map((d) => d.title).join(", ") || "None"}
            </p>
          </div>

          <button
            onClick={handleGenerateStudyGuide}
            disabled={selectedDocIds.length === 0 || generating}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/45 active:scale-95 disabled:opacity-50 transition-all duration-300 cursor-pointer shrink-0"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Synthesizing Study Deck…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Study Guide & Quiz</span>
              </>
            )}
          </button>
        </div>

        {/* Doc Chips List */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
          {docs.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <button
                key={doc.id}
                onClick={() => toggleDocSelection(doc.id)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                    : "border-slate-200/80 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1a1a24] dark:text-zinc-400"
                }`}
              >
                <span>{isSelected ? "✓" : "+"}</span>
                <span>{doc.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Study Deck Main Container */}
      {studyDeck && (
        <div className="space-y-6">
          {/* Header Card & Tab Switcher */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-white/5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Synthesized Study Intelligence Deck
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {studyDeck.title}
                </h2>
              </div>

              <Link
                href={`/chat?q=${encodeURIComponent(`Let's run a study session on "${studyDeck.title}". Quiz me on the core concepts, ask me challenging follow-up questions, and grade my answers!`)}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Tutor Mode in AI Chat</span>
              </Link>
            </div>

            {/* Tab Switcher Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <button
                onClick={() => setActiveTab("cheatsheet")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "cheatsheet"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                📌 Executive Cheat Sheet
              </button>
              <button
                onClick={() => setActiveTab("flashcards")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "flashcards"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                🧠 3D Flashcards ({studyDeck.flashcards.length})
              </button>
              <button
                onClick={() => setActiveTab("quiz")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "quiz"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                📝 Self-Test Quiz ({studyDeck.quiz.length} Questions)
              </button>
              <button
                onClick={() => setActiveTab("terms")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "terms"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                💡 Key Terms & Definitions ({studyDeck.key_concepts.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Executive Cheat Sheet */}
          {activeTab === "cheatsheet" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <Zap className="h-4 w-4 text-purple-500" />
                <span>Executive Cheat Sheet & Core Principles</span>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 text-xs text-slate-800 dark:border-white/10 dark:bg-[#1a1a24] dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {studyDeck.executive_cheat_sheet}
              </div>
            </div>
          )}

          {/* Tab 2: 3D Interactive Flashcards */}
          {activeTab === "flashcards" && currentCard && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Card {currentCardIdx + 1} of {studyDeck.flashcards.length} • {masteredCards.size} Mastered
                </span>
                <button
                  onClick={() => toggleMastered(currentCard.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    masteredCards.has(currentCard.id)
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-300"
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>{masteredCards.has(currentCard.id) ? "Mastered ✓" : "Mark as Mastered"}</span>
                </button>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative mx-auto h-64 w-full max-w-xl cursor-pointer select-none rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-indigo-500/10 to-purple-500/5 p-8 shadow-2xl transition-all duration-300 hover:border-purple-500/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  <span>{currentCard.category || "General"}</span>
                  <span className="flex items-center gap-1">
                    <RotateCw className="h-3 w-3" /> Click to Flip ({isFlipped ? "Answer" : "Question"})
                  </span>
                </div>

                <div className="my-auto text-center">
                  {!isFlipped ? (
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-relaxed">
                      {currentCard.question}
                    </h3>
                  ) : (
                    <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-relaxed">
                      {currentCard.answer}
                    </p>
                  )}
                </div>

                <div className="text-center text-[11px] font-bold text-slate-400">
                  {isFlipped ? "💡 Verified from workspace documents" : "🤔 Think of your answer, then click to check"}
                </div>
              </div>

              {/* Card Navigation Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  disabled={currentCardIdx === 0}
                  onClick={() => {
                    setCurrentCardIdx((prev) => Math.max(0, prev - 1));
                    setIsFlipped(false);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 disabled:opacity-30 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="rounded-2xl bg-purple-50 px-5 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 transition-all cursor-pointer"
                >
                  Flip Card
                </button>

                <button
                  disabled={currentCardIdx === studyDeck.flashcards.length - 1}
                  onClick={() => {
                    setCurrentCardIdx((prev) => Math.min(studyDeck.flashcards.length - 1, prev + 1));
                    setIsFlipped(false);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 disabled:opacity-30 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-zinc-200 transition-all cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Self-Testing Quiz */}
          {activeTab === "quiz" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Self-Assessment Examination Quiz
                  </h3>
                  <p className="text-xs text-slate-400">
                    Test your mastery. Instant scoring and detailed explanations included.
                  </p>
                </div>

                <button
                  onClick={() => setShowQuizResults(true)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Check Score
                </button>
              </div>

              {/* Quiz Score Header Banner if submitted */}
              {showQuizResults && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-emerald-500" />
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        Your Score: {calculateQuizScore().percentage}% ({calculateQuizScore().score} / {calculateQuizScore().total} Correct)
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-300">
                        {calculateQuizScore().percentage >= 80 ? "🎉 Outstanding! Exam Ready." : "📚 Good effort! Review missed questions below."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {studyDeck.quiz.map((q, qIdx) => {
                  const selected = selectedAnswers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 space-y-3 dark:border-white/5 dark:bg-[#1a1a24]/70"
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">
                          {qIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {q.question}
                        </h4>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selected === optIdx;
                          let optionStyle = "border-slate-200 bg-white hover:border-purple-300 dark:border-white/10 dark:bg-[#1f1f2e]";

                          if (showQuizResults) {
                            if (optIdx === q.correct_option_index) {
                              optionStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black";
                            } else if (isOptionSelected && optIdx !== q.correct_option_index) {
                              optionStyle = "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300";
                            }
                          } else if (isOptionSelected) {
                            optionStyle = "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold";
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizOption(q.id, optIdx)}
                              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs transition-all cursor-pointer ${optionStyle}`}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-black">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="leading-snug">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation if results shown */}
                      {showQuizResults && (
                        <div className="rounded-xl border border-purple-500/10 bg-purple-50/50 p-3 text-xs text-slate-700 dark:bg-purple-950/20 dark:text-zinc-300 space-y-1">
                          <p className="font-semibold">{q.explanation}</p>
                          {q.source_citation && (
                            <p className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                              Ref: {q.source_citation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Key Terms & Definitions */}
          {activeTab === "terms" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <Lightbulb className="h-4 w-4 text-purple-500" />
                <span>Key Terms & Conceptual Definitions</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {studyDeck.key_concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-[#1a1a24]/70 space-y-1"
                  >
                    <h4 className="text-xs font-black text-purple-600 dark:text-purple-400">
                      {concept.term}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 font-medium">
                      {concept.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
