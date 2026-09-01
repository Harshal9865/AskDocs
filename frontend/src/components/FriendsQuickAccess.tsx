"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import type { Member } from "@/lib/types";
import { ChevronRight, HeartHandshake, UsersRound } from "lucide-react";

function FriendRow({ m, onClick }: { m: Member; onClick: () => void }) {
  const { src, stickerId } = useUserAvatar(m.user_id, m.avatar_kind, m.avatar_value);
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
      title={m.online ? `${m.name || m.email} — Online (view profile)` : `${m.name || m.email} — Offline (view profile)`}
    >
      <Avatar name={m.name || m.email} size={26} src={src} stickerId={stickerId} showPresence online={m.online} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-700 group-hover:text-purple-600 dark:text-zinc-300 dark:group-hover:text-purple-400 transition-colors">
        {m.name || m.email}
      </span>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.online ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"}`} />
    </button>
  );
}

export default function FriendsQuickAccess() {
  const { user } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Member[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await api.listFriends();
      setFriends(list as unknown as Member[]);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  if (friends.length === 0) return null;

  const onlineCount = friends.filter((f) => f.online).length;
  const sorted = [...friends].sort((a, b) => Number(b.online ?? 0) - Number(a.online ?? 0));
  const displayed = sorted.slice(0, 4);
  const hasMore = friends.length > 4;
  const remainingCount = friends.length - 4;

  return (
    <div className="border-t border-slate-200/70 p-3 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          onClick={() => router.push("/friends")}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <HeartHandshake className="h-3.5 w-3.5" /> Friends
        </button>
        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
          <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"}`} />
          {onlineCount}/{friends.length} online
        </span>
      </div>

      <ul className="space-y-0.5">
        {displayed.map((m) => (
          <li key={m.user_id}>
            <FriendRow m={m} onClick={() => router.push(`/profile/${m.user_id}`)} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={() => router.push("/friends")}
          className="mt-1.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30 dark:hover:text-purple-300 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5" />
            View all ({friends.length})
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
