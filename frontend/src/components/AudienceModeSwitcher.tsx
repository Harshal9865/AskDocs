"use client";

import React, { useState } from "react";
import { useAudienceMode, AUDIENCE_MODES } from "@/lib/audience-mode-context";
import {
  GraduationCap,
  Building2,
  Scale,
  DollarSign,
  Stethoscope,
  Briefcase,
  Check,
  X,
  ShieldCheck,
  ChevronRight,
  Layers,
} from "lucide-react";
import type { AudienceMode } from "@/lib/types";

interface ModeSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_ICONS: Record<AudienceMode, React.ComponentType<{ className?: string }>> = {
  academic: GraduationCap,
  office: Building2,
  legal: Scale,
  finance: DollarSign,
  clinical: Stethoscope,
  personal: Briefcase,
};

export default function AudienceModeSwitcherModal({ isOpen, onClose }: ModeSwitcherProps) {
  const { mode: currentMode, setMode, allModes } = useAudienceMode();
  const [selected, setSelected] = useState<AudienceMode>(currentMode);

  if (!isOpen) return null;

  const handleApply = () => {
    setMode(selected);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#12141c] animate-in zoom-in-95 duration-200 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-white/5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
              <Layers className="h-3 w-3" />
              <span>Workspace Persona Engine</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Switch Operational Mode
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Adapts chat terminology, studio ordering, extraction presets, and security defaults to your work.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 6 Mode Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto no-scrollbar p-1">
          {allModes.map((m) => {
            const Icon = MODE_ICONS[m.id];
            const isSelected = selected === m.id;
            const isCurrent = currentMode === m.id;

            return (
              <div
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.01] ${
                  isSelected
                    ? "border-purple-500 bg-purple-50/50 dark:border-purple-500/60 dark:bg-purple-950/20 shadow-md shadow-purple-500/10"
                    : "border-slate-200/80 bg-white dark:border-white/5 dark:bg-[#181a24] hover:border-slate-300 dark:hover:border-white/15"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${m.themeColor} text-white shadow-sm`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {m.name}
                        {isCurrent && (
                          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ACTIVE
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                        Chats: &ldquo;{m.chatLabel}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-slate-300 dark:border-white/20"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {m.tagline}
                </p>

                {m.securityNote && (
                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-white/5 dark:text-zinc-500">
                    <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{m.securityNote}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            Selected: <strong className="text-slate-900 dark:text-white">{AUDIENCE_MODES[selected].name}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:bg-purple-700 active:scale-95 transition-all cursor-pointer"
            >
              <span>Apply Mode</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
