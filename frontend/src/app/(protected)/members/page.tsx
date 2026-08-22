"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import type { Member, Role } from "@/lib/types";

const ROLES: Role[] = ["viewer", "member", "admin"];

export default function MembersPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
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
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !inviteEmail.trim()) return;
    try {
      await api.addMember(workspace.id, inviteEmail.trim(), inviteRole);
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

  if (!workspace) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center text-zinc-500">
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
          ? "Invite teammates and manage their access."
          : "People with access to this workspace."}
      </p>

      {isAdmin && (
        <form onSubmit={invite} className="mb-6 flex gap-2">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@company.com (must have an AskDocs account)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Invite
          </button>
        </form>
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
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{m.email}</div>
                <div className="text-xs font-medium capitalize text-indigo-600">{m.role}</div>
              </div>
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) =>
                      void changeRole(m, e.target.value as Role)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void remove(m)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-500">{m.role}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

