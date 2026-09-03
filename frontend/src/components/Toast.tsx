"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let _id = 0;
let _setToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

export function showToast(type: ToastType, message: string) {
  const t: Toast = { id: ++_id, type, message };
  _setToasts?.((prev) => [...prev, t]);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    _setToasts = setToasts;
    return () => {
      _setToasts = null;
    };
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
    return () => clearTimeout(t);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md ${
            t.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/80 dark:text-emerald-300"
              : t.type === "info"
              ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-950/80 dark:text-purple-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/80 dark:text-red-300"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : t.type === "info" ? (
            <Info className="h-4 w-4 shrink-0 text-purple-500" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-2 shrink-0 rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
