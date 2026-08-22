import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.base import utcnow
from app.models.chat import Conversation, ConversationParticipant, Message
from app.models.user import User
from app.models.workspace import Role, WorkspaceMember

router = APIRouter()


class DirectChatCreate(BaseModel):
    user_id: uuid.UUID


class GroupChatCreate(BaseModel):
    title: str
    member_ids: list[uuid.UUID]

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        return v[:200]

    @field_validator("member_ids")
    @classmethod
    def at_least_two(cls, v):
        if len(set(v)) < 2:
            raise ValueError("A group chat needs at least 2 members")
        return list(dict.fromkeys(v))


class TeamMessageCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        return v[:5000]


class ParticipantOut(BaseModel):
    user_id: uuid.UUID
    email: str
    name: str
    online: bool = False


class TeamConversationOut(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    created_at: object
    participants: list[ParticipantOut]
    last_message_at: object | None = None
    last_message_preview: str | None = None


class TeamMessageOut(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID | None
    content: str
    created_at: object

    class Config:
        from_attributes = True


async def _require_ws_member(db, workspace_id, user) -> WorkspaceMember:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workspace not found")
    return membership


async def _get_team_conversation_checked(
    db, conversation_id: uuid.UUID, user
) -> Conversation:
    conv = await db.get(Conversation, conversation_id)
    if conv is None or conv.type == "docs_qa":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat not found")
    result = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv.id,
            ConversationParticipant.user_id == user.id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat not found")
    return conv


async def _build_conv_out(db, conv: Conversation) -> TeamConversationOut:
    rows = await db.execute(
        select(ConversationParticipant, User)
        .join(User, User.id == ConversationParticipant.user_id)
        .where(ConversationParticipant.conversation_id == conv.id)
    )
    from app.api.v1.presence import is_online

    participants = [
        ParticipantOut(
            user_id=p.user_id,
            email=u.email,
            name=u.name,
            online=is_online(u.last_seen_at),
        )
        for p, u in rows.all()
    ]
    last_msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    last = last_msg_result.scalar_one_or_none()
    return TeamConversationOut(
        id=conv.id,
        type=conv.type,
        title=conv.title,
        created_at=conv.created_at,
        participants=participants,
        last_message_at=last.created_at if last else None,
        last_message_preview=last.content[:80] if last else None,
    )


@router.post("/workspaces/{workspace_id}/team-chats/direct", response_model=TeamConversationOut, status_code=201)
async def create_direct_chat(
    workspace_id: uuid.UUID,
    payload: DirectChatCreate,
    db: DbSession,
    user: CurrentUser,
):
    await _require_ws_member(db, workspace_id, user)
    if payload.user_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot DM yourself")

    # target must be a workspace member
    result = await db.execute(
        select(User).where(User.id == payload.user_id)
    )
    other = result.scalar_one_or_none()
    if other is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    other_member = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == payload.user_id,
        )
    )
    if other_member.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User is not in this workspace")

    # find existing DM between the two (DMs are 1:1 per workspace)
    from sqlalchemy import func

    existing = await db.execute(
        select(Conversation.id)
        .join(
            ConversationParticipant,
            ConversationParticipant.conversation_id == Conversation.id,
        )
        .where(
            Conversation.type == "direct",
            Conversation.workspace_id == workspace_id,
            ConversationParticipant.user_id.in_([user.id, payload.user_id]),
        )
        .group_by(Conversation.id)
        .having(func.count(ConversationParticipant.user_id) == 2)
    )
    conv_existing_id = existing.scalar_one_or_none()
    if conv_existing_id is not None:
        conv_existing = await db.get(Conversation, conv_existing_id)
        out = await _build_conv_out(db, conv_existing)
        # existing chat: return 200 instead of the route's default 201
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=200, content=out.model_dump(mode="json"))

    conv = Conversation(
        workspace_id=workspace_id,
        user_id=user.id,
        type="direct",
        title="Direct message",
    )
    db.add(conv)
    await db.flush()
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=user.id))
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=payload.user_id))
    await db.commit()
    return await _build_conv_out(db, conv)


@router.post("/workspaces/{workspace_id}/team-chats/group", response_model=TeamConversationOut, status_code=201)
async def create_group_chat(
    workspace_id: uuid.UUID,
    payload: GroupChatCreate,
    db: DbSession,
    user: CurrentUser,
):
    await _require_ws_member(db, workspace_id, user)

    # all listed members must belong to the workspace
    valid_members = await db.execute(
        select(WorkspaceMember.user_id).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id.in_(payload.member_ids),
        )
    )
    found = {uid for (uid,) in valid_members.all()}
    missing = set(payload.member_ids) - found
    if missing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Some selected users are not in this workspace")

    conv = Conversation(
        workspace_id=workspace_id,
        user_id=user.id,
        type="group",
        title=payload.title,
    )
    db.add(conv)
    await db.flush()
    for uid in {user.id, *payload.member_ids}:
        db.add(ConversationParticipant(conversation_id=conv.id, user_id=uid))
    await db.commit()
    return await _build_conv_out(db, conv)


@router.get("/workspaces/{workspace_id}/team-chats", response_model=list[TeamConversationOut])
async def list_team_chats(workspace_id: uuid.UUID, db: DbSession, user: CurrentUser):
    await _require_ws_member(db, workspace_id, user)
    my_convs = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == user.id
    )
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.workspace_id == workspace_id,
            Conversation.type != "docs_qa",
            Conversation.id.in_(my_convs),
        )
        .order_by(Conversation.created_at.desc())
    )
    return [await _build_conv_out(db, c) for c in result.scalars().all()]


@router.get("/team-chats/{conversation_id}", response_model=TeamConversationOut)
async def get_team_chat(conversation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    return await _build_conv_out(db, conv)


@router.get("/team-chats/{conversation_id}/messages", response_model=list[TeamMessageOut])
async def get_team_messages(conversation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
    )
    return list(result.scalars().all())


@router.post("/team-chats/{conversation_id}/messages", response_model=TeamMessageOut, status_code=201)
async def send_team_message(
    conversation_id: uuid.UUID,
    payload: TeamMessageCreate,
    db: DbSession,
    user: CurrentUser,
):
    conv = await _get_team_conversation_checked(db, conversation_id, user)

    msg = Message(
        conversation_id=conv.id,
        sender_id=user.id,
        role="user",
        content=payload.content,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # bump my presence while chatting
    user.last_seen_at = utcnow()
    await db.commit()
    return msg
