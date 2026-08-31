"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import type { Member } from "@/lib/types";

function ColleagueAvatar({ m }: { m: Member }) {
  const { src, stickerId } = useUserAvatar(m.user_id, m.avatar_kind, m.avatar_value);
  return (
    <Avatar
      name={m.name || m.email}
      size={26}
      showPresence
      online={m.online}
      src={src}
      stickerId={stickerId}
    />
  );
}

export default function Colleagues() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();
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
    ping();
    const t = setInterval(ping, 20000);
    return () => clearInterval(t);
  }, []);

  if (!workspace || loading) return null;
  const colleagues = members
    .filter((m) => m.email !== user?.email)
    .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

  if (colleagues.length === 0) return null;

  const onlineCount = members.filter((m) => m.online).length;
  const displayed = colleagues.slice(0, 4);
  const hasMore = colleagues.length > 4;
  const remainingCount = colleagues.length - 4;

  return (
    <div className="border-t border-slate-200/70 p-3 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Colleagues
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
          <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"}`} />
          {onlineCount}/{members.length} online
        </span>
      </div>
      <ul className="space-y-0.5">
        {displayed.map((m) => (
          <li key={m.user_id}>
            <button
              onClick={() => router.push(`/profile/${m.user_id}`)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
              title={m.online ? `${m.name || m.email} — Online (view profile)` : `${m.name || m.email} — Offline (view profile)`}
            >
              <ColleagueAvatar m={m} />
              <span className="truncate text-[13px] text-slate-700 group-hover:text-purple-600 dark:text-zinc-300 dark:group-hover:text-purple-400 font-medium transition-colors">
                {m.name || m.email}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={() => router.push("/members")}
          className="mt-1.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30 dark:hover:text-purple-300 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            View all ({colleagues.length})
          </span>
          <span className="flex items-center gap-0.5 text-[11px] opacity-80">
            +{remainingCount} more
            <ChevronRight className="h-3 w-3" />
          </span>
        </button>
      )}
    </div>
  );
}
