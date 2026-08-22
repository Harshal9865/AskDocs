"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Workspace } from "@/lib/types";

const WS_KEY = "askdocs_workspace";

interface WsState {
  workspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  select: (ws: Workspace) => void;
  /** Refetches the list and re-resolves selection (saved ID first, then first). */
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

  const load = useCallback(async () => {
    try {
      const list = await api.listWorkspaces();
      setWorkspaces(list);
      const savedId = localStorage.getItem(WS_KEY);
      setWorkspace((current) => {
        // keep current if still valid, else saved, else first
        if (current && list.some((w) => w.id === current.id)) return current;
        return list.find((w) => w.id === savedId) ?? list[0] ?? null;
      });
    } catch {
      /* not authenticated yet */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const select = useCallback((ws: Workspace) => {
    setWorkspace(ws);
    localStorage.setItem(WS_KEY, ws.id);
  }, []);

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
