"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  UserPlus, 
  Users, 
  Shield, 
  MessageSquare, 
  Trash2, 
  Clock, 
  Activity, 
  Mail, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import Avatar from "@/components/Avatar";
import { useUserAvatar } from "@/lib/use-user-avatar";
import { showToast } from "@/components/Toast";
import type { Invitation, JoinRequest, Member, Role } from "@/lib/types";

const ROLES: Role[] = ["viewer", "member", "admin"];
type MemberSort = "name_asc" | "name_desc" | "role_admin" | "status_online";
type MemberFilter = "all" | Role | "online";

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
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [inviteBusy, setInviteBusy] = useState(false);

  // Filters and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberFilter>("all");
  const [sortBy, setSortBy] = useState<MemberSort>("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Active user role
  const [myRole, setMyRole] = useState<Role>("viewer");
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      const list = await api.listMembers(workspace.id);
      setMembers(list);
      const me = list.find((m) => m.email === user?.email);
      setMyRole(me?.role ?? "viewer");
      if (me?.role === "admin") {
        const [invites, reqs] = await Promise.all([
          api.listWorkspaceInvitations(workspace.id).catch(() => [] as Invitation[]),
          api.listJoinRequests(workspace.id).catch(() => [] as JoinRequest[]),
        ]);
        setPendingInvites(invites);
        setJoinRequests(reqs.filter((r) => r.status === "pending"));
      }
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspace, user]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 20000);
    return () => clearInterval(t);
  }, [load]);

  // Invite handler
  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const emailToInvite = inviteEmail.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailToInvite)) {
      showToast("error", "Please enter a valid email address (e.g. name@domain.com)");
      return;
    }
    if (!workspace) return;
    setInviteBusy(true);
    try {
      await api.addMember(workspace.id, emailToInvite, inviteRole);
      setInviteEmail("");
      showToast("success", `Invitation sent to ${emailToInvite}`);
      await load();
    } catch (err) {
      showToast("error", (err as Error).message || "Failed to invite member");
    } finally {
      setInviteBusy(false);
    }
  }

  // Change member role
  async function changeRole(member: Member, role: Role) {
    if (!workspace) return;
    const adminCount = members.filter((m) => m.role === "admin").length;
    if (member.role === "admin" && role !== "admin" && adminCount <= 1) {
      alert("Cannot downgrade the only administrator in this workspace. Promote another member to admin first.");
      return;
    }
    setActionBusyId(member.user_id);
    try {
      await api.updateMemberRole(workspace.id, member.user_id, role);
      showToast("success", `Updated ${member.name || member.email}'s role to ${role}`);
      await load();
    } catch (err) {
      showToast("error", (err as Error).message || "Failed to update role");
    } finally {
      setActionBusyId(null);
    }
  }

  // Remove member
  async function remove(member: Member) {
    if (!workspace) return;
    const adminCount = members.filter((m) => m.role === "admin").length;
    if (member.role === "admin" && adminCount <= 1) {
      alert("Cannot remove the only administrator in this workspace.");
      return;
    }
    if (!confirm(`Are you sure you want to remove ${member.name || member.email} from ${workspace.name}?`)) return;
    setActionBusyId(member.user_id);
    try {
      await api.removeMember(workspace.id, member.user_id);
      showToast("success", `Removed ${member.name || member.email}`);
      await load();
    } catch (err) {
      showToast("error", (err as Error).message || "Failed to remove member");
    } finally {
      setActionBusyId(null);
    }
  }

  // Cancel invitation
  async function cancelInvite(inv: Invitation) {
    if (!workspace || !confirm(`Cancel invitation for ${inv.email}?`)) return;
    try {
      await api.cancelInvitation(workspace.id, inv.id);
      showToast("success", `Cancelled invitation for ${inv.email}`);
      await load();
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  // Handle join requests
  async function handleJoinRequest(reqId: string, action: "approve" | "reject") {
    if (!workspace) return;
    try {
      if (action === "approve") {
        await api.approveJoinRequest(workspace.id, reqId);
        showToast("success", "Join request approved");
      } else {
        await api.rejectJoinRequest(workspace.id, reqId);
        showToast("success", "Join request rejected");
      }
      await load();
    } catch (err) {
      showToast("error", (err as Error).message);
    }
  }

  // Start Direct Message
  async function startDM(member: Member) {
    if (!workspace) return;
    try {
      await api.createDirectChat(workspace.id, member.user_id);
      router.push("/chats");
    } catch {
      router.push("/chats");
    }
  }

  // Filter & Search Logic
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchText = !q || (m.name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q) || (m.role ?? "").toLowerCase().includes(q);
      if (!matchText) return false;
      if (roleFilter === "all") return true;
      if (roleFilter === "online") return m.online;
      return m.role === roleFilter;
    }).sort((a, b) => {
      if (sortBy === "name_asc") {
        return (a.name || a.email).localeCompare(b.name || b.email);
      }
      if (sortBy === "name_desc") {
        return (b.name || b.email).localeCompare(a.name || a.email);
      }
      if (sortBy === "role_admin") {
        const order: Record<Role, number> = { admin: 0, member: 1, viewer: 2 };
        return (order[a.role] ?? 3) - (order[b.role] ?? 3);
      }
      if (sortBy === "status_online") {
        return (b.online ? 1 : 0) - (a.online ? 1 : 0);
      }
      return 0;
    });
  }, [members, searchQuery, roleFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, sortBy, pageSize]);

  if (!workspace) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-white/10 dark:bg-[#121214] dark:text-zinc-400">
        Create or select a workspace first.
      </div>
    );
  }

  const isAdmin = myRole === "admin";
  const onlineCount = members.filter((m) => m.online).length;
  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      
      {/* Header & Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Workspace Members</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Manage teammates, roles, pending invites, and workspace access for {workspace.name}.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121214]">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Total Members
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{members.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121214]">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Activity className="h-4 w-4" />
            Online Now
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{onlineCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121214]">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Shield className="h-4 w-4" />
            Administrators
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{adminCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121214]">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            Pending / Reqs
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{pendingInvites.length + joinRequests.length}</p>
        </div>
      </div>

      {/* Invite Member Section (Admin Only) */}
      {isAdmin && (
        <div className="rounded-2xl border border-purple-200/70 bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/30 p-5 shadow-sm dark:border-purple-900/30 dark:bg-[#15121e]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Invite New Member
          </h2>
          <form onSubmit={invite} className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-white/10 dark:bg-[#121214] dark:text-white transition-all"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-purple-600 dark:border-white/10 dark:bg-[#121214] dark:text-zinc-200"
              aria-label="Role for new member"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={inviteBusy}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700 active:scale-[0.99] disabled:opacity-50 transition-all shadow-sm"
            >
              {inviteBusy ? "Inviting…" : "Send Invite"}
            </button>
          </form>
        </div>
      )}

      {/* Pending Invites & Join Requests Accordion / Card */}
      {isAdmin && (pendingInvites.length > 0 || joinRequests.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Pending Invitations */}
          {pendingInvites.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121214]">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Pending Invitations ({pendingInvites.length})
              </h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {pendingInvites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-sm dark:bg-white/5">
                    <span className="truncate min-w-0 pr-2">
                      <span className="font-medium text-slate-800 dark:text-zinc-200">{inv.email}</span>
                      <span className="ml-2 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {inv.role}
                      </span>
                    </span>
                    <button
                      onClick={() => void cancelInvite(inv)}
                      className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Join Requests */}
          {joinRequests.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#121214]">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Join Requests ({joinRequests.length})
              </h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {joinRequests.map((req) => (
                  <li key={req.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2.5 text-sm dark:bg-white/5">
                    <div className="min-w-0 flex-1 truncate">
                      <p className="font-semibold text-slate-800 dark:text-zinc-100">{req.user_name || req.user_email}</p>
                      <p className="text-xs text-slate-400 truncate">{req.user_email}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => void handleJoinRequest(req.id, "approve")}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => void handleJoinRequest(req.id, "reject")}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Members Management Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#121214] overflow-hidden">
        
        {/* Toolbar: Search, Filters & Sorters */}
        <div className="border-b border-slate-100 p-4 dark:border-white/10 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member by name, email, or role…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-purple-600 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500 transition-all"
              />
            </div>

            {/* Sorter */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as MemberSort)}
                className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-[#181818] dark:text-zinc-300 outline-none"
              >
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="role_admin">Role (Admins first)</option>
                <option value="status_online">Status (Online first)</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white py-2 px-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-[#181818] dark:text-zinc-300 outline-none"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: "all" as const, label: "All Members", count: members.length },
              { id: "online" as const, label: "Online", count: onlineCount },
              { id: "admin" as const, label: "Admins", count: adminCount },
              { id: "member" as const, label: "Members", count: members.filter((m) => m.role === "member").length },
              { id: "viewer" as const, label: "Viewers", count: members.filter((m) => m.role === "viewer").length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setRoleFilter(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  roleFilter === f.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
                }`}
              >
                {f.label} <span className={`ml-1 text-[10px] ${roleFilter === f.id ? "text-purple-100" : "text-slate-400 dark:text-zinc-500"}`}>({f.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Member List */}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading workspace members…</div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No members matched your search</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Try clearing filters or search terms</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {paginatedMembers.map((m) => {
              const isMe = m.email === user?.email;
              const isActionBusy = actionBusyId === m.user_id;

              return (
                <div
                  key={m.user_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Member Info */}
                  <div
                    onClick={() => router.push(`/profile/${m.user_id}`)}
                    className="flex min-w-0 flex-1 items-center gap-3.5 cursor-pointer group"
                  >
                    <MemberAvatar member={m} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-slate-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400 transition-colors">
                          {m.name || m.email}
                        </span>
                        {isMe && (
                          <span className="rounded-full bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-400">
                            You
                          </span>
                        )}
                        <span className={`text-[11px] font-medium ${m.online ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`}>
                          · {m.online ? "Online" : "Offline"}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {m.email}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Role Selector */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isMe && (
                      <button
                        onClick={() => void startDM(m)}
                        title="Send direct message"
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-2 text-slate-600 hover:text-purple-600 dark:text-zinc-300 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}

                    {isAdmin && !isMe ? (
                      <div className="flex items-center gap-2">
                        <select
                          disabled={isActionBusy}
                          value={m.role}
                          onChange={(e) => void changeRole(m, e.target.value as Role)}
                          className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181818] px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none focus:border-purple-600 disabled:opacity-50"
                          aria-label={`Change role for ${m.email}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={isActionBusy}
                          onClick={() => void remove(m)}
                          title="Remove from workspace"
                          className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                        m.role === "admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300"
                          : m.role === "member"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}>
                        {m.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredMembers.length > pageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredMembers.length)} of {filteredMembers.length} members
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

