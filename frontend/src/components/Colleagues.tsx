"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import Avatar from "@/components/Avatar";
import type { Member } from "@/lib/types";

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
    return () => clearInterval(t);
  }, []);

  if (!workspace || loading) return null;
  const colleagues = members.filter((m) => m.email !== user?.email);
  if (colleagues.length === 0) return null;

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div className="border-t border-slate-200/70 p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Colleagues
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
          {onlineCount}/{members.length} online
        </span>
      </div>
      <ul className="space-y-0.5">
        {colleagues.map((m) => (
          <li key={m.user_id}>
            <div
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              title={m.online ? `${m.name} — Online` : `${m.name} — Offline`}
            >
              <Avatar name={m.name || m.email} size={28} showPresence online={m.online} />
              <span className="truncate text-[13px] text-slate-700">{m.name || m.email}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
