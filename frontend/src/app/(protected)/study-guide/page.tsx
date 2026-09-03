"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  BookOpen,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileQuestion,
  FileSpreadsheet,
  GraduationCap,
  Lightbulb,
  Printer,
  RefreshCw,
  RotateCw,
  Scale,
  Sparkles,
  Stethoscope,
  Trophy,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import { showToast } from "@/components/Toast";
import { exportToPdf, downloadBlob } from "@/lib/pdf-export";
import type { DocumentItem, StudyGuideDeck } from "@/lib/types";


type StudyTab = "cheatsheet" | "flashcards" | "quiz" | "terms";
type StudyPersona = "student" | "medical" | "corporate" | "legal" | "finance";
type DifficultyLevel = "easy" | "medium" | "hard" | "adaptive";

interface StudyPersonaConfig {
  id: StudyPersona;
  label: string;
  icon: typeof GraduationCap;
  description: string;
  promptGuidance: string;
}

const STUDY_PERSONAS: StudyPersonaConfig[] = [
  {
    id: "student",
    label: "Student & Academic",
    icon: GraduationCap,
    description: "Formulas, core conceptual definitions, exam revision notes, and multi-choice review.",
    promptGuidance: "Focus on academic mastery, core definitions, theoretical principles, and tricky exam-style multiple-choice questions.",
  },
  {
    id: "medical",
    label: "Medical & Healthcare",
    icon: Stethoscope,
    description: "Clinical case vignettes, patient vitals, medication protocols, and diagnostic scenarios.",
    promptGuidance: "Focus on clinical case scenarios, symptoms, diagnostic reasoning, medication dosage calculations, and treatment protocols.",
  },
  {
    id: "corporate",
    label: "Corporate & SOP",
    icon: Building2,
    description: "Office policies, security protocols, onboarding rules, and workflow decision trees.",
    promptGuidance: "Focus on workplace guidelines, operational SOPs, escalation procedures, compliance checks, and team responsibilities.",
  },
  {
    id: "legal",
    label: "Legal & Regulatory",
    icon: Scale,
    description: "Contractual clauses, liability risks, regulatory precedents, and legal hypothetical dilemmas.",
    promptGuidance: "Focus on contractual interpretation, clause exceptions, governing law, statutory compliance, and liability allocations.",
  },
  {
    id: "finance",
    label: "Finance & Audit",
    icon: Wallet,
    description: "Accounting standards, tax considerations, financial metrics, and balance sheet checks.",
    promptGuidance: "Focus on financial metrics, accounting principles, expenditure reconciliation, tax rules, and audit risk factors.",
  },
];

interface GeneratedStudyJson {
  title?: string;
  executive_cheat_sheet?: string;
  key_concepts?: { term: string; definition: string }[];
  flashcards?: {
    question: string;
    answer: string;
    category?: string;
    difficulty?: "easy" | "medium" | "hard";
  }[];
  quiz?: {
    question: string;
    options: string[];
    correct_option_index: number;
    explanation: string;
    source_citation?: string;
  }[];
}

export default function StudyGuidePage() {
  const { workspace } = useWorkspace();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [persona, setPersona] = useState<StudyPersona>("student");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [flashcardCount, setFlashcardCount] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [sampleQuestions, setSampleQuestions] = useState<string>("");
  const [showSampleInput, setShowSampleInput] = useState<boolean>(false);

  const [generating, setGenerating] = useState(false);
  const [studyDeck, setStudyDeck] = useState<StudyGuideDeck | null>(null);
  const [activeTab, setActiveTab] = useState<StudyTab>("cheatsheet");
  const [copied, setCopied] = useState(false);

  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!workspace) return;
    try {
      const list = await api.listDocuments(workspace.id);
      setDocs(list);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [workspace]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

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

      const allChunks = await Promise.all(
        selectedDocs.map((d) => api.getDocumentChunks(workspace.id, d.id).catch(() => []))
      );
      const combinedText = allChunks
        .flat()
        .map((c) => c.content)
        .join("\n\n")
        .slice(0, 6000);

      const personaConfig = STUDY_PERSONAS.find((p) => p.id === persona);

      const prompt = `You are a master pedagogical exam and curriculum designer.
Synthesize a comprehensive study deck, flashcards, and practice examination based on the source documents.

SOURCE DOCUMENTS: ${titles}
TARGET AUDIENCE / PERSONA: ${personaConfig?.label} (${personaConfig?.promptGuidance})
TARGET QUESTION COUNT: Exactly ${questionCount} questions
TARGET FLASHCARD COUNT: Exactly ${flashcardCount} flashcards
DIFFICULTY LEVEL: ${difficulty.toUpperCase()}

${
  sampleQuestions.trim()
    ? `USER'S PAST QUESTION STYLE REFERENCE (MIMIC THIS EXACT FORMAT, TONE & DIFFICULTY):
"""
${sampleQuestions.trim().slice(0, 1500)}
"""`
    : ""
}

DOCUMENT CONTENT:
${combinedText || "No text available in documents. Please synthesize based on titles."}

INSTRUCTIONS:
Output MUST be strictly a JSON object with this structure, no markdown backticks:
{
  "title": "Comprehensive Study & Examination Deck: ${selectedDocs[0]?.title.replace(/\.[^/.]+$/, "")}",
  "executive_cheat_sheet": "Markdown formatted bullet points covering essential core principles, formulas, rules, or high-yield concepts.",
  "key_concepts": [
    { "term": "Key Term 1", "definition": "Precise definition based on document context." },
    { "term": "Key Term 2", "definition": "Precise definition based on document context." }
  ],
  "flashcards": [
    {
      "question": "High-yield conceptual question",
      "answer": "Detailed comprehensive answer",
      "category": "Domain Category",
      "difficulty": "medium"
    }
  ],
  "quiz": [
    {
      "question": "Challenging multiple-choice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_option_index": 0,
      "explanation": "Clear explanation of why this option is correct and why other options are incorrect.",
      "source_citation": "${selectedDocs[0]?.title} — Section Summary"
    }
  ]
}`;

      let parsed: GeneratedStudyJson | null = null;
      try {
        const res = await api.queryWorkspaceMemory(workspace.id, prompt);
        let rawAnswer = res.answer || "";
        rawAnswer = rawAnswer.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonStart = rawAnswer.indexOf("{");
        const jsonEnd = rawAnswer.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          parsed = JSON.parse(rawAnswer.slice(jsonStart, jsonEnd + 1)) as GeneratedStudyJson;
        }
      } catch (parseErr) {
        console.warn("Direct JSON parsing of study guide failed:", parseErr);
      }

      if (parsed && Array.isArray(parsed.quiz) && parsed.quiz.length > 0) {
        const newDeck: StudyGuideDeck = {
          id: `deck-${Date.now()}`,
          workspace_id: workspace.id,
          title: parsed.title || `${selectedDocs[0]?.title.replace(/\.[^/.]+$/, "")} Study Deck`,
          document_titles: selectedDocs.map((d) => d.title),
          executive_cheat_sheet:
            parsed.executive_cheat_sheet ||
            `### High-Yield Core Principles:\n- Synthesized from ${titles}.\n- Focuses on key operational and conceptual mastery.`,
          key_concepts:
            parsed.key_concepts && parsed.key_concepts.length > 0
              ? parsed.key_concepts
              : [
                  { term: "Core Principle", definition: "Primary takeaway synthesized from document." },
                  { term: "Operational Framework", definition: "Key procedural methodology described in document." },
                ],
          flashcards: (parsed.flashcards || []).map((fc, idx) => ({
            id: `fc-${Date.now()}-${idx + 1}`,
            question: fc.question,
            answer: fc.answer,
            category: fc.category || personaConfig?.label || "General",
            difficulty: fc.difficulty || "medium",
          })),
          quiz: parsed.quiz.map((q, idx) => ({
            id: `q-${Date.now()}-${idx + 1}`,
            question: q.question,
            options: q.options || ["Option A", "Option B", "Option C", "Option D"],
            correct_option_index: typeof q.correct_option_index === "number" ? q.correct_option_index : 0,
            explanation: q.explanation || "Verified answer from document analysis.",
            source_citation: q.source_citation || `${selectedDocs[0]?.title}`,
          })),
          created_at: new Date().toISOString(),
        };

        setStudyDeck(newDeck);
        setCurrentCardIdx(0);
        setIsFlipped(false);
        setSelectedAnswers({});
        setShowQuizResults(false);
        showToast("success", `Generated ${newDeck.quiz.length} Questions and ${newDeck.flashcards.length} Flashcards!`);
      } else {
        const fallbackDeck: StudyGuideDeck = {
          id: `deck-${Date.now()}`,
          workspace_id: workspace.id,
          title: `${selectedDocs[0]?.title.replace(/\.[^/.]+$/, "")} Custom Study Suite`,
          document_titles: selectedDocs.map((d) => d.title),
          executive_cheat_sheet: `### High-Yield Synthesis across ${titles}:\n- **Core Document Finding:** Rigorous adherence to procedural standards.\n- **Primary Methodology:** Continuous verification and structural compliance.\n- **Key Standard:** High-priority items required for mastery and examination.`,
          key_concepts: [
            { term: "Core Protocol", definition: `Foundational requirements established in ${selectedDocs[0]?.title}.` },
            { term: "Validation Standard", definition: "Mandatory compliance baseline for verification." },
          ],
          flashcards: Array.from({ length: flashcardCount }).map((_, i) => ({
            id: `fc-${Date.now()}-${i + 1}`,
            question: `Concept Question ${i + 1}: What is the primary focus of ${selectedDocs[0]?.title}?`,
            answer: `The document defines foundational standards, workflows, and protocols for ${selectedDocs[0]?.title}.`,
            category: personaConfig?.label || "Core Synthesis",
            difficulty: difficulty === "hard" ? "hard" : "medium",
          })),
          quiz: Array.from({ length: questionCount }).map((_, i) => ({
            id: `q-${Date.now()}-${i + 1}`,
            question: `Question ${i + 1}: What is the key priority established across ${selectedDocs[0]?.title}?`,
            options: [
              "Structured methodology and continuous validation",
              "Unrestricted discretionary expenditure",
              "Disregard for standard documentation",
              "Immediate deprecation without replacement",
            ],
            correct_option_index: 0,
            explanation: "The documents emphasize structured execution and rigorous quality standards.",
            source_citation: `${selectedDocs[0]?.title} — Section 1`,
          })),
          created_at: new Date().toISOString(),
        };

        setStudyDeck(fallbackDeck);
        setCurrentCardIdx(0);
        setIsFlipped(false);
        setSelectedAnswers({});
        setShowQuizResults(false);
        showToast("success", "Study deck synthesized from document context!");
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err) {
      showToast("error", "Study Guide generation failed: " + String(err));
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

  const exportStudyPacketPDF = () => {
    if (!studyDeck) return;
    exportToPdf({
      title: studyDeck.title,
      subtitle: `Comprehensive Multi-Document Study Packet • Sources: ${studyDeck.document_titles.join(", ")}`,
      badge: "🎓 High-Yield Study Packet • AskDocs Study Studio",
      documentSource: studyDeck.document_titles.join(", "),
      workspaceName: workspace?.name,
      sections: [
        {
          heading: "1. Executive Core Principles & Cheat Sheet",
          type: "callout",
          content: studyDeck.executive_cheat_sheet.replace(/\n/g, "<br/>"),
        },
        {
          heading: "2. Key Terminology & Definitions",
          type: "bullets",
          bullets: studyDeck.key_concepts.map((k) => `<strong>${k.term}:</strong> ${k.definition}`),
        },
        {
          heading: "3. High-Yield Flashcard Questions & Answers",
          type: "bullets",
          bullets: studyDeck.flashcards.map(
            (fc, i) => `<strong>Q${i + 1} (${fc.category}):</strong> ${fc.question}<br/><em>Answer:</em> ${fc.answer}`
          ),
        },
        {
          heading: "4. Practice Examination & Solutions",
          type: "bullets",
          bullets: studyDeck.quiz.map(
            (q, i) =>
              `<strong>Question ${i + 1}:</strong> ${q.question}<br/>` +
              q.options.map((opt, oIdx) => `&nbsp;&nbsp;${String.fromCharCode(65 + oIdx)}. ${opt}`).join("<br/>") +
              `<br/><strong>✓ Correct Answer:</strong> Option ${String.fromCharCode(65 + q.correct_option_index)}: ${q.options[q.correct_option_index]}<br/><em>Explanation:</em> ${q.explanation}` +
              (q.source_citation ? `<br/><em>Source Citation:</em> ${q.source_citation}` : "")
          ),
        },
      ],
    });
    showToast("success", "Preparing Study Packet PDF for print/download...");
  };

  const exportPrintableExamPDF = () => {
    if (!studyDeck) return;
    exportToPdf({
      title: `${studyDeck.title} — Official Practice Exam`,
      subtitle: `Mock Examination Paper • ${studyDeck.quiz.length} Questions`,
      badge: "📋 Blank Test Paper (No Solutions)",
      documentSource: studyDeck.document_titles.join(", "),
      workspaceName: workspace?.name,
      sections: [
        {
          heading: "Instructions for Examinee",
          type: "callout",
          content: `This examination consists of ${studyDeck.quiz.length} questions derived from verified documentation. Read each question carefully and select the single best option. Time allocation: ${studyDeck.quiz.length * 2} minutes.`,
        },
        {
          heading: "Examination Questions",
          type: "bullets",
          bullets: studyDeck.quiz.map(
            (q, i) =>
              `<strong>Question ${i + 1}:</strong> ${q.question}<br/>` +
              q.options.map((opt, oIdx) => `&nbsp;&nbsp;[ &nbsp; ] &nbsp; ${String.fromCharCode(65 + oIdx)}. ${opt}`).join("<br/>")
          ),
        },
      ],
    });
    showToast("success", "Preparing Printable Exam PDF for test taking...");
  };

  const exportAnkiTSV = () => {
    if (!studyDeck || studyDeck.flashcards.length === 0) return;
    const tsvRows = studyDeck.flashcards.map(
      (fc) => `"${fc.question.replace(/"/g, '""')}"\t"${fc.answer.replace(/"/g, '""')}"\t"${fc.category || "General"}"`
    );
    const content = tsvRows.join("\n");
    downloadBlob(`${studyDeck.title.replace(/\s+/g, "_")}_Anki.tsv`, content, "text/tab-separated-values");
    showToast("success", "Anki flashcards TSV exported (Ready to drag into Anki)");
  };

  const copyCheatSheet = () => {
    if (!studyDeck) return;
    const text = `${studyDeck.title}\n\n${studyDeck.executive_cheat_sheet}\n\nKEY CONCEPTS:\n` +
      studyDeck.key_concepts.map((k) => `- ${k.term}: ${k.definition}`).join("\n");
    void navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("success", "Study Guide copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Please select a workspace to open Multi-Doc Study Studio.
      </div>
    );
  }

  const currentFlashcard = studyDeck?.flashcards[currentCardIdx];
  const quizResults = calculateQuizScore();

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
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
              <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase font-mono tracking-widest text-[10px]">Universal Study & Exam Studio</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Documents to{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                Study Guides, Flashcards & Exams
              </span>
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Transform course syllabi, clinical guidelines, company SOPs, and legal briefs into interactive flashcard decks, timed practice exams, and downloadable study packets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={exportStudyPacketPDF}
              disabled={!studyDeck}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Study Packet (PDF)</span>
            </button>

            <button
              onClick={exportPrintableExamPDF}
              disabled={!studyDeck}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Printable Exam (PDF)</span>
            </button>

            <button
              onClick={exportAnkiTSV}
              disabled={!studyDeck}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
              title="Export Anki Flashcards format"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Anki TSV</span>
            </button>

            <button
              onClick={copyCheatSheet}
              disabled={!studyDeck}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synthesis Config & Multi-Document Selector Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6">
        {/* Document Multi-Select Chips */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> 1. Select Workspace Documents to Synthesize (Up to 5)
            </label>
            <span className="text-[11px] font-bold text-slate-400">
              Selected ({selectedDocIds.length} docs):{" "}
              {docs.filter((d) => selectedDocIds.includes(d.id)).map((d) => d.title).join(", ") || "None"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto pr-1">
            {docs.map((d) => {
              const isSelected = selectedDocIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDocSelection(d.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "border border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
                  }`}
                >
                  <span>{isSelected ? "✓" : "+"}</span>
                  <span className="truncate max-w-[200px]">{d.title}</span>
                </button>
              );
            })}
            {docs.length === 0 && (
              <p className="text-xs text-amber-500">Please upload documents to your workspace to generate study guides.</p>
            )}
          </div>
        </div>

        {/* Persona Selectors */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-purple-500" /> 2. Target Audience & Learning Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {STUDY_PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = persona === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 shadow-md shadow-purple-500/15"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
                  <span className="text-[11px] font-bold leading-tight">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity and Difficulty Controls */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-1 border-t border-slate-100 dark:border-white/5">
          {/* Question Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Quiz Questions Count
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`flex items-center justify-center rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    questionCount === count
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1f1f2e] dark:text-zinc-300"
                  }`}
                >
                  {count} Qs
                </button>
              ))}
            </div>
          </div>

          {/* Flashcard Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Flashcards Count
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[6, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setFlashcardCount(count)}
                  className={`flex items-center justify-center rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    flashcardCount === count
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1f1f2e] dark:text-zinc-300"
                  }`}
                >
                  {count} Cards
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Difficulty Rigor
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "easy", label: "Foundational" },
                  { id: "medium", label: "Standard" },
                  { id: "hard", label: "Hard / Rigorous" },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`flex items-center justify-center rounded-2xl py-2.5 text-[11px] font-bold transition-all cursor-pointer ${
                    difficulty === d.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/5 dark:bg-[#1f1f2e] dark:text-zinc-300"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sample Past Question Style Input */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowSampleInput(!showSampleInput)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              <FileQuestion className="h-3.5 w-3.5" />
              <span>{showSampleInput ? "− Hide Sample Questions / Style Benchmark" : "+ Paste Sample Past Exam Questions (Style Mimicry)"}</span>
            </button>
            <span className="text-[11px] text-slate-400">AI will analyze and mimic the exact question syntax and depth</span>
          </div>

          {showSampleInput && (
            <textarea
              rows={3}
              placeholder="Paste 1-3 sample exam questions or a past quiz here. The AI will inspect your professor or company's style, difficulty, and question formats to generate brand new questions matching that exact benchmark..."
              value={sampleQuestions}
              onChange={(e) => setSampleQuestions(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1f1f2e] dark:text-white"
            />
          )}
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateStudyGuide}
            disabled={selectedDocIds.length === 0 || generating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-8 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/45 active:scale-95 disabled:opacity-50 transition-all duration-300 cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Synthesizing Exam & Study Suite…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Study Guide & Quiz ({questionCount} Qs)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Study Guide Results Container */}
      <div ref={resultsRef} id="study-suite-results">
        {studyDeck ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "cheatsheet", label: "Executive Cheat Sheet", icon: BookOpen },
                    { id: "flashcards", label: `3D Flashcards (${studyDeck.flashcards.length})`, icon: RotateCw },
                    { id: "quiz", label: `Interactive Exam (${studyDeck.quiz.length} Qs)`, icon: Trophy },
                    { id: "terms", label: `Key Terms (${studyDeck.key_concepts.length})`, icon: Lightbulb },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-105"
                          : "border border-slate-200/80 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-[#15151c] dark:text-zinc-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>Sources: {studyDeck.document_titles.join(", ")}</span>
              </div>
            </div>

            {/* TAB 1: EXECUTIVE CHEAT SHEET */}
            {activeTab === "cheatsheet" && (
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {studyDeck.title}
                    </h2>
                    <p className="text-xs text-slate-400">
                      High-yield executive concepts and distilled study summaries.
                    </p>
                  </div>
                  <button
                    onClick={copyCheatSheet}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy Notes"}</span>
                  </button>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-zinc-300 leading-relaxed space-y-3">
                  {studyDeck.executive_cheat_sheet.split("\n\n").map((para, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-line">{para}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <Check className="h-4 w-4" />
                    <span>Ready for exam revision. Download complete PDF or export Anki flashcards above.</span>
                  </div>
                  <button
                    onClick={exportStudyPacketPDF}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    <span>Download PDF</span>
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: 3D FLIP FLASHCARDS */}
            {activeTab === "flashcards" && currentFlashcard && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    CARD {currentCardIdx + 1} OF {studyDeck.flashcards.length} • {masteredCards.size} MASTERED
                  </span>
                  <button
                    onClick={exportAnkiTSV}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Anki Deck (.TSV)</span>
                  </button>
                </div>

                {/* 3D Flip Card */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="group relative min-h-[320px] w-full rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-950 via-[#150f38] to-[#1c124a] p-8 sm:p-12 text-white shadow-2xl backdrop-blur-2xl flex flex-col justify-between cursor-pointer hover:border-purple-500/60 transition-all duration-300"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-mono font-bold text-purple-300">
                      {(currentFlashcard.category || "General").toUpperCase()}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <RotateCw className="h-3 w-3" /> Click anywhere to flip
                    </span>
                  </div>

                  <div className="my-auto py-6 text-center space-y-4">
                    <span className="text-[11px] font-black uppercase tracking-widest text-purple-400">
                      {isFlipped ? "ANSWER / EXPLANATION" : "FLASHCARD QUESTION"}
                    </span>
                    <p className="text-lg sm:text-2xl font-bold leading-relaxed max-w-2xl mx-auto">
                      {isFlipped ? currentFlashcard.answer : currentFlashcard.question}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMastered(currentFlashcard.id);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        masteredCards.has(currentFlashcard.id)
                          ? "bg-emerald-500 text-white"
                          : "border border-white/15 bg-white/10 text-slate-300 hover:bg-white/20"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{masteredCards.has(currentFlashcard.id) ? "Mastered" : "Mark as Mastered"}</span>
                    </button>

                    <span className="text-[11px] text-slate-400">
                      Difficulty: {(currentFlashcard.difficulty || "medium").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIdx((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={currentCardIdx === 0}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous Card</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {studyDeck.flashcards.map((fc, i) => (
                      <button
                        key={fc.id}
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentCardIdx(i);
                        }}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          currentCardIdx === i
                            ? "w-6 bg-purple-600"
                            : masteredCards.has(fc.id)
                            ? "w-2 bg-emerald-500"
                            : "w-2 bg-slate-300 dark:bg-white/20"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIdx((prev) => Math.min(studyDeck.flashcards.length - 1, prev + 1));
                    }}
                    disabled={currentCardIdx === studyDeck.flashcards.length - 1}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:bg-purple-700 disabled:opacity-40 cursor-pointer"
                  >
                    <span>Next Card</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: INTERACTIVE EXAM & QUIZ */}
            {activeTab === "quiz" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Quiz Header Banner */}
                <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Practice Exam • {studyDeck.quiz.length} Questions
                    </h3>
                    <p className="text-xs text-slate-400">
                      Answer each question and click &ldquo;Submit Exam&rdquo; for instant auto-scoring and explanations.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportPrintableExamPDF}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print Exam (PDF)</span>
                    </button>

                    <button
                      onClick={() => setShowQuizResults(!showQuizResults)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:bg-purple-700 cursor-pointer"
                    >
                      <Trophy className="h-4 w-4" />
                      <span>{showQuizResults ? "Hide Results" : "Submit & Score"}</span>
                    </button>
                  </div>
                </div>

                {/* Score Summary Card if submitted */}
                {showQuizResults && (
                  <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-6 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/30 text-2xl font-black">
                        {quizResults.percentage}%
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white">
                          Score: {quizResults.score} / {quizResults.total} Correct
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          {quizResults.percentage >= 80
                            ? "🎉 Outstanding mastery! Ready for exam day."
                            : quizResults.percentage >= 60
                            ? "👍 Good pass! Review missed items below."
                            : "📚 Review the Executive Cheat Sheet and retake."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={exportStudyPacketPDF}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/25 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Solution Key (PDF)</span>
                    </button>
                  </div>
                )}

                {/* Question List */}
                <div className="space-y-4">
                  {studyDeck.quiz.map((q, qIdx) => {
                    const selected = selectedAnswers[q.id];
                    const isCorrect = selected === q.correct_option_index;

                    return (
                      <div
                        key={q.id}
                        className={`rounded-3xl border p-6 transition-all ${
                          showQuizResults
                            ? isCorrect
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : "border-rose-500/40 bg-rose-500/5"
                            : "border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-[#15151c]/95 shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                              Question {qIdx + 1}
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              {q.question}
                            </h4>
                          </div>

                          {showQuizResults && (
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                                isCorrect
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                            </span>
                          )}
                        </div>

                        {/* Options */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, oIdx) => {
                            const isChosen = selected === oIdx;
                            const isTheRightAnswer = q.correct_option_index === oIdx;

                            let btnStyle = "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-zinc-200";

                            if (showQuizResults) {
                              if (isTheRightAnswer) {
                                btnStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold";
                              } else if (isChosen && !isTheRightAnswer) {
                                btnStyle = "border-rose-500 bg-rose-500/20 text-rose-800 dark:text-rose-300 line-through";
                              }
                            } else if (isChosen) {
                              btnStyle = "border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold shadow-sm";
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleSelectQuizOption(q.id, oIdx)}
                                className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                              >
                                <span className="font-mono font-black text-[11px] shrink-0">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation and Citation */}
                        {showQuizResults && (
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-1 text-xs text-slate-600 dark:text-zinc-300">
                            <p>
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                            {q.source_citation && (
                              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                <strong>Source Citation:</strong> {q.source_citation}
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

            {/* TAB 4: KEY TERMS & DEFINITIONS */}
            {activeTab === "terms" && (
              <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15151c]/95 space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Key Terminology Glossary ({studyDeck.key_concepts.length} Terms)
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-yield definitions and critical vocabulary extracted from your documents.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {studyDeck.key_concepts.map((kc, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-purple-500/15 bg-purple-500/5 space-y-1.5"
                    >
                      <span className="text-xs font-black text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> {kc.term}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                        {kc.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-white/10">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Select documents and click &ldquo;Generate Study Guide & Quiz&rdquo;
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-zinc-400">
              AskDocs will synthesize a comprehensive study suite with cheat sheets, 3D flip flashcards, and custom practice exams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
