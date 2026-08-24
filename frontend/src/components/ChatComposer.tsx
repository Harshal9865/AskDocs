"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, Plus, X } from "lucide-react";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  function send() {
    const text = value.trim();
    if ((!text && attachments.length === 0) || disabled || busy) return;
    onSend(text, attachments);
    setAttachments([]);
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
      className={`dark:border-slate-700/50 dark:bg-[#242424] rounded-2xl border bg-white shadow-sm transition-all ${
        dragOver
          ? "border-indigo-400 ring-2 ring-indigo-100"
          : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100"
      }`}
    >
      {/* attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {attachments.map((a, i) => (
            <div
              key={i}
              className="dark:bg-[#2a2a2a] group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
            >
              {a.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.previewUrl}
                  alt={a.file.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <Paperclip className="dark:text-slate-400 h-3.5 w-3.5 text-slate-400" />
              )}
              <span className="dark:text-slate-300 max-w-[140px] truncate text-xs text-slate-600">
                {a.file.name}
              </span>
              <button
                onClick={() => removeAttachment(i)}
                aria-label={`Remove ${a.file.name}`}
                className="dark:text-slate-500 dark:hover:text-slate-300 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* input row */}
      <div className="flex items-end gap-1.5 p-2">
        {showAttach && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              aria-label="Attach file"
              title="Attach image, PDF, or text file"
              className="dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400 shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.csv,.doc,.docx"
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? "Type a message…"}
          id={inputId}
          className="dark:text-white dark:placeholder:text-slate-500 min-h-[44px] max-h-40 flex-1 resize-none border-0 bg-transparent p-2 text-sm placeholder:text-slate-400 focus:ring-0 disabled:text-slate-400"
        />

        <button
          onClick={send}
          disabled={!canSend}
          aria-label="Send message"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
            canSend
              ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
              : "bg-slate-200 text-slate-400 opacity-40"
          }`}
        >
          {busy ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
