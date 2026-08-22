import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.invitation import Invitation
from app.models.activity import log_activity
from app.models.user import User
from app.models.workspace import Role, Workspace, WorkspaceMember
from app.schemas.workspace import InvitationOut

router = APIRouter()


@router.get("/invitations", response_model=list[InvitationOut])
async def my_invitations(db: DbSession, user: CurrentUser):
    """All pending invitations addressed to my email."""
    result = await db.execute(
        select(Invitation).where(
            Invitation.email == user.email,
            Invitation.status == "pending",
        )
    )
    invites = list(result.scalars().all())
    # filter expired
    from app.models.base import utcnow

    valid = [i for i in invites if i.expires_at is None or i.expires_at > utcnow()]
    return valid


@router.get("/invitations/{invitation_id}/workspace", response_model=dict)
async def invitation_preview(invitation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Peek at workspace name before accepting."""
    result = await db.execute(
        select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.email == user.email,
            Invitation.status == "pending",
        )
    )
    invite = result.scalar_one_or_none()
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation not found")
    ws = await db.get(Workspace, invite.workspace_id)
    inviter = await db.get(User, invite.inviter_id)
    return {
        "workspace_name": ws.name if ws else "Unknown workspace",
        "inviter_email": inviter.email if inviter else "unknown",
        "role": invite.role.value if hasattr(invite.role, "value") else str(invite.role),
    }


@router.post("/invitations/{invitation_id}/accept", response_model=InvitationOut)
async def accept_invitation(
    invitation_id: uuid.UUID, db: DbSession, user: CurrentUser
):
    result = await db.execute(
        select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.email == user.email,
            Invitation.status == "pending",
        )
    )
    invite = result.scalar_one_or_none()
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation not found")
    if invite.expires_at is not None:
        from app.models.base import utcnow

        if invite.expires_at <= utcnow():
            raise HTTPException(status.HTTP_410_GONE, "Invitation expired")

    already = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == invite.workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if already.scalar_one_or_none():
        invite.status = "accepted"
        await db.commit()
        raise HTTPException(status.HTTP_409_CONFLICT, "Already a member of this workspace")

    member = WorkspaceMember(
        workspace_id=invite.workspace_id,
        user_id=user.id,
        role=Role(invite.role.value) if hasattr(invite.role, "value") else Role(invite.role),
    )
    db.add(member)
    await log_activity(db, invite.workspace_id, user.id, 'member.joined', user.email)
    invite.status = "accepted"
    await db.commit()
    await db.refresh(invite)
    return invite


@router.post("/invitations/{invitation_id}/decline", response_model=InvitationOut)
async def decline_invitation(
    invitation_id: uuid.UUID, db: DbSession, user: CurrentUser
):
    result = await db.execute(
        select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.email == user.email,
            Invitation.status == "pending",
        )
    )
    invite = result.scalar_one_or_none()
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation not found")
    invite.status = "declined"
    await db.commit()
    return invite

