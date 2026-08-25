"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import type { Invitation, JoinRequest, Member, Role } from "@/lib/types";

const ROLES: Role[] = ["viewer", "member", "admin"];

function MemberAvatar({ member, size }: { member: Member; size: number }) {
  const { src, stickerId } = useUserAvatar(
    member.user_id,
    member.avatar_kind,
    member.avatar_value,
  );
  return (
    <Avatar
      name={member.name || member.email}
      size={size}
      showPresence
      online={member.online}
      src={src}
      stickerId={stickerId}
    />
  );
}

export default function MembersPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [myRole, setMyRole] = useState<Role>("viewer");

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      const list = await api.listMembers(workspace.id);
      setMembers(list);
      const me = list.find((m) => m.email === user?.email);
      setMyRole(me?.role ?? "viewer");
      if (me?.role === "admin") {
        const [invites, reqs] = await Promise.all([
          api.listWorkspaceInvitations(workspace.id),
          api.listJoinRequests(workspace.id).catch(() => [] as JoinRequest[]),
        ]);
        setPendingInvites(invites);
        setJoinRequests(reqs);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace, user]);

  useEffect(() => {
    void load();
    // poll presence so dots stay fresh on this page
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !inviteEmail.trim()) return;
    try {
      await api.addMember(workspace.id, inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail("");
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function changeRole(member: Member, role: Role) {
    if (!workspace) return;
    try {
      await api.updateMemberRole(workspace.id, member.user_id, role);
      await load();
    } catch (err) {
      alert((err as Error).message);
      await load();
    }
  }

  async function remove(member: Member) {
    if (!workspace || !confirm(`Remove ${member.email}?`)) return;
    try {
      await api.removeMember(workspace.id, member.user_id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function cancelInvite(inv: Invitation) {
    if (!workspace || !confirm(`Cancel invitation for ${inv.email}?`)) return;
    try {
      await api.cancelInvitation(workspace.id, inv.id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleJoinRequest(reqId: string, action: "approve" | "reject") {
    if (!workspace) return;
    try {
      if (action === "approve") await api.approveJoinRequest(workspace.id, reqId);
      else await api.rejectJoinRequest(workspace.id, reqId);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (!workspace) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Create or select a workspace first.
      </div>
    );
  }

  const isAdmin = myRole === "admin";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold">Members</h1>
      <p className="mb-6 text-sm text-slate-600">
        {isAdmin
          ? "Invite teammates — they accept from the notification bell after signing in."
          : "People with access to this workspace."}
      </p>

      {isAdmin && (
        <>
        <form onSubmit={invite} className="mb-4 flex flex-wrap gap-2">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="min-w-[180px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            aria-label="Role for new member"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Invite
          </button>
        </form>

          {pendingInvites.length > 0 && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pending invitations ({pendingInvites.length})
              </h2>
              <ul className="space-y-2">
                {pendingInvites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      {inv.email}{" "}
                      <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                        {inv.role}
                      </span>
                    </span>
                    <button
                      onClick={() => void cancelInvite(inv)}
                      aria-label={`Cancel invitation for ${inv.email}`}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {joinRequests.length > 0 && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Join requests ({joinRequests.length})
              </h2>
              <ul className="space-y-2">
                {joinRequests.map((req) => (
                  <li key={req.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{req.user_name || req.user_email}</span>
                      <span className="ml-1 text-xs text-slate-500">{req.user_email}</span>
                      {req.message && <span className="ml-2 text-xs italic text-slate-400">&quot;{req.message}&quot;</span>}
                    </span>
                    <span className="flex gap-1.5">
                      <button
                        onClick={() => void handleJoinRequest(req.id, "approve")}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => void handleJoinRequest(req.id, "reject")}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Reject
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading members…</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#121212]"
            >
              <button
                onClick={() => (window.location.href = `/profile/${m.user_id}`)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-80"
              >
                <MemberAvatar member={m} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium dark:text-white">{m.name || m.email}</div>
                  <div className="truncate text-xs text-slate-500 dark:text-zinc-400">
                    {m.name ? `${m.email} · ` : ""}
                    {m.role}
                  </div>
                </div>
              </button>
              {isAdmin && m.email !== user?.email ? (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => void changeRole(m, e.target.value as Role)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    aria-label={`Change role for ${m.email}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void remove(m)}
                    aria-label={`Remove ${m.email}`}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium capitalize text-indigo-600">{m.role}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

