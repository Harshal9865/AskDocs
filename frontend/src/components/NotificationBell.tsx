"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace-context";
import type { Invitation } from "@/lib/types";

export default function NotificationBell() {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<Record<string, { workspace_name: string; inviter_email: string; role: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const { refresh } = useWorkspace();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await api.myInvitations();
      setInvites(list);
      for (const inv of list) {
        if (!previews[inv.id]) {
          try {
            const p = await api.invitationPreview(inv.id);
            setPreviews((prev) => ({ ...prev, [inv.id]: p }));
          } catch {
            /* ignore preview failure */
          }
        }
      }
    } catch {
      /* not signed in yet */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
    pollRef.current = setInterval(() => void load(), 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  async function respond(inv: Invitation, accept: boolean) {
    setBusyId(inv.id);
    try {
      if (accept) {
        await api.acceptInvitation(inv.id);
        await refresh();
        router.refresh();
      } else {
        await api.declineInvitation(inv.id);
      }
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (err) {
      alert((err as Error).message);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${invites.length ? `, ${invites.length} pending invitations` : ""}`}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {invites.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {invites.length > 9 ? "9+" : invites.length}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />

          {/* dropdown — mobile/tablet: fixed sheet below navbar, always in viewport.
              desktop (sm+): normal anchored dropdown at the bell, 320px. */}
          <div
            role="dialog"
            aria-label="Invitations"
            className="
              fixed inset-x-2 top-[4.25rem] z-50
              rounded-xl border border-slate-200 bg-white shadow-2xl
              sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 sm:shadow-xl
            "
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Invitations</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {invites.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                No pending invitations.
              </p>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto p-2 sm:max-h-80">
                {invites.map((inv) => {
                  const p = previews[inv.id];
                  return (
                    <li key={inv.id} className="rounded-lg p-3 hover:bg-slate-50">
                      <p className="text-sm font-medium text-slate-900">
                        {p?.workspace_name ?? "Workspace"}
                      </p>
                      <p className="mb-2 text-xs text-slate-500">
                        {p ? `${p.inviter_email} invited you as ${p.role}` : "Loading…"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void respond(inv, true)}
                          disabled={busyId === inv.id}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => void respond(inv, false)}
                          disabled={busyId === inv.id}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
