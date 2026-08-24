"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, ImageIcon, Paperclip, Plus, X } from "lucide-react";

export interface AttachedFile {
  file: File;
  previewUrl?: string; // for images
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onAttach,
  disabled,
  placeholder,
  busy,
  showAttach = false,
  inputId,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string, attachments: AttachedFile[]) => void;
  onAttach?: (files: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  busy?: boolean;
  showAttach?: boolean;
  inputId?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  // close menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function send() {
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
      arr.push({
        file: f,
        previewUrl: isImg ? URL.createObjectURL(f) : undefined,
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
      className={`dark:border-white/10 dark:bg-[#242424] relative rounded-2xl border bg-white shadow-sm transition-all ${
        dragOver
          ? "border-[#1DB954] ring-2 ring-[#1DB954]/20 dark:border-[#1DB954]"
          : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:border-[#1DB954] dark:focus-within:ring-[#1DB954]/20"
      }`}
    >
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
      <div className="flex items-end gap-1.5 px-2 py-1.5">
        {showAttach && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => !disabled && setMenuOpen((o) => !o)}
              disabled={disabled}
              aria-label="Add attachment"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              title="Add photos & files"
              className="dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-40 dark:data-[open=true]:bg-white/10"
              data-open={menuOpen}
            >
              <Plus className={`h-5 w-5 transition-transform ${menuOpen ? "rotate-45" : ""}`} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="dark:border-white/10 dark:bg-[#282828] absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
              >
                <div className="dark:text-zinc-400 px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Add to chat
                </div>
                <button
                  role="menuitem"
                  onClick={() => imageRef.current?.click()}
                  className="dark:hover:bg-white/10 dark:text-white flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span className="dark:bg-white/10 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:text-[#1DB954]">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">Photos & images</span>
                    <span className="block text-xs text-slate-500 dark:text-zinc-400">JPG, PNG, GIF, WebP</span>
                  </span>
                </button>
                <button
                  role="menuitem"
                  onClick={() => fileRef.current?.click()}
                  className="dark:hover:bg-white/10 dark:text-white flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span className="dark:bg-white/10 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:text-zinc-300">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">Files & documents</span>
                    <span className="block text-xs text-slate-500 dark:text-zinc-400">PDF, TXT, CSV, DOC</span>
                  </span>
                </button>
                <div className="dark:border-white/10 mt-1 border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
                  Tip: you can also drag & drop files here
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
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.txt,.csv,.doc,.docx,image/*"
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? "Ask a question…"}
          id={inputId}
          className="dark:text-white dark:placeholder:text-zinc-500 max-h-28 min-h-[36px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[14px] leading-5 placeholder:text-slate-400 focus:ring-0 disabled:text-slate-400"
        />

        <button
          onClick={send}
          disabled={!canSend}
          aria-label="Send message"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
            canSend
              ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 dark:bg-[#1DB954] dark:text-black dark:hover:bg-[#1ed760]"
              : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-zinc-500"
          } disabled:opacity-40`}
        >
          {busy ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
