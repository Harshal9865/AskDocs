import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, or_, delete
from datetime import timedelta

from app.core.deps import CurrentUser, DbSession, MemberMembership
from app.models.activity import log_activity
from app.models.friend import Friendship
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.base import utcnow

router = APIRouter()


class FriendRequestIn(BaseModel):
    email: str | None = None
    user_id: uuid.UUID | None = None


class FriendOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    email: str
    avatar_kind: str
    avatar_value: str | None
    online: bool
    status: str
    created_at: object


def _user_to_friend(u: User, friendship: Friendship | None, status: str | None = None, created_at: object | None = None) -> FriendOut:
    from app.api.v1.presence import is_online

    fid = friendship.id if friendship else uuid.uuid4()
    st = friendship.status if friendship else (status or "none")
    ca = friendship.created_at if friendship else created_at
    return FriendOut(
        id=fid,
        user_id=u.id,
        name=u.name,
        email=u.email,
        avatar_kind=u.avatar_kind,
        avatar_value=u.avatar_value,
        online=is_online(u.last_seen_at),
        status=st,
        created_at=ca,
    )


async def _cleanup_expired_requests(db: DbSession, user_id: uuid.UUID):
    # delete pending requests older than 2 days
    cutoff = utcnow() - timedelta(days=2)
    await db.execute(
        delete(Friendship).where(
            Friendship.status == "pending",
            Friendship.created_at < cutoff,
            or_(
                Friendship.requester_id == user_id,
                Friendship.addressee_id == user_id,
            )
        )
    )
    await db.commit()


async def _require_ws_member(db, workspace_id, user):
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workspace not found")
    return True


@router.post("/friends/request", status_code=201)
async def send_friend_request(
    payload: FriendRequestIn,
    db: DbSession,
    user: CurrentUser,
):
    if payload.user_id is None and payload.email is None:
        raise HTTPException(400, "Provide user_id or email")
    if payload.user_id == user.id or payload.email == user.email:
        raise HTTPException(400, "Cannot friend yourself")

    if payload.user_id:
        result = await db.execute(select(User).where(User.id == payload.user_id))
    else:
        result = await db.execute(select(User).where(User.email == payload.email))
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(404, "User not found")

    await _cleanup_expired_requests(db, user.id)

    # check inverse already exists
    existing = await db.execute(
        select(Friendship).where(
            or_(
                Friendship.requester_id == user.id,
                Friendship.requester_id == target.id,
            ),
            or_(
                Friendship.addressee_id == user.id,
                Friendship.addressee_id == target.id,
            ),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Friend request already exists")

    friendship = Friendship(requester_id=user.id, addressee_id=target.id, status="pending")
    db.add(friendship)
    await db.commit()
    await db.refresh(friendship)
    # best-effort activity log to first workspace if any
    try:
        ws_row = await db.execute(select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user.id).limit(1))
        wsid = ws_row.scalar_one_or_none()
        if wsid:
            await log_activity(db, wsid, user.id, "friend.requested", target.email)
            await db.commit()
    except Exception:
        pass
    return {"id": str(friendship.id), "status": "pending"}


@router.get("/friends/requests")
async def list_friend_requests(db: DbSession, user: CurrentUser):
    await _cleanup_expired_requests(db, user.id)
    result = await db.execute(
        select(Friendship, User)
        .join(User, User.id == Friendship.requester_id)
        .where(Friendship.addressee_id == user.id, Friendship.status == "pending")
    )
    return [_user_to_friend(u, f) for f, u in result.all()]


@router.get("/friends")
async def list_friends(db: DbSession, user: CurrentUser):
    await _cleanup_expired_requests(db, user.id)
    # two separate queries — avoids UNION type issues with asyncpg + preserves ordering
    sent = await db.execute(
        select(Friendship, User)
        .join(User, User.id == Friendship.addressee_id)
        .where(Friendship.requester_id == user.id, Friendship.status == "accepted")
    )
    received = await db.execute(
        select(Friendship, User)
        .join(User, User.id == Friendship.requester_id)
        .where(Friendship.addressee_id == user.id, Friendship.status == "accepted")
    )
    out = [_user_to_friend(u, f) for f, u in sent.all()]
    out.extend(_user_to_friend(u, f) for f, u in received.all())
    # dedup by friendship id (defensive if duplicate rows)
    seen: set[str] = set()
    uniq: list[FriendOut] = []
    for fr in out:
        sid = str(fr.id)
        if sid not in seen:
            seen.add(sid)
            uniq.append(fr)
    return uniq


@router.post("/friends/{friend_id}/accept")
async def accept_friend(friend_id: uuid.UUID, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Friendship).where(
            Friendship.id == friend_id,
            Friendship.addressee_id == user.id,
            Friendship.status == "pending",
        )
    )
    f = result.scalar_one_or_none()
    if f is None:
        raise HTTPException(404, "Friend request not found")
    f.status = "accepted"
    from app.models.base import utcnow
    f.accepted_at = utcnow()
    await db.commit()
    try:
        ws_row = await db.execute(select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user.id).limit(1))
        wsid = ws_row.scalar_one_or_none()
        if wsid:
            rq = await db.get(User, f.requester_id)
            await log_activity(db, wsid, user.id, "friend.accepted", rq.email if rq else str(f.requester_id))
            await db.commit()
    except Exception:
        pass
    return {"status": "accepted"}


@router.post("/friends/{friend_id}/decline")
async def decline_friend(friend_id: uuid.UUID, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Friendship).where(
            Friendship.id == friend_id,
            or_(
                Friendship.addressee_id == user.id,
                Friendship.requester_id == user.id,
            ),
        )
    )
    f = result.scalar_one_or_none()
    if f is None:
        raise HTTPException(404, "Friend request not found")
    await db.delete(f)
    await db.commit()
    return {"status": "declined"}


@router.post("/friends/{friend_id}/block")
async def block_friend(friend_id: uuid.UUID, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Friendship).where(
            Friendship.id == friend_id,
            or_(
                Friendship.addressee_id == user.id,
                Friendship.requester_id == user.id,
            ),
        )
    )
    f = result.scalar_one_or_none()
    if f is None:
        raise HTTPException(404, "Friend request not found")
    f.status = "blocked"
    await db.commit()
    try:
        ws_row = await db.execute(select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user.id).limit(1))
        wsid = ws_row.scalar_one_or_none()
        if wsid:
            other_id = f.requester_id if f.addressee_id == user.id else f.addressee_id
            other = await db.get(User, other_id)
            await log_activity(db, wsid, user.id, "friend.blocked", other.email if other else str(other_id))
            await db.commit()
    except Exception:
        pass
    return {"status": "blocked"}


@router.post("/friends/{friend_id}/unblock")
async def unblock_friend(friend_id: uuid.UUID, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Friendship).where(
            Friendship.id == friend_id,
            Friendship.status == "blocked",
            or_(
                Friendship.addressee_id == user.id,
                Friendship.requester_id == user.id,
            ),
        )
    )
    f = result.scalar_one_or_none()
    if f is None:
        raise HTTPException(404, "Blocked user not found")
    await db.delete(f)
    await db.commit()
    return {"status": "unblocked"}


@router.get("/friends/blocked")
async def list_blocked(db: DbSession, user: CurrentUser):
    sent = await db.execute(
        select(Friendship, User)
        .join(User, User.id == Friendship.addressee_id)
        .where(Friendship.requester_id == user.id, Friendship.status == "blocked")
    )
    received = await db.execute(
        select(Friendship, User)
        .join(User, User.id == Friendship.requester_id)
        .where(Friendship.addressee_id == user.id, Friendship.status == "blocked")
    )
    out = [_user_to_friend(u, f) for f, u in sent.all()]
    out.extend(_user_to_friend(u, f) for f, u in received.all())
    seen: set[str] = set()
    uniq: list[FriendOut] = []
    for fr in out:
        sid = str(fr.id)
        if sid not in seen:
            seen.add(sid)
            uniq.append(fr)
    return uniq


@router.delete("/friends/{friend_id}")
async def unfriend(friend_id: uuid.UUID, db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Friendship).where(
            Friendship.id == friend_id,
            or_(
                Friendship.addressee_id == user.id,
                Friendship.requester_id == user.id,
            ),
        )
    )
    f = result.scalar_one_or_none()
    if f is None:
        raise HTTPException(404, "Friend not found")
    other_id = f.requester_id if f.addressee_id == user.id else f.addressee_id
    other_email = None
    try:
        other_u = await db.get(User, other_id)
        other_email = other_u.email if other_u else str(other_id)
    except Exception:
        pass
    await db.delete(f)
    await db.commit()
    try:
        ws_row = await db.execute(select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user.id).limit(1))
        wsid = ws_row.scalar_one_or_none()
        if wsid and other_email:
            await log_activity(db, wsid, user.id, "friend.removed", other_email)
            await db.commit()
    except Exception:
        pass
    return {"status": "deleted"}


@router.get("/friends/suggestions")
async def friend_suggestions(
    workspace_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    await _require_ws_member(db, workspace_id, user)
    await _cleanup_expired_requests(db, user.id)

    # all workspace members
    member_ids_q = select(WorkspaceMember.user_id).where(
        WorkspaceMember.workspace_id == workspace_id
    )

    # existing friend/requests involving me
    existing_q = select(Friendship.addressee_id).where(
        Friendship.requester_id == user.id
    ).union(
        select(Friendship.requester_id).where(
            Friendship.addressee_id == user.id
        )
    )

    result = await db.execute(
        select(User).where(
            User.id.in_(member_ids_q),
            User.id != user.id,
            User.id.notin_(existing_q),
        )
    )
    users = result.scalars().all()
    return [_user_to_friend(u, None, "none", None) for u in users]


@router.get("/friends/search")
async def search_users(q: str, db: DbSession, user: CurrentUser):
    """Global user search for friends — any workspace. Hides blocked users."""
    if not q or len(q.strip()) < 2:
        return []
    await _cleanup_expired_requests(db, user.id)
    like = f"%{q.strip()}%"
    # blocked ids to exclude
    blocked_rows = await db.execute(
        select(Friendship).where(
            Friendship.status == "blocked",
            or_(
                Friendship.requester_id == user.id,
                Friendship.addressee_id == user.id,
            ),
        )
    )
    blocked_ids: set[uuid.UUID] = set()
    for fr in blocked_rows.scalars().all():
        other = fr.addressee_id if fr.requester_id == user.id else fr.requester_id
        blocked_ids.add(other)
    base_q = select(User).where(
        User.id != user.id,
        (User.name.ilike(like) | User.email.ilike(like)),
    )
    if blocked_ids:
        base_q = base_q.where(User.id.notin_(blocked_ids))
    result = await db.execute(base_q.limit(20))
    users = result.scalars().all()
    # annotate with existing friendship status if any
    out = []
    for u in users:
        fr = await db.execute(
            select(Friendship).where(
                or_(
                    (Friendship.requester_id == user.id) & (Friendship.addressee_id == u.id),
                    (Friendship.requester_id == u.id) & (Friendship.addressee_id == user.id),
                )
            )
        )
        f = fr.scalar_one_or_none()
        out.append(_user_to_friend(u, f, f.status if f else "none", f.created_at if f else None) if f else _user_to_friend(u, None, "none", None))
    return out
