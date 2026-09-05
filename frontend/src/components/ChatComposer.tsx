"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, ImageIcon, Mic, MicOff, Paperclip, Plus, Smile, X, FileSpreadsheet, PenTool } from "lucide-react";

export interface AttachedFile {
  file: File;
  previewUrl?: string; // for images
  videoUrl?: string; // for videos
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

const EMOJIS = ["😀", "😂", "🥹", "😍", "🤔", "👍", "🙏", "🔥", "❤️", "🎉", "😅", "😮", "😢", "😡", "👏", "💯", "🚀", "✅", "❌", "⚡", "🌟", "💡", "📎", "☕"];

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onAttach,
  disabled,
  placeholder,
  busy,
  showAttach = false,
  showEmoji = false,
  showVoice = true,
  inputId,
  variant = "default",
  replyingTo = null,
  onCancelReply,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string, attachments: AttachedFile[]) => void;
  onAttach?: (files: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  busy?: boolean;
  showAttach?: boolean;
  showEmoji?: boolean;
  showVoice?: boolean;
  inputId?: string;
  variant?: "default" | "aurora" | "green";
  replyingTo?: { id: string; sender_name: string; snippet: string } | null;
  onCancelReply?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const aurora = variant === "aurora" || variant === "green";

  // auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  // close menu / emoji picker on outside click / Escape
  useEffect(() => {
    if (!menuOpen && !emojiOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setEmojiOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, emojiOpen]);

  function insertEmoji(emo: string) {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      const nextVal = value.substring(0, start) + emo + value.substring(end);
      onChange(nextVal);
      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + emo.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    } else {
      onChange(value + emo);
    }
  }

  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRec = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          onChange(value ? `${value} ${transcript}`.trim() : transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setIsListening(false);
    }
  };

  function send() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    const text = value.trim();
    if ((!text && attachments.length === 0) || disabled || busy) return;
    onSend(text, attachments);
    setAttachments([]);
    setMenuOpen(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const arr: AttachedFile[] = [];
    for (const f of Array.from(files)) {
      const isImg = f.type.startsWith("image/");
      const isVid = f.type.startsWith("video/");
      arr.push({
        file: f,
        previewUrl: isImg ? URL.createObjectURL(f) : undefined,
        videoUrl: isVid ? URL.createObjectURL(f) : undefined,
      });
    }
    setAttachments((prev) => [...prev, ...arr]);
    onAttach?.(Array.from(files));
    setMenuOpen(false);
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  const canSend =
    !disabled && !busy && (value.trim().length > 0 || attachments.length > 0);

  return (
    <div
      onDragOver={(e) => {
        if (showAttach) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (!showAttach) return;
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={
        aurora
          ? `ask-aurora-wrap rounded-2xl ${variant === "green" ? "ask-aurora-wrap--green" : ""}`
          : `dark:border-white/10 dark:bg-[#242424] relative rounded-2xl border bg-white shadow-sm transition-all ${
              dragOver
                ? "border-[#1DB954] ring-2 ring-[#1DB954]/20 dark:border-[#1DB954]"
                : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:border-[#1DB954] dark:focus-within:ring-[#1DB954]/20"
            }`
      }
    >
      {aurora && (
        <div className="ask-aurora-blobs" aria-hidden>
          <span className="ask-aurora-blob ask-aurora-blob--1" />
          <span className="ask-aurora-blob ask-aurora-blob--2" />
          <span className="ask-aurora-blob ask-aurora-blob--3" />
        </div>
      )}
      <div
        className={
          aurora
            ? `relative z-10 rounded-2xl border bg-white shadow-sm transition-all dark:bg-[#0d0d1a] ${
                dragOver
                  ? "border-indigo-400 ring-2 ring-indigo-100 dark:border-[#1DB954] dark:ring-[#1DB954]/20"
                  : "border-slate-200 dark:border-white/10 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:border-[#1DB954] dark:focus-within:ring-[#1DB954]/20"
              }`
            : "contents"
        }
      >
      {/* Quoted Message Reply Bar (WhatsApp style) */}
      {replyingTo && (
        <div className="relative flex items-center justify-between border-b border-slate-100 bg-purple-50/70 px-3.5 py-2 dark:border-white/5 dark:bg-purple-950/30 text-xs rounded-t-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="h-7 w-1 shrink-0 rounded-full bg-gradient-to-b from-purple-600 to-indigo-600" />
            <div className="truncate">
              <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <span>Replying to</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{replyingTo.sender_name}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-sm sm:max-w-md mt-0.5">
                {replyingTo.snippet}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded-full p-1 text-slate-400 hover:bg-purple-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {attachments.map((a, i) => (
            <div
              key={i}
              className="dark:border-white/10 dark:bg-[#2a2a2a] group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
            >
              {a.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.previewUrl}
                  alt={a.file.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : a.videoUrl ? (
                <video src={a.videoUrl} className="h-8 w-8 rounded object-cover" muted />
              ) : (
                <Paperclip className="dark:text-zinc-400 h-3.5 w-3.5 text-slate-400" />
              )}
              <span className="dark:text-zinc-200 max-w-[140px] truncate text-xs text-slate-600">
                {a.file.name}
              </span>
              <button
                onClick={() => removeAttachment(i)}
                aria-label={`Remove ${a.file.name}`}
                className="dark:text-zinc-500 dark:hover:text-zinc-200 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* input row */}
      <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 sm:px-2.5 sm:py-1.5">
        {showAttach && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => !disabled && setMenuOpen((o) => !o)}
              disabled={disabled}
              aria-label="Add attachment"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              title="Attach files (PDFs, Images, Notes, Spreadsheets)"
              className="dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-purple-600 disabled:opacity-40 dark:data-[open=true]:bg-white/10 cursor-pointer"
              data-open={menuOpen}
            >
              <Plus className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 ${menuOpen ? "rotate-45" : ""}`} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="dark:border-white/10 dark:bg-[#1a1728] absolute bottom-full left-0 z-50 mb-2 w-64 sm:w-72 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 pb-1 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Attach Media & Documents
                </div>

                <div className="space-y-1">
                  {/* 1. Document / PDF */}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => docRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all hover:bg-purple-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">Documents & PDFs</span>
                      <span className="block text-[10px] text-slate-400 dark:text-zinc-400 truncate">PDF, DOCX, TXT, Markdown</span>
                    </div>
                  </button>

                  {/* 2. Photos & Images */}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => imageRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all hover:bg-purple-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">Photos & Images</span>
                      <span className="block text-[10px] text-slate-400 dark:text-zinc-400 truncate">PNG, JPG, JPEG, WebP, GIF</span>
                    </div>
                  </button>

                  {/* 3. Spreadsheets & Data */}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => sheetRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all hover:bg-purple-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FileSpreadsheet className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">Spreadsheets & Data</span>
                      <span className="block text-[10px] text-slate-400 dark:text-zinc-400 truncate">CSV, Excel worksheets</span>
                    </div>
                  </button>

                  {/* 4. Handwritten Notes & Diagrams */}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all hover:bg-purple-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <PenTool className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">Handwritten & Diagrams</span>
                      <span className="block text-[10px] text-slate-400 dark:text-zinc-400 truncate">Chalkboard, whiteboards, notes</span>
                    </div>
                  </button>
                </div>

                <div className="mt-1.5 border-t border-slate-100 dark:border-white/5 px-2.5 py-1 text-[10px] text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                  <span>✨ Auto-transcribed by AI</span>
                  <span>Drag & drop files</span>
                </div>
              </div>
            )}

            <input
              ref={imageRef}
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={docRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md"
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={sheetRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.tsv"
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraRef}
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {/* emoji picker — only shown when showEmoji is enabled (e.g. Office Chats) */}
        {showEmoji && (
          <div className="relative shrink-0" ref={emojiRef}>
            <button
              onClick={() => !disabled && setEmojiOpen((o) => !o)}
              disabled={disabled}
              aria-label="Emoji"
              title="Emoji"
              className="dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-amber-300 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-500 disabled:opacity-40"
            >
              <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            {emojiOpen && (
              <div className="dark:border-white/10 dark:bg-[#282828] absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJIS.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => insertEmoji(emo)}
                      className="rounded-lg p-1 text-lg transition-transform hover:scale-125 hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick @AskDocs Mention Tag - hidden on small mobile to give textarea full width */}
        <button
          type="button"
          onClick={() => {
            const tag = "@AskDocs ";
            if (!value.includes("@AskDocs")) {
              onChange(value ? `${tag}${value}` : tag);
            }
            textareaRef.current?.focus();
          }}
          disabled={disabled}
          title="Tag @AskDocs AI Teammate"
          className="hidden sm:inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 hover:from-indigo-500/20 hover:to-purple-500/20 dark:text-purple-300 transition-colors"
        >
          <span>🤖</span>
          <span>@AskDocs</span>
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? "Ask a question…"}
          id={inputId}
          className="dark:text-white dark:placeholder:text-zinc-500 max-h-28 min-h-[32px] sm:min-h-[36px] flex-1 min-w-0 resize-none border-0 bg-transparent px-1.5 py-1.5 sm:py-2 text-xs sm:text-sm leading-5 placeholder:text-slate-400 focus:ring-0 disabled:text-slate-400"
        />

        {/* Voice Input Button */}
        {showVoice && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            aria-label={isListening ? "Stop voice listening" : "Voice query"}
            title={isListening ? "Listening... Click to stop" : "Voice input"}
            className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-all ${
              isListening
                ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30"
                : "text-slate-400 hover:bg-slate-100 hover:text-purple-600 dark:hover:bg-white/10 dark:hover:text-purple-400"
            }`}
          >
            {isListening ? <MicOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        )}

        <button
          onClick={send}
          disabled={!canSend}
          aria-label="Send message"
          className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-all ${
            canSend
              ? variant === "green"
                ? "bg-[#1DB954] text-black shadow-sm hover:bg-[#1ed760]"
                : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
              : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-zinc-500"
          } disabled:opacity-40`}
        >
          {busy ? (
            <span className="inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </button>
      </div>
      </div>
    </div>
  );
}
