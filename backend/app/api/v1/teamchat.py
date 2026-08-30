import hashlib
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func, delete

from app.core.deps import CurrentUser, DbSession
from app.models.base import utcnow
from app.models.chat import (
    Conversation,
    ConversationHidden,
    ConversationParticipant,
    ConversationReadState,
    Message,
    MessageAttachment,
)
from app.models.file import FileBlob
from app.models.user import User
from app.models.workspace import Role, WorkspaceMember
from app.storage.db_storage import DbStorage

def _generate_direct_chat_key(user_id_1: uuid.UUID, user_id_2: uuid.UUID) -> str:
    """Generate a deterministic key for a direct chat between two users.
    Sorts the UUIDs to ensure the same key regardless of order."""
    ids = sorted([str(user_id_1), str(user_id_2)])
    combined = f"{ids[0]}:{ids[1]}"
    return hashlib.sha256(combined.encode()).hexdigest()[:64]


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
    attachment_ids: list[str] = []

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
    avatar_kind: str | None = None
    avatar_value: str | None = None


class AttachmentOut(BaseModel):
    id: uuid.UUID
    filename: str
    content_type: str
    size_bytes: int
    url: str


class TeamConversationOut(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    created_at: object
    participants: list[ParticipantOut]
    last_message_at: object | None = None
    last_message_preview: str | None = None
    unread_count: int = 0


class TeamMessageOut(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID | None
    content: str
    created_at: object
    attachments: list[AttachmentOut] = []
    read_by: list[str] = []

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


async def _build_conv_out(db, conv: Conversation, user_id: uuid.UUID | None = None) -> TeamConversationOut:
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
            avatar_kind=u.avatar_kind,
            avatar_value=u.avatar_value,
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

    unread = 0
    if user_id:
        read_state_result = await db.execute(
            select(ConversationReadState).where(
                ConversationReadState.conversation_id == conv.id,
                ConversationReadState.user_id == user_id,
            )
        )
        read_state = read_state_result.scalar_one_or_none()
        if read_state:
            count_result = await db.execute(
                select(func.count(Message.id)).where(
                    Message.conversation_id == conv.id,
                    Message.created_at > read_state.last_read_at,
                    Message.sender_id != user_id,
                )
            )
            unread = count_result.scalar() or 0
        else:
            count_result = await db.execute(
                select(func.count(Message.id)).where(
                    Message.conversation_id == conv.id,
                    Message.sender_id != user_id,
                )
            )
            unread = count_result.scalar() or 0

    return TeamConversationOut(
        id=conv.id,
        type=conv.type,
        title=conv.title,
        created_at=conv.created_at,
        participants=participants,
        last_message_at=last.created_at if last else None,
        last_message_preview=last.content[:80] if last else None,
        unread_count=unread,
    )


async def _build_message_out(db, msg: Message, user_id: uuid.UUID | None = None) -> TeamMessageOut:
    attachments_result = await db.execute(
        select(MessageAttachment).where(MessageAttachment.message_id == msg.id)
    )
    atts = [
        AttachmentOut(
            id=a.id,
            filename=a.filename,
            content_type=a.content_type,
            size_bytes=a.size_bytes,
            url=f"/team-chats/attachments/{a.id}",
        )
        for a in attachments_result.scalars().all()
    ]

    read_by: list[str] = []
    if user_id:
        read_result = await db.execute(
            select(ConversationReadState.user_id).where(
                ConversationReadState.conversation_id == msg.conversation_id,
                ConversationReadState.last_read_at >= msg.created_at,
            )
        )
        read_by = [str(uid) for (uid,) in read_result.all() if str(uid) != str(msg.sender_id)]

    return TeamMessageOut(
        id=msg.id,
        sender_id=msg.sender_id,
        content=msg.content,
        created_at=msg.created_at,
        attachments=atts,
        read_by=read_by,
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

    result = await db.execute(select(User).where(User.id == payload.user_id))
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
        # allow cross-workspace DM if they are friends (accepted)
        from app.models.friend import Friendship
        from sqlalchemy import or_

        fr = await db.execute(
            select(Friendship).where(
                Friendship.status == "accepted",
                or_(
                    (Friendship.requester_id == user.id) & (Friendship.addressee_id == payload.user_id),
                    (Friendship.requester_id == payload.user_id) & (Friendship.addressee_id == user.id),
                ),
            )
        )
        if fr.scalar_one_or_none() is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User is not in this workspace")
        # blocked check
        blocked = await db.execute(
            select(Friendship).where(
                Friendship.status == "blocked",
                or_(
                    (Friendship.requester_id == user.id) & (Friendship.addressee_id == payload.user_id),
                    (Friendship.requester_id == payload.user_id) & (Friendship.addressee_id == user.id),
                ),
            )
        )
        if blocked.scalar_one_or_none():
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot message a blocked user")

    # Use a transaction with retry logic to handle race conditions
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Lock the relevant rows to prevent race conditions
            existing = await db.execute(
                select(Conversation.id)
                .join(
                    ConversationParticipant,
                    ConversationParticipant.conversation_id == Conversation.id,
                )
                .where(
                    Conversation.type == "direct",
                    Conversation.workspace_id == workspace_id,
                    Conversation.deleted_at.is_(None),
                    ConversationParticipant.user_id.in_([user.id, payload.user_id]),
                )
                .group_by(Conversation.id)
                .having(func.count(ConversationParticipant.user_id) == 2)
                .with_for_update(nowait=True)
            )
            conv_existing_id = existing.scalar_one_or_none()

            if conv_existing_id is not None:
                conv_existing = await db.get(Conversation, conv_existing_id)
                # unhide only for current user
                await db.execute(
                    delete(ConversationHidden).where(
                        ConversationHidden.conversation_id == conv_existing.id,
                        ConversationHidden.user_id == user.id,
                    )
                )
                await db.commit()
                return await _build_conv_out(db, conv_existing, user.id)

            # Create new direct conversation
            direct_chat_key = _generate_direct_chat_key(user.id, payload.user_id)
            conv = Conversation(
                workspace_id=workspace_id,
                user_id=user.id,
                type="direct",
                title="Direct message",
                direct_chat_key=direct_chat_key,
            )
            db.add(conv)
            await db.flush()

            db.add(ConversationParticipant(conversation_id=conv.id, user_id=user.id))
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=payload.user_id))

            await db.commit()
            return await _build_conv_out(db, conv, user.id)

        except Exception as e:
            await db.rollback()
            # Check if it's a unique constraint violation (race condition)
            error_str = str(e).lower()
            if "unique" in error_str or "duplicate" in error_str or "integrity" in error_str:
                if attempt < max_retries - 1:
                    continue  # retry
            raise

    # Fallback: try to find existing conversation after retries
    existing = await db.execute(
        select(Conversation.id)
        .join(
            ConversationParticipant,
            ConversationParticipant.conversation_id == Conversation.id,
        )
        .where(
            Conversation.type == "direct",
            Conversation.workspace_id == workspace_id,
            Conversation.deleted_at.is_(None),
            ConversationParticipant.user_id.in_([user.id, payload.user_id]),
        )
        .group_by(Conversation.id)
        .having(func.count(ConversationParticipant.user_id) == 2)
    )
    conv_existing_id = existing.scalar_one_or_none()
    if conv_existing_id is not None:
        conv_existing = await db.get(Conversation, conv_existing_id)
        await db.execute(
            delete(ConversationHidden).where(
                ConversationHidden.conversation_id == conv_existing.id,
                ConversationHidden.user_id == user.id,
            )
        )
        await db.commit()
        return await _build_conv_out(db, conv_existing, user.id)

    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to create direct chat after retries")


@router.post("/workspaces/{workspace_id}/team-chats/group", response_model=TeamConversationOut, status_code=201)
async def create_group_chat(
    workspace_id: uuid.UUID,
    payload: GroupChatCreate,
    db: DbSession,
    user: CurrentUser,
):
    await _require_ws_member(db, workspace_id, user)

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
    return await _build_conv_out(db, conv, user.id)


@router.get("/workspaces/{workspace_id}/team-chats", response_model=list[TeamConversationOut])
async def list_team_chats(workspace_id: uuid.UUID, db: DbSession, user: CurrentUser):
    await _require_ws_member(db, workspace_id, user)
    my_convs = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == user.id
    )
    hidden_convs = select(ConversationHidden.conversation_id).where(
        ConversationHidden.user_id == user.id
    )
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.workspace_id == workspace_id,
            Conversation.type != "docs_qa",
            Conversation.id.in_(my_convs),
            Conversation.id.notin_(hidden_convs),
        )
        .order_by(Conversation.created_at.desc())
    )
    return [await _build_conv_out(db, c, user.id) for c in result.scalars().all()]


@router.get("/team-chats/{conversation_id}", response_model=TeamConversationOut)
async def get_team_chat(conversation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    return await _build_conv_out(db, conv, user.id)


@router.get("/team-chats/{conversation_id}/messages", response_model=list[TeamMessageOut])
async def get_team_messages(conversation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
    )
    messages = list(result.scalars().all())

    # upsert read state
    now = utcnow()
    existing = await db.execute(
        select(ConversationReadState).where(
            ConversationReadState.conversation_id == conv.id,
            ConversationReadState.user_id == user.id,
        )
    )
    rs = existing.scalar_one_or_none()
    if rs:
        rs.last_read_at = now
    else:
        db.add(ConversationReadState(conversation_id=conv.id, user_id=user.id, last_read_at=now))
    await db.commit()

    return [await _build_message_out(db, m, user.id) for m in messages]


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
    await db.flush()

    # link any uploaded attachments
    if payload.attachment_ids:
        for aid in payload.attachment_ids:
            try:
                att_id = uuid.UUID(aid)
            except ValueError:
                continue
            att_result = await db.execute(
                select(MessageAttachment).where(MessageAttachment.id == att_id)
            )
            att = att_result.scalar_one_or_none()
            if att:
                att.message_id = msg.id

    # unhide for all participants (new message reappears conversation)
    await db.execute(
        delete(ConversationHidden).where(
            ConversationHidden.conversation_id == conv.id,
        )
    )

    await db.commit()
    await db.refresh(msg)

    # bump my presence
    user.last_seen_at = utcnow()
    await db.commit()
    return await _build_message_out(db, msg, user.id)


IMAGE_TYPES = ("image/png", "image/jpeg", "image/webp", "image/gif")
DOC_TYPES = (
    "application/pdf",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
)
VIDEO_TYPES = ("video/mp4", "video/webm", "video/quicktime")
ALLOWED_UPLOAD_TYPES = IMAGE_TYPES + DOC_TYPES + VIDEO_TYPES
MAX_UPLOAD_SIZE = 20 * 1024 * 1024  # 20 MB for images/docs
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50 MB for videos
MAX_EXCERPT_CHARS = 6000


def _extract_excerpt(data: bytes, content_type: str, filename: str) -> str | None:
    """Extract text from text-like attachments so the AI can read them."""
    try:
        if content_type in DOC_TYPES:
            from app.services.ingestion import extract_text

            text = extract_text(data, content_type) or ""
            text = text.strip()
            if text and not text.startswith("[Image:"):
                return text[:MAX_EXCERPT_CHARS]
        return None
    except Exception:
        return None


@router.post("/team-chats/upload", status_code=201)
async def upload_chat_attachment(
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            400,
            "Unsupported file type. Allowed: images (PNG/JPEG/WebP/GIF), PDF, TXT, CSV, MD, DOCX, video (MP4/WebM/MOV)",
        )
    data = await file.read()
    limit = MAX_VIDEO_SIZE if file.content_type in VIDEO_TYPES else MAX_UPLOAD_SIZE
    if len(data) > limit:
        raise HTTPException(413, f"File too large (max {limit // (1024 * 1024)} MB)")

    storage = DbStorage()
    key = await storage.save(f"chat-attachments/{user.id}", file.filename or "file", data)

    excerpt = _extract_excerpt(data, file.content_type, file.filename or "")

    att = MessageAttachment(
        message_id=None,  # linked to the message on send
        storage_key=key,
        filename=file.filename or "file",
        content_type=file.content_type,
        size_bytes=len(data),
        text_excerpt=excerpt,
    )
    db.add(att)
    await db.commit()
    await db.refresh(att)
    return {
        "id": str(att.id),
        "filename": att.filename,
        "content_type": att.content_type,
        "size_bytes": att.size_bytes,
        "text_excerpt": att.text_excerpt,
    }


@router.get("/team-chats/attachments/{attachment_id}")
async def get_chat_attachment(attachment_id: uuid.UUID, db: DbSession, user: CurrentUser):
    import mimetypes
    from fastapi.responses import Response

    att = await db.get(MessageAttachment, attachment_id)
    if att is None:
        raise HTTPException(404, "Attachment not found")

    row = await db.execute(select(FileBlob.data).where(FileBlob.key == att.storage_key))
    data = row.scalar_one_or_none()
    if data is None:
        raise HTTPException(404, "File not found")
    media = mimetypes.guess_type(att.filename)[0] or att.content_type
    return Response(content=bytes(data), media_type=media)


@router.delete("/team-chats/{conversation_id}/hide")
async def hide_conversation(conversation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    existing = await db.execute(
        select(ConversationHidden).where(
            ConversationHidden.conversation_id == conv.id,
            ConversationHidden.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "already_hidden"}
    hidden = ConversationHidden(conversation_id=conv.id, user_id=user.id)
    db.add(hidden)
    await db.commit()
    return {"status": "hidden"}


@router.post("/team-chats/{conversation_id}/unhide")
async def unhide_conversation(conversation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    await db.execute(
        delete(ConversationHidden).where(
            ConversationHidden.conversation_id == conv.id,
            ConversationHidden.user_id == user.id,
        )
    )
    await db.commit()
    return {"status": "unhidden"}


@router.delete("/team-chats/{conversation_id}")
async def delete_team_chat(conversation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Delete/leave a chat for the requesting user only — other participants unaffected."""
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    # Clean up this user's hidden/read state regardless of chat type
    await db.execute(
        delete(ConversationHidden).where(
            ConversationHidden.conversation_id == conv.id,
            ConversationHidden.user_id == user.id,
        )
    )
    await db.execute(
        delete(ConversationReadState).where(
            ConversationReadState.conversation_id == conv.id,
            ConversationReadState.user_id == user.id,
        )
    )
    if conv.type == "group":
        # Leave group: remove this user's participant row
        await db.execute(
            delete(ConversationParticipant).where(
                ConversationParticipant.conversation_id == conv.id,
                ConversationParticipant.user_id == user.id,
            )
        )
        # If no participants remain, delete the conversation entirely
        remaining = await db.execute(
            select(ConversationParticipant.id).where(
                ConversationParticipant.conversation_id == conv.id
            ).limit(1)
        )
        if remaining.first() is None:
            # Delete children first (FKs have no ON DELETE CASCADE)
            await db.execute(
                delete(MessageAttachment).where(
                    MessageAttachment.message_id.in_(
                        select(Message.id).where(Message.conversation_id == conv.id)
                    )
                )
            )
            await db.execute(
                delete(Message).where(Message.conversation_id == conv.id)
            )
            await db.execute(
                delete(ConversationParticipant).where(
                    ConversationParticipant.conversation_id == conv.id
                )
            )
            await db.execute(
                delete(ConversationHidden).where(
                    ConversationHidden.conversation_id == conv.id
                )
            )
            await db.execute(
                delete(ConversationReadState).where(
                    ConversationReadState.conversation_id == conv.id
                )
            )
            await db.delete(conv)
        await db.commit()
        return {"status": "deleted"}
    else:
        # Direct: per-user hide (soft delete) — other participant still sees it
        existing = await db.execute(
            select(ConversationHidden.id).where(
                ConversationHidden.conversation_id == conv.id,
                ConversationHidden.user_id == user.id,
            ).limit(1)
        )
        if existing.first() is None:
            db.add(ConversationHidden(conversation_id=conv.id, user_id=user.id))
            await db.commit()
        return {"status": "deleted"}


@router.delete("/team-chats/{conversation_id}/messages/{message_id}")
async def delete_team_message(
    conversation_id: uuid.UUID,
    message_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Delete own message — individual only."""
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    msg = await db.get(Message, message_id)
    if msg is None or msg.conversation_id != conv.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")
    if msg.sender_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Can only delete your own messages")
    # delete attachments first
    atts = await db.execute(
        select(MessageAttachment).where(MessageAttachment.message_id == msg.id)
    )
    for att in atts.scalars().all():
        await db.delete(att)
    await db.delete(msg)
    await db.commit()
    return {"status": "deleted"}
