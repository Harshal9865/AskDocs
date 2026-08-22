"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import type { Member } from "@/lib/types";

function PresenceDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
        online ? "bg-emerald-500" : "bg-slate-300"
      }`}
      title={online ? "Online" : "Offline"}
      aria-label={online ? "Online" : "Offline"}
    />
  );
}

export default function Colleagues() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      setMembers(await api.listMembers(workspace.id));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    setMembers([]);
    setLoading(true);
    void load();
    const t = setInterval(() => void load(), 30000); // refresh presence dots
    return () => clearInterval(t);
  }, [load]);

  // heartbeat: keep my presence alive while app is open
  useEffect(() => {
    const ping = () => void api.presencePing().catch(() => {});
    ping(); // immediate first ping
    const t = setInterval(ping, 20000);
    const onUnload = () => navigator.sendBeacon?.("/api/v1/presence/ping");
    window.addEventListener("beforeunload", onUnload);
    return () => {
      clearInterval(t);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  if (!workspace || loading) return null;
  const colleagues = members.filter((m) => m.email !== user?.email);
  if (colleagues.length === 0) return null;

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div className="border-t border-slate-100 p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Colleagues
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <PresenceDot online={onlineCount > 0} />
          {onlineCount}/{members.length} online
        </span>
      </div>
      <ul className="space-y-0.5">
        {colleagues.map((m) => (
          <li
            key={m.user_id}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-700"
            title={m.email}
          >
            <PresenceDot online={m.online} />
            <span className="truncate">{m.name ?? m.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
