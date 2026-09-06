"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import type { AudienceMode, AudienceModeConfig } from "@/lib/types";

export const AUDIENCE_MODES: Record<AudienceMode, AudienceModeConfig> = {
  academic: {
    id: "academic",
    name: "Academic & Student Hub",
    badge: "🎓 Academic",
    tagline: "Syllabus Mastery, 3D Flashcards & Study Groups",
    chatLabel: "Study Groups",
    chatPlaceholder: "Search study groups or classmates…",
    groupTypeLabel: "New Study Group",
    groupPlaceholders: [
      "CS101 Midterm Prep",
      "Organic Chemistry Lab Group",
      "Macroeconomics Study Pod",
      "Thesis Research Cohort",
    ],
    themeColor: "from-purple-600 to-indigo-600",
    priorityStudios: [
      "/study-guide",
      "/listen",
      "/slides",
      "/extract",
      "/memory",
      "/canvas",
      "/health",
      "/convert",
      "/digest",
      "/contracts",
      "/contracts/compare",
    ],
    securityNote: "Collaborative Study Mode active. Flashcards, cheat sheets & quizzes shareable with classmates.",
    defaultPiiRedaction: false,
  },
  office: {
    id: "office",
    name: "Corporate & Team Ops",
    badge: "🏢 Corporate",
    tagline: "Enterprise Team Presence, Standups & Institutional Memory",
    chatLabel: "Office Chats",
    chatPlaceholder: "Search office chats or teammates…",
    groupTypeLabel: "New Team Channel",
    groupPlaceholders: [
      "Sprint 42 Launch Team",
      "Engineering Architecture Sync",
      "Product & Design Huddle",
      "Executive Leadership Sync",
    ],
    themeColor: "from-indigo-600 to-blue-600",
    priorityStudios: [
      "/memory",
      "/digest",
      "/slides",
      "/canvas",
      "/extract",
      "/health",
      "/convert",
      "/study-guide",
      "/listen",
      "/contracts",
      "/contracts/compare",
    ],
    securityNote: "Corporate Ops active. Soft-delete trash, meeting decision graphs & activity logs recorded.",
    defaultPiiRedaction: false,
  },
  legal: {
    id: "legal",
    name: "Legal & Compliance Vault",
    badge: "⚖️ Legal Vault",
    tagline: "Contract Redlines, Expiry Tracking & Strict NDA Masking",
    chatLabel: "Legal Channels",
    chatPlaceholder: "Search legal matters, counsels or channels…",
    groupTypeLabel: "New Matter Channel",
    groupPlaceholders: [
      "Vendor MSA Negotiation 2026",
      "M&A Due Diligence Room",
      "Patent Prosecution Review",
      "SOC2 Compliance Audit Matter",
    ],
    themeColor: "from-rose-600 via-purple-600 to-indigo-600",
    priorityStudios: [
      "/contracts/compare",
      "/contracts",
      "/convert",
      "/canvas",
      "/health",
      "/memory",
      "/digest",
      "/slides",
      "/extract",
      "/study-guide",
      "/listen",
    ],
    securityNote: "Strict NDA & Privilege Vault active. Automated PII redaction and liability audit logs enforced.",
    defaultPiiRedaction: true,
  },
  personal: {
    id: "personal",
    name: "Solo & Freelance Studio",
    badge: "💼 Solo Studio",
    tagline: "Presentations, Audio Briefs & Direct Client Chats",
    chatLabel: "Chats",
    chatPlaceholder: "Search chats or contacts…",
    groupTypeLabel: "New Project Chat",
    groupPlaceholders: [
      "Client Design Review",
      "Freelance Project Sprint",
      "Creative Brief Discussion",
      "General Project Channel",
    ],
    themeColor: "from-purple-600 to-indigo-600",
    priorityStudios: [
      "/slides",
      "/listen",
      "/study-guide",
      "/extract",
      "/canvas",
      "/convert",
      "/memory",
      "/health",
      "/digest",
      "/contracts",
      "/contracts/compare",
    ],
    securityNote: "Universal Solo Studio active. Clean default workspace tools enabled.",
    defaultPiiRedaction: false,
  },
};

interface AudienceModeContextState {
  mode: AudienceMode;
  setMode: (mode: AudienceMode, targetWsId?: string) => void;
  config: AudienceModeConfig;
  modeConfig: AudienceModeConfig;
  allModes: AudienceModeConfig[];
}

const AudienceModeContext = createContext<AudienceModeContextState>({
  mode: "office",
  setMode: () => {},
  config: AUDIENCE_MODES.office,
  modeConfig: AUDIENCE_MODES.office,
  allModes: Object.values(AUDIENCE_MODES),
});

export function AudienceModeProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [mode, setModeState] = useState<AudienceMode>(() => {
    if (typeof window !== "undefined") {
      const storedGlobal = localStorage.getItem("askdocs_global_mode") as AudienceMode | null;
      if (storedGlobal && AUDIENCE_MODES[storedGlobal]) {
        return storedGlobal;
      }
    }
    return "office";
  });

  // Load mode when workspace changes or on mount
  useEffect(() => {
    const wsId = workspace?.id;
    if (wsId) {
      const stored = localStorage.getItem(`askdocs_mode_${wsId}`) as AudienceMode | null;
      if (stored && AUDIENCE_MODES[stored]) {
        setModeState(stored);
        return;
      }
      if (workspace?.audience_mode && AUDIENCE_MODES[workspace.audience_mode]) {
        setModeState(workspace.audience_mode);
        localStorage.setItem(`askdocs_mode_${wsId}`, workspace.audience_mode);
        return;
      }
    }
    const globalDefault = (typeof window !== "undefined" ? localStorage.getItem("askdocs_global_mode") : null) as AudienceMode | null;
    if (globalDefault && AUDIENCE_MODES[globalDefault]) {
      setModeState(globalDefault);
      if (wsId) {
        localStorage.setItem(`askdocs_mode_${wsId}`, globalDefault);
      }
    }
  }, [workspace?.id, workspace?.audience_mode]);

  const setMode = useCallback(
    (newMode: AudienceMode, targetWsId?: string) => {
      if (!AUDIENCE_MODES[newMode]) return;
      setModeState(newMode);
      localStorage.setItem("askdocs_global_mode", newMode);
      const wsId = targetWsId || workspace?.id;
      if (wsId) {
        localStorage.setItem(`askdocs_mode_${wsId}`, newMode);
      }
    },
    [workspace?.id]
  );

  const config = AUDIENCE_MODES[mode] || AUDIENCE_MODES.academic;

  return (
    <AudienceModeContext.Provider
      value={{
        mode,
        setMode,
        config,
        modeConfig: config,
        allModes: Object.values(AUDIENCE_MODES),
      }}
    >
      {children}
    </AudienceModeContext.Provider>
  );
}

export function useAudienceMode() {
  return useContext(AudienceModeContext);
}
