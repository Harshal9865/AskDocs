import logging
import re
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import delete, select, text

from app.core.deps import AdminMembership, CurrentUser, DbSession, Membership
from app.models.activity import log_activity
from app.models.chat import Conversation, Message
from app.models.document import Chunk, Document
from app.models.invitation import Invitation
from app.models.join_request import WorkspaceJoinRequest
from app.models.user import User
from app.models.workspace import Role, Workspace, WorkspaceMember

logger = logging.getLogger(__name__)

from app.schemas.workspace import (
    InvitationOut,
    JoinRequestOut,
    MemberAdd,
    MemberOut,
    MemberUpdate,
    WorkspaceCreate,
    WorkspaceOut,
)
from app.services.plan_enforcement import check_workspace_limit

router = APIRouter()

VALID_ROLES = {r.value for r in Role}

def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "workspace"


@router.post("", response_model=WorkspaceOut, status_code=201)
async def create_workspace(payload: WorkspaceCreate, db: DbSession, user: CurrentUser):
    await check_workspace_limit(db, user)
    slug = _slugify(payload.name)
    existing = await db.execute(select(Workspace).where(Workspace.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Workspace name already taken")
    ws = Workspace(name=payload.name, slug=slug, created_by=user.id)
    db.add(ws)
    await db.flush()
    await log_activity(db, ws.id, user.id, 'workspace.created', ws.name)
    db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=Role.admin))
    await db.commit()
    await db.refresh(ws)
    return ws


@router.get("", response_model=list[WorkspaceOut])
async def list_workspaces(db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user.id)
    )
    out: list[WorkspaceOut] = []
    for ws, role in result.all():
        wo = WorkspaceOut.model_validate(ws)
        wo.role = role.value if isinstance(role, Role) else str(role)
        out.append(wo)
    return out


@router.get("/public", response_model=list[WorkspaceOut])
async def list_public_workspaces(
    db: DbSession,
    user: CurrentUser,
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
):
    """Discoverable public workspaces."""
    from sqlalchemy import func

    query = select(Workspace).where(Workspace.is_public == True)  # noqa: E712
    if q:
        # escape %_ for ilike
        safe = q.strip().replace("%", r"\%").replace("_", r"\_")
        like = f"%{safe}%"
        query = query.where(Workspace.name.ilike(like) | Workspace.slug.ilike(like))
    query = query.order_by(Workspace.created_at.desc()).limit(min(limit, 50)).offset(offset)
    result = await db.execute(query)
    all_public = list(result.scalars().all())
    
    # get membership roles for this user
    memberships = await db.execute(select(WorkspaceMember).where(WorkspaceMember.user_id == user.id))
    roles_map = {m.workspace_id: m.role.value for m in memberships.scalars().all()}

    # add member counts
    out: list[WorkspaceOut] = []
    for w in all_public:
        cnt = await db.execute(select(func.count(WorkspaceMember.user_id)).where(WorkspaceMember.workspace_id == w.id))
        wc = cnt.scalar() or 0
        wo = WorkspaceOut.model_validate(w)
        wo.member_count = wc
        wo.role = roles_map.get(w.id)  # set role if already joined
        out.append(wo)
    return out


@router.get("/join-requests/me", response_model=list[JoinRequestOut])
async def my_join_requests(db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(WorkspaceJoinRequest)
        .where(WorkspaceJoinRequest.user_id == user.id)
        .order_by(WorkspaceJoinRequest.created_at.desc())
    )
    items = list(result.scalars().all())
    out = []
    for r in items:
        ws = await db.get(Workspace, r.workspace_id)
        out.append(
            JoinRequestOut(
                id=r.id,
                workspace_id=r.workspace_id,
                workspace_name=ws.name if ws else None,
                user_id=r.user_id,
                message=r.message,
                status=r.status,
                created_at=r.created_at,
                reviewed_at=r.reviewed_at,
                user_email=user.email,
                user_name=user.name,
            )
        )
    return out


@router.delete("/join-requests/{request_id}", status_code=204)
async def withdraw_join_request(request_id: uuid.UUID, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(WorkspaceJoinRequest).where(
            WorkspaceJoinRequest.id == request_id,
            WorkspaceJoinRequest.user_id == user.id,
            WorkspaceJoinRequest.status == "pending",
        )
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Join request not found")
    await db.delete(req)
    await db.commit()


@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def get_workspace(workspace_id: uuid.UUID, db: DbSession, membership: Membership):
    ws = await db.get(Workspace, membership.workspace_id)
    if ws is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workspace not found")
    wo = WorkspaceOut.model_validate(ws)
    wo.role = membership.role.value if isinstance(membership.role, Role) else str(membership.role)
    return wo


# ---------- Workspace brand logo ----------

BRAND_STICKERS = {"male-1", "male-2", "male-3", "male-4", "female-1", "female-2", "female-3", "female-4", "cute-1", "cute-2", "cute-3", "cute-4"}


@router.get("/{workspace_id}/brand")
async def get_brand(workspace_id: uuid.UUID, db: DbSession, membership: Membership):
    ws = await db.get(Workspace, membership.workspace_id)
    return {
        "brand_kind": ws.brand_kind,
        "brand_value": ws.brand_value,
    }


class BrandSetRequest(BaseModel):
    kind: str  # default | sticker
    value: str | None = None


@router.post("/{workspace_id}/brand")
async def set_brand(
    workspace_id: uuid.UUID,
    payload: BrandSetRequest,
    db: DbSession,
    membership: AdminMembership,
):
    if payload.kind not in ("default", "sticker"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Use /brand/photo for uploads")
    ws = await db.get(Workspace, membership.workspace_id)
    if payload.kind == "sticker":
        if payload.value not in BRAND_STICKERS:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown sticker")
        ws.brand_kind = "sticker"
        ws.brand_value = payload.value
    else:
        ws.brand_kind = "default"
        ws.brand_value = None
    await db.commit()
    return {"brand_kind": ws.brand_kind, "brand_value": ws.brand_value}


@router.post("/{workspace_id}/brand/photo")
async def upload_brand_photo(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
    file: UploadFile = File(...),
):
    import os
    from app.storage.db_storage import DbStorage

    if file.content_type not in ("image/png", "image/jpeg", "image/webp"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only PNG, JPEG or WebP images are allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Max image size is 5 MB")
    ext = ".png" if file.content_type == "image/png" else ".jpg" if file.content_type == "image/jpeg" else ".webp"
    storage = DbStorage()
    key = await storage.save(f"brands/{membership.workspace_id}", f"logo{ext}", data)

    ws = await db.get(Workspace, membership.workspace_id)
    ws.brand_kind = "upload"
    ws.brand_value = key
    await db.commit()
    return {"brand_kind": "upload", "brand_value": key}


@router.get("/{workspace_id}/brand/logo")
async def get_brand_logo(workspace_id: uuid.UUID, db: DbSession, membership: Membership):
    """Serve the uploaded brand logo bytes (404 unless kind == upload)."""
    import mimetypes
    from fastapi.responses import Response

    ws = await db.get(Workspace, membership.workspace_id)
    if ws is None or ws.brand_kind != "upload" or not ws.brand_value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No uploaded logo")
    from app.models.file import FileBlob

    row = await db.execute(select(FileBlob.data).where(FileBlob.key == ws.brand_value))
    data = row.scalar_one_or_none()
    if data is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Logo not found")
    media = mimetypes.guess_type(ws.brand_value)[0] or "application/octet-stream"
    return Response(content=bytes(data), media_type=media)


@router.patch("/{workspace_id}", response_model=WorkspaceOut)
async def rename_workspace(
    workspace_id: uuid.UUID,
    payload: WorkspaceCreate,
    db: DbSession,
    membership: AdminMembership,
):
    ws = await db.get(Workspace, membership.workspace_id)
    if not payload.name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Name cannot be empty")
    ws.name = payload.name.strip()[:200]
    await db.commit()
    await db.refresh(ws)
    return ws


class VisibilityUpdate(BaseModel):
    is_public: bool


@router.patch("/{workspace_id}/visibility", response_model=WorkspaceOut)
async def set_visibility(
    workspace_id: uuid.UUID,
    payload: VisibilityUpdate,
    db: DbSession,
    membership: AdminMembership,
):
    ws = await db.get(Workspace, membership.workspace_id)
    ws.is_public = payload.is_public
    await db.commit()
    await db.refresh(ws)
    return ws


@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(workspace_id: uuid.UUID, db: DbSession, membership: AdminMembership):
    """Admin-only. Removes the workspace and everything in it atomically."""
    ws_id = membership.workspace_id
    try:
        # Step 1: Clean up message attachments for any conversation in this workspace
        await db.execute(
            text(
                "DELETE FROM message_attachments WHERE message_id IN ("
                "SELECT id FROM messages WHERE conversation_id IN ("
                "SELECT id FROM conversations WHERE workspace_id = :ws_id"
                "))"
            ),
            {"ws_id": ws_id},
        )

        # Step 2: Clean up messages
        await db.execute(
            text(
                "DELETE FROM messages WHERE conversation_id IN ("
                "SELECT id FROM conversations WHERE workspace_id = :ws_id"
                ")"
            ),
            {"ws_id": ws_id},
        )

        # Step 3: Clean up conversation participants, hidden states, read states
        await db.execute(
            text(
                "DELETE FROM conversation_participants WHERE conversation_id IN ("
                "SELECT id FROM conversations WHERE workspace_id = :ws_id"
                ")"
            ),
            {"ws_id": ws_id},
        )
        await db.execute(
            text(
                "DELETE FROM conversation_hidden WHERE conversation_id IN ("
                "SELECT id FROM conversations WHERE workspace_id = :ws_id"
                ")"
            ),
            {"ws_id": ws_id},
        )
        await db.execute(
            text(
                "DELETE FROM conversation_read_states WHERE conversation_id IN ("
                "SELECT id FROM conversations WHERE workspace_id = :ws_id"
                ")"
            ),
            {"ws_id": ws_id},
        )

        # Step 4: Delete conversations
        await db.execute(
            text("DELETE FROM conversations WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )

        # Step 5: Clean up contract obligations, digests, health issues, document chunks, and documents
        await db.execute(
            text("DELETE FROM contract_obligations WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )
        await db.execute(
            text("DELETE FROM workspace_digests WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )
        await db.execute(
            text("DELETE FROM document_health_issues WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )
        await db.execute(
            text(
                "DELETE FROM chunks WHERE document_id IN ("
                "SELECT id FROM documents WHERE workspace_id = :ws_id"
                ")"
            ),
            {"ws_id": ws_id},
        )
        await db.execute(
            text("DELETE FROM documents WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )

        # Step 6: Clean up members, invites, join requests, activity logs
        await db.execute(
            text("DELETE FROM workspace_members WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )
        await db.execute(
            text("DELETE FROM invitations WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )
        await db.execute(
            text("DELETE FROM workspace_join_requests WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )
        await db.execute(
            text("DELETE FROM activity_log WHERE workspace_id = :ws_id"),
            {"ws_id": ws_id},
        )

        # Step 7: Delete workspace row
        await db.execute(
            text("DELETE FROM workspaces WHERE id = :ws_id"),
            {"ws_id": ws_id},
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.exception("Error deleting workspace %s: %s", ws_id, e)
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Failed to delete workspace: {str(e)}",
        )


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
            name=u.name,
            role=m.role.value if isinstance(m.role, Role) else m.role,
            online=is_online(u.last_seen_at),
            last_seen_at=u.last_seen_at,
            avatar_kind=u.avatar_kind,
            avatar_value=u.avatar_value,
            bio=u.bio,
            phone=u.phone,
            status=u.status,
            location=u.location,
            pronouns=u.pronouns,
            job_title=u.job_title,
            job_role=u.job_role,
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
    await log_activity(db, membership.workspace_id, membership.user_id, "member.invited", email)
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


class JoinRequestCreate(BaseModel):
    message: str | None = None


@router.post("/{workspace_id}/join-requests", response_model=JoinRequestOut, status_code=201)
async def create_join_request(
    workspace_id: uuid.UUID,
    payload: JoinRequestCreate,
    db: DbSession,
    user: CurrentUser,
):
    ws = await db.get(Workspace, workspace_id)
    if ws is None or not ws.is_public:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workspace not found or not public")
    # already member?
    exists = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user.id
        )
    )
    if exists.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Already a member")
    # pending request exists?
    dup = await db.execute(
        select(WorkspaceJoinRequest).where(
            WorkspaceJoinRequest.workspace_id == workspace_id,
            WorkspaceJoinRequest.user_id == user.id,
            WorkspaceJoinRequest.status == "pending",
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Join request already pending")
    req = WorkspaceJoinRequest(
        workspace_id=workspace_id, user_id=user.id, message=(payload.message or "")[:500] or None, status="pending"
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return JoinRequestOut(
        id=req.id,
        workspace_id=req.workspace_id,
        user_id=req.user_id,
        message=req.message,
        status=req.status,
        created_at=req.created_at,
        user_email=user.email,
        user_name=user.name,
    )


@router.get("/{workspace_id}/join-requests", response_model=list[JoinRequestOut])
async def list_join_requests(
    workspace_id: uuid.UUID, db: DbSession, membership: AdminMembership
):
    result = await db.execute(
        select(WorkspaceJoinRequest, User)
        .join(User, User.id == WorkspaceJoinRequest.user_id)
        .where(
            WorkspaceJoinRequest.workspace_id == membership.workspace_id,
            WorkspaceJoinRequest.status == "pending",
        )
        .order_by(WorkspaceJoinRequest.created_at.desc())
    )
    return [
        JoinRequestOut(
            id=r.id,
            workspace_id=r.workspace_id,
            user_id=r.user_id,
            message=r.message,
            status=r.status,
            created_at=r.created_at,
            user_email=u.email,
            user_name=u.name,
        )
        for r, u in result.all()
    ]


@router.post("/{workspace_id}/join-requests/{request_id}/approve", response_model=JoinRequestOut)
async def approve_join_request(
    workspace_id: uuid.UUID,
    request_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
):
    result = await db.execute(
        select(WorkspaceJoinRequest).where(
            WorkspaceJoinRequest.id == request_id,
            WorkspaceJoinRequest.workspace_id == membership.workspace_id,
            WorkspaceJoinRequest.status == "pending",
        )
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found or already processed")
    req.status = "approved"
    req.reviewed_by = membership.user_id
    from app.models.base import utcnow

    req.reviewed_at = utcnow()

    # Only add member if not already a member (guard against double-approve / race condition)
    existing_member = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == membership.workspace_id,
            WorkspaceMember.user_id == req.user_id,
        )
    )
    if existing_member.scalar_one_or_none() is None:
        db.add(WorkspaceMember(workspace_id=membership.workspace_id, user_id=req.user_id, role=Role.member))

    try:
        await db.flush()  # catch constraint errors before committing
        await log_activity(db, membership.workspace_id, membership.user_id, "member.joined", str(req.user_id))
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "User is already a member of this workspace")

    await db.refresh(req)
    user = await db.get(User, req.user_id)
    return JoinRequestOut(
        id=req.id,
        workspace_id=req.workspace_id,
        user_id=req.user_id,
        message=req.message,
        status=req.status,
        created_at=req.created_at,
        user_email=user.email if user else None,
        user_name=user.name if user else None,
    )


@router.post("/{workspace_id}/join-requests/{request_id}/reject", response_model=JoinRequestOut)
async def reject_join_request(
    workspace_id: uuid.UUID,
    request_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
):
    result = await db.execute(
        select(WorkspaceJoinRequest).where(
            WorkspaceJoinRequest.id == request_id,
            WorkspaceJoinRequest.workspace_id == membership.workspace_id,
            WorkspaceJoinRequest.status == "pending",
        )
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    req.status = "rejected"
    req.reviewed_by = membership.user_id
    from app.models.base import utcnow

    req.reviewed_at = utcnow()
    await db.commit()
    await db.refresh(req)
    user = await db.get(User, req.user_id)
    return JoinRequestOut(
        id=req.id,
        workspace_id=req.workspace_id,
        user_id=req.user_id,
        message=req.message,
        status=req.status,
        created_at=req.created_at,
        user_email=user.email if user else None,
        user_name=user.name if user else None,
    )


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

