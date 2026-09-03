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
    MessageReaction,
)
from app.models.file import FileBlob
from app.models.user import User
from app.models.workspace import Role, WorkspaceMember
from app.storage.db_storage import DbStorage

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
    content: str = ""
    attachment_ids: list[str] = []

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        return (v or "").strip()[:5000]


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


class ReactionTogglePayload(BaseModel):
    emoji: str


class TeamMessageOut(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID | None
    content: str
    created_at: object
    attachments: list[AttachmentOut] = []
    read_by: list[str] = []
    reactions: dict[str, list[str]] = {}
    approval_card: dict | None = None

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

    approval_card = None
    clean_content = msg.content or ""
    if clean_content and "<!--APPROVAL_CARD:" in clean_content:
        try:
            parts = clean_content.split("<!--APPROVAL_CARD:", 1)
            raw_json = parts[1].split("-->", 1)[0]
            approval_card = json.loads(raw_json)
            clean_content = parts[0].strip()
        except Exception:
            approval_card = None

    reactions_dict: dict[str, list[str]] = {}
    try:
        reactions_res = await db.execute(
            select(MessageReaction.emoji, MessageReaction.user_id).where(
                MessageReaction.message_id == msg.id
            )
        )
        for emoji, uid in reactions_res.all():
            reactions_dict.setdefault(emoji, []).append(str(uid))
    except Exception:
        reactions_dict = {}

    return TeamMessageOut(
        id=msg.id,
        sender_id=msg.sender_id,
        content=clean_content,
        created_at=msg.created_at,
        attachments=atts,
        read_by=read_by,
        reactions=reactions_dict,
        approval_card=approval_card,
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

    # Use retry logic to handle race conditions — no DB lock needed (works without direct_chat_key column)
    max_retries = 3
    for attempt in range(max_retries):
        try:
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
                .limit(1)
            )
            conv_existing_id = existing.scalars().first()

            if conv_existing_id is not None:
                conv_existing = await db.get(Conversation, conv_existing_id)
                if conv_existing is None:
                    # stale id, continue to creation
                    pass
                else:
                    # unhide only for current user
                    await db.execute(
                        delete(ConversationHidden).where(
                            ConversationHidden.conversation_id == conv_existing.id,
                            ConversationHidden.user_id == user.id,
                        )
                    )
                    await db.commit()
                    return await _build_conv_out(db, conv_existing, user.id)

            # Create new direct conversation (direct_chat_key migration is optional; retry handles race)
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
            return await _build_conv_out(db, conv, user.id)

        except Exception as e:
            await db.rollback()
            # Log for Render logs to debug 500
            import logging

            logging.getLogger(__name__).exception("create_direct_chat failed attempt %s", attempt, exc_info=e)
            error_str = str(e).lower()
            if "unique" in error_str or "duplicate" in error_str or "integrity" in error_str or "could not obtain lock" in error_str:
                if attempt < max_retries - 1:
                    continue  # retry
            # Re-raise as HTTPException with detail for frontend to show (not just 500)
            # Preserve original HTTPExceptions
            from fastapi import HTTPException as _HTTP

            if isinstance(e, _HTTP):
                raise
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Direct chat failed: {e}")

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
        .limit(1)
    )
    conv_existing_id = existing.scalars().first()
    if conv_existing_id is not None:
        conv_existing = await db.get(Conversation, conv_existing_id)
        if conv_existing is not None:
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


@router.get("/team-chats", response_model=list[TeamConversationOut])
@router.get("/workspaces/{workspace_id}/team-chats", response_model=list[TeamConversationOut])
async def list_team_chats(
    db: DbSession,
    user: CurrentUser,
    workspace_id: uuid.UUID | None = None,
):
    my_convs = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == user.id
    )
    hidden_convs = select(ConversationHidden.conversation_id).where(
        ConversationHidden.user_id == user.id
    )
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.type != "docs_qa",
            Conversation.id.in_(my_convs),
            Conversation.id.notin_(hidden_convs),
        )
        .order_by(Conversation.created_at.desc())
    )
    convs = list(result.scalars().all())
    built = [await _build_conv_out(db, c, user.id) for c in convs]
    built.sort(
        key=lambda c: str(c.last_message_at or c.created_at),
        reverse=True,
    )
    return built


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

    if not payload.content.strip() and not payload.attachment_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Message or attachment is required")

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

    # Check for @AskDocs AI Teammate mention trigger
    low_content = (payload.content or "").lower()
    if "@askdocs" in low_content or "@ask" in low_content:
        try:
            clean_query = payload.content or ""
            for tag in ["@askdocs", "@AskDocs", "@ask", "@Ask"]:
                if tag in clean_query:
                    clean_query = clean_query.split(tag, 1)[-1].strip()
                    break
            if not clean_query:
                clean_query = payload.content or "Summarize the workspace documents."

            from app.services.llm.gemini_provider import get_llm
            from app.services.retrieval import search_chunks

            llm = get_llm()
            q_embeddings = await llm.embed([clean_query])
            q_emb = q_embeddings[0] if q_embeddings else [0.0] * 768
            chunks = await search_chunks(db, conv.workspace_id, q_emb)

            ai_answer = await llm.answer(clean_query, chunks)

            # Check if prompt requests expenditure / action approval
            approval_keywords = ["refund", "reimburse", "approve", "approval", "expenditure", "budget", "limit", "payment", "contract", "discount"]
            if any(k in low_content for k in approval_keywords):
                import re
                amounts = re.findall(r"\$\d+(?:,\d+)*(?:\.\d+)?|\d+\s*(?:dollars|USD)", clean_query)
                req_amt = amounts[0] if amounts else "Action Request"
                approval_id = f"appr-{uuid.uuid4().hex[:8]}"
                card_data = {
                    "approval_id": approval_id,
                    "action_type": "Expenditure & Policy Approval",
                    "requested_amount": req_amt,
                    "requested_by": user.full_name or user.email,
                    "policy_citation": "Workspace Policy & Contract SOP Section 4.2",
                    "status": "pending",
                }
                ai_answer += f"\n\n<!--APPROVAL_CARD:{json.dumps(card_data)}-->"

            bot_msg = Message(
                conversation_id=conv.id,
                sender_id=None,
                role="assistant",
                content=ai_answer,
            )
            db.add(bot_msg)
            await db.commit()
        except Exception as err:
            logger.warning("Error in @AskDocs AI teammate trigger: %s", err)

    return await _build_message_out(db, msg, user.id)


class MessageApprovalPayload(BaseModel):
    status: str


@router.post("/team-chats/{conversation_id}/messages/{message_id}/approval", response_model=TeamMessageOut)
async def update_message_approval(
    conversation_id: uuid.UUID,
    message_id: uuid.UUID,
    payload: MessageApprovalPayload,
    db: DbSession,
    user: CurrentUser,
):
    """Update status of an interactive approval card in team chat."""
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    msg = await db.get(Message, message_id)
    if not msg or msg.conversation_id != conv.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")

    if msg.content and "<!--APPROVAL_CARD:" in msg.content:
        parts = msg.content.split("<!--APPROVAL_CARD:", 1)
        raw_json = parts[1].split("-->", 1)[0]
        try:
            card = json.loads(raw_json)
            card["status"] = payload.status
            card["approved_by"] = user.full_name or user.email
            card["updated_at"] = datetime.now(timezone.utc).isoformat()
            msg.content = f"{parts[0].strip()}\n\n<!--APPROVAL_CARD:{json.dumps(card)}-->"
            await db.commit()
            await db.refresh(msg)
        except Exception as err:
            logger.warning("Failed to update message approval card: %s", err)

    return await _build_message_out(db, msg, user.id)


@router.post("/team-chats/messages/{message_id}/reactions")
async def toggle_team_message_reaction(
    message_id: uuid.UUID,
    payload: ReactionTogglePayload,
    db: DbSession,
    user: CurrentUser,
):
    """Toggle an emoji reaction on a message. Stored in DB so all participants see it."""
    msg = await db.get(Message, message_id)
    if msg is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")

    part = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == msg.conversation_id,
            ConversationParticipant.user_id == user.id,
        )
    )
    if part.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a participant in this chat")

    emoji = payload.emoji.strip()
    if not emoji:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Emoji required")

    existing = await db.execute(
        select(MessageReaction).where(
            MessageReaction.message_id == msg.id,
            MessageReaction.user_id == user.id,
            MessageReaction.emoji == emoji,
        )
    )
    existing_row = existing.scalar_one_or_none()
    if existing_row:
        await db.delete(existing_row)
    else:
        db.add(MessageReaction(message_id=msg.id, user_id=user.id, emoji=emoji))

    await db.commit()

    reactions_res = await db.execute(
        select(MessageReaction.emoji, MessageReaction.user_id).where(
            MessageReaction.message_id == msg.id
        )
    )
    reactions_dict: dict[str, list[str]] = {}
    for em, uid in reactions_res.all():
        reactions_dict.setdefault(em, []).append(str(uid))

    return {"reactions": reactions_dict}


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
async def get_chat_attachment(attachment_id: uuid.UUID, db: DbSession):
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
    headers = {
        "Content-Disposition": f'inline; filename="{att.filename}"',
        "Cache-Control": "public, max-age=86400",
    }
    return Response(content=bytes(data), media_type=media, headers=headers)


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
    """Delete a message — sender or workspace admin can delete for everyone."""
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    msg = await db.get(Message, message_id)
    if msg is None or msg.conversation_id != conv.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")
    
    # Check if sender or admin
    is_sender = msg.sender_id == user.id
    is_admin = False
    if not is_sender:
        mb = await db.execute(
            select(WorkspaceMember.role).where(
                WorkspaceMember.workspace_id == conv.workspace_id,
                WorkspaceMember.user_id == user.id,
            )
        )
        role = mb.scalar_one_or_none()
        is_admin = (role == "admin" or getattr(role, "value", None) == "admin")

    if not is_sender and not is_admin:
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


@router.post("/team-chats/{conversation_id}/clear")
async def clear_team_chat(
    conversation_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Clear all messages in a conversation (WhatsApp-style Clear Chat)."""
    conv = await _get_team_conversation_checked(db, conversation_id, user)
    
    msg_subq = select(Message.id).where(Message.conversation_id == conv.id)
    await db.execute(delete(MessageAttachment).where(MessageAttachment.message_id.in_(msg_subq)))
    await db.execute(delete(Message).where(Message.conversation_id == conv.id))
    
    # Reset read state to now
    now = utcnow()
    existing_rs = await db.execute(
        select(ConversationReadState).where(
            ConversationReadState.conversation_id == conv.id,
            ConversationReadState.user_id == user.id,
        )
    )
    rs = existing_rs.scalar_one_or_none()
    if rs:
        rs.last_read_at = now
    else:
        db.add(ConversationReadState(conversation_id=conv.id, user_id=user.id, last_read_at=now))

    await db.commit()
    return {"status": "cleared"}

