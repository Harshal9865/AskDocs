import re
import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select

from app.core.deps import AdminMembership, CurrentUser, DbSession, Membership
from app.models.chat import Conversation, Message
from app.models.document import Chunk, Document
from app.models.invitation import Invitation
from app.models.user import User
from app.models.workspace import Role, Workspace, WorkspaceMember
from app.schemas.workspace import (
    InvitationOut,
    MemberAdd,
    MemberOut,
    MemberUpdate,
    WorkspaceCreate,
    WorkspaceOut,
)

router = APIRouter()

VALID_ROLES = {r.value for r in Role}


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "workspace"


@router.post("", response_model=WorkspaceOut, status_code=201)
async def create_workspace(payload: WorkspaceCreate, db: DbSession, user: CurrentUser):
    slug = _slugify(payload.name)
    existing = await db.execute(select(Workspace).where(Workspace.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Workspace name already taken")
    ws = Workspace(name=payload.name, slug=slug, created_by=user.id)
    db.add(ws)
    await db.flush()
    db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=Role.admin))
    await db.commit()
    await db.refresh(ws)
    return ws


@router.get("", response_model=list[WorkspaceOut])
async def list_workspaces(db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user.id)
    )
    return list(result.scalars().all())


@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def get_workspace(workspace_id: uuid.UUID, db: DbSession, membership: Membership):
    ws = await db.get(Workspace, membership.workspace_id)
    return ws


@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(workspace_id: uuid.UUID, db: DbSession, membership: AdminMembership):
    """Admin-only. Removes the workspace and everything in it."""
    ws_id = membership.workspace_id

    conversation_ids = select(Conversation.id).where(Conversation.workspace_id == ws_id)
    await db.execute(delete(Message).where(Message.conversation_id.in_(conversation_ids)))
    await db.execute(delete(Conversation).where(Conversation.workspace_id == ws_id))

    document_ids = select(Document.id).where(Document.workspace_id == ws_id)
    await db.execute(delete(Chunk).where(Chunk.document_id.in_(document_ids)))
    await db.execute(delete(Document).where(Document.workspace_id == ws_id))

    await db.execute(delete(WorkspaceMember).where(WorkspaceMember.workspace_id == ws_id))
    from app.models.invitation import Invitation

    await db.execute(delete(Invitation).where(Invitation.workspace_id == ws_id))
    await db.execute(delete(Workspace).where(Workspace.id == ws_id))
    await db.commit()


@router.get("/{workspace_id}/members", response_model=list[MemberOut])
async def list_members(workspace_id: uuid.UUID, db: DbSession, membership: Membership):
    from app.api.v1.presence import is_online

    result = await db.execute(
        select(WorkspaceMember, User)
        .join(User, User.id == WorkspaceMember.user_id)
        .where(WorkspaceMember.workspace_id == membership.workspace_id)
    )
    return [
        MemberOut(
            user_id=m.user_id,
            email=u.email,
            role=m.role.value if isinstance(m.role, Role) else m.role,
            online=is_online(u.last_seen_at),
            last_seen_at=u.last_seen_at,
        )
        for m, u in result.all()
    ]


@router.post("/{workspace_id}/members", response_model=InvitationOut, status_code=201)
async def add_member(
    workspace_id: uuid.UUID,
    payload: MemberAdd,
    db: DbSession,
    membership: AdminMembership,
):
    """Create a pending invitation. The invitee must accept to join."""
    if payload.role not in VALID_ROLES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid role")
    email = payload.email.strip().lower()

    # already a member?
    dup_member = await db.execute(
        select(WorkspaceMember.user_id)
        .join(User, User.id == WorkspaceMember.user_id)
        .where(
            WorkspaceMember.workspace_id == membership.workspace_id,
            User.email == email,
        )
    )
    if dup_member.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Already a member")

    # pending invitation already exists?
    dup_invite = await db.execute(
        select(Invitation).where(
            Invitation.workspace_id == membership.workspace_id,
            Invitation.email == email,
            Invitation.status == "pending",
        )
    )
    if dup_invite.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Invitation already pending")

    invite = Invitation(
        workspace_id=membership.workspace_id,
        inviter_id=membership.user_id,
        email=email,
        role=Role(payload.role),
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return InvitationOut.model_validate(invite)


@router.delete("/{workspace_id}/invitations/{invitation_id}", status_code=204)
async def cancel_invitation(
    workspace_id: uuid.UUID,
    invitation_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
):
    result = await db.execute(
        select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.workspace_id == membership.workspace_id,
            Invitation.status == "pending",
        )
    )
    invite = result.scalar_one_or_none()
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation not found")
    invite.status = "cancelled"
    await db.commit()


@router.get("/{workspace_id}/invitations", response_model=list[InvitationOut])
async def list_workspace_invitations(
    workspace_id: uuid.UUID, db: DbSession, membership: AdminMembership
):
    result = await db.execute(
        select(Invitation).where(
            Invitation.workspace_id == membership.workspace_id,
            Invitation.status == "pending",
        )
    )
    return list(result.scalars().all())


async def _count_admins(db, workspace_id) -> int:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.role == Role.admin,
        )
    )
    return len(result.scalars().all())


@router.patch("/{workspace_id}/members/{user_id}", response_model=MemberOut)
async def update_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: MemberUpdate,
    db: DbSession,
    membership: AdminMembership,
):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid role")
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == membership.workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    old_role = member.role.value if isinstance(member.role, Role) else member.role
    new_role = Role(payload.role)
    if old_role == "admin" and new_role != Role.admin and await _count_admins(db, membership.workspace_id) <= 1:
        raise HTTPException(status.HTTP_409_CONFLICT, "Cannot demote the last admin")
    member.role = new_role
    await db.commit()
    target = await db.get(User, member.user_id)
    return MemberOut(user_id=member.user_id, email=target.email, role=payload.role)


@router.delete("/{workspace_id}/members/{user_id}", status_code=204)
async def remove_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
):
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == membership.workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    old_role = member.role.value if isinstance(member.role, Role) else member.role
    if old_role == "admin" and await _count_admins(db, membership.workspace_id) <= 1:
        raise HTTPException(status.HTTP_409_CONFLICT, "Cannot remove the last admin")
    await db.delete(member)
    await db.commit()
