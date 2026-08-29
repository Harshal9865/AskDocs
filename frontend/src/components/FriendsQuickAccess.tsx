"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import type { Member } from "@/lib/types";
import { HeartHandshake } from "lucide-react";

function FriendRow({ m, onClick }: { m: Member; onClick: () => void }) {
  const { src, stickerId } = useUserAvatar(m.user_id, m.avatar_kind, m.avatar_value);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-white/5"
      title={m.online ? `${m.name || m.email} — Online` : `${m.name || m.email} — Offline`}
    >
      <Avatar name={m.name || m.email} size={28} src={src} stickerId={stickerId} showPresence online={m.online} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-700 dark:text-zinc-300">{m.name || m.email}</span>
      <span className={`h-2 w-2 shrink-0 rounded-full ${m.online ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"}`} />
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
  const visible = sorted.slice(0, 6);

  return (
    <div className="border-t border-slate-200/70 p-3 dark:border-white/5">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          onClick={() => router.push("/friends")}
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          <HeartHandshake className="h-3.5 w-3.5" /> Friends
        </button>
        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
          {onlineCount}/{friends.length} online
        </span>
      </div>
      <ul className="space-y-0.5">
        {visible.map((m) => (
          <li key={m.user_id}>
            <FriendRow m={m} onClick={() => router.push(`/profile/${m.user_id}`)} />
          </li>
        ))}
      </ul>
      {friends.length > 6 && (
        <button
          onClick={() => router.push("/friends")}
          className="mt-2 w-full rounded-lg py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-[#1DB954] dark:hover:bg-white/5"
        >
          View all {friends.length} →
        </button>
      )}
    </div>
  );
}
