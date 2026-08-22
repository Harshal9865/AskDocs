"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Workspace } from "@/lib/types";

const WS_KEY = "askdocs_workspace";

interface WsState {
  workspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  select: (ws: Workspace) => void;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WsState>({
  workspace: null,
  workspaces: [],
  loading: true,
  select: () => {},
  refresh: async () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await api.listWorkspaces();
      setWorkspaces(list);
      const savedId = localStorage.getItem(WS_KEY);
      const saved = list.find((w) => w.id === savedId) ?? list[0] ?? null;
      setWorkspace(saved);
    } catch {
      /* not authenticated yet */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const select = (ws: Workspace) => {
    setWorkspace(ws);
    localStorage.setItem(WS_KEY, ws.id);
  };

  return (
    <WorkspaceContext.Provider
      value={{ workspace, workspaces, loading, select, refresh: load }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
