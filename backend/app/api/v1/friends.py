import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, or_

from app.core.deps import CurrentUser, DbSession, MemberMembership
from app.models.friend import Friendship
from app.models.user import User
from app.models.workspace import WorkspaceMember

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


def _user_to_friend(u: User, status: str, created_at: object) -> FriendOut:
    from app.api.v1.presence import is_online

    return FriendOut(
        id=uuid.uuid4(),
        user_id=u.id,
        name=u.name,
        email=u.email,
        avatar_kind=u.avatar_kind,
        avatar_value=u.avatar_value,
        online=is_online(u.last_seen_at),
        status=status,
        created_at=created_at,
    )


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
    return {"id": str(friendship.id), "status": "pending"}


@router.get("/friends/requests")
async def list_friend_requests(db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Friendship, User)
        .join(User, User.id == Friendship.requester_id)
        .where(Friendship.addressee_id == user.id, Friendship.status == "pending")
    )
    return [_user_to_friend(u, "pending", f.created_at) for f, u in result.all()]


@router.get("/friends")
async def list_friends(db: DbSession, user: CurrentUser):
    result = await db.execute(
        select(Friendship, User)
        .join(User, User.id == Friendship.addressee_id)
        .where(Friendship.requester_id == user.id, Friendship.status == "accepted")
        .union(
            select(Friendship, User)
            .join(User, User.id == Friendship.requester_id)
            .where(Friendship.addressee_id == user.id, Friendship.status == "accepted")
        )
    )
    return [_user_to_friend(u, "accepted", f.created_at) for f, u in result.all()]


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
    return {"status": "blocked"}


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
    await db.delete(f)
    await db.commit()
    return {"status": "deleted"}


@router.get("/friends/suggestions")
async def friend_suggestions(
    workspace_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    await _require_ws_member(db, workspace_id, user)

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
    return [_user_to_friend(u, "none", None) for u in users]
