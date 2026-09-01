import json
import uuid

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select

from app.core.deps import AsyncSessionLocal, CurrentUser, DbSession, Membership
from app.models.chat import Conversation, Message, MessageAttachment
from app.models.file import FileBlob
from app.models.workspace import Role, WorkspaceMember
from app.schemas.chat import (
    ConversationCreate,
    ConversationOut,
    MessageCreate,
    MessageOut,
)
from app.services.llm.gemini_provider import get_llm
from app.services.retrieval import (
    conversation_history,
    get_freshness,
    is_low_confidence,
    search_chunks,
    suggest_colleagues,
)
from app.services.plan_enforcement import check_question_limit

router = APIRouter()

REFUSAL = "I couldn't find an answer to this in the uploaded documents."

MAX_VISION_IMAGES = 4


async def _resolve_attachments(db, attachment_ids: list[str], user_id) -> tuple[list, str, list[MessageAttachment]]:
    """Resolve uploaded attachment ids into (gemini_image_parts, doc_context_text, atts).

    - Images -> Gemini vision parts (bytes inline, capped at MAX_VISION_IMAGES)
    - PDFs/docs -> text_excerpt becomes prompt context
    - Videos -> noted as attached (playback only, not analyzable)
    """
    from google.genai import types as gtypes

    image_parts: list = []
    doc_blocks: list[str] = []
    atts: list[MessageAttachment] = []
    video_names: list[str] = []

    for aid in attachment_ids[:8]:
        try:
            att_id = uuid.UUID(str(aid))
        except (ValueError, AttributeError):
            continue
        att = await db.get(MessageAttachment, att_id)
        if att is None:
            continue
        atts.append(att)

        if att.content_type.startswith("image/"):
            if len(image_parts) >= MAX_VISION_IMAGES:
                continue
            row = await db.execute(select(FileBlob.data).where(FileBlob.key == att.storage_key))
            data = row.scalar_one_or_none()
            if data is not None:
                image_parts.append(
                    gtypes.Part.from_bytes(data=bytes(data), mime_type=att.content_type)
                )
        elif att.text_excerpt:
            doc_blocks.append(f"[Attached file: {att.filename}]\n{att.text_excerpt}")
        elif att.content_type.startswith("video/"):
            video_names.append(att.filename)

    doc_context = ""
    if doc_blocks:
        doc_context = (
            "\n\nThe user also attached these files. Use their contents to answer:\n\n"
            + "\n\n".join(doc_blocks)
        )
    if video_names:
        doc_context += (
            "\n\n(The user attached video file(s): "
            + ", ".join(video_names)
            + ". You cannot watch videos — acknowledge them and answer any text question.)"
        )

    return image_parts, doc_context, atts


async def _get_conversation_checked(
    db, conversation_id: uuid.UUID, user: CurrentUser
) -> Conversation:
    conv = await db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    return conv


async def _workspace_role(db, workspace_id: uuid.UUID, user_id) -> str | None:
    """Role of the user in the workspace; None if not a member."""
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        return None
    return member.role.value if hasattr(member.role, "value") else str(member.role)


def _citations_json(chunks) -> list[dict]:
    return [
        {
            "document_id": c.document_id,
            "document_title": c.document_title,
            "chunk_ordinal": c.ordinal,
            "snippet": c.content[:300],
        }
        for c in chunks
    ]


@router.post(
    "/workspaces/{workspace_id}/conversations",
    response_model=ConversationOut,
    status_code=201,
)
async def create_conversation(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
    user: CurrentUser,
    payload: ConversationCreate | None = None,
):
    conv = Conversation(
        workspace_id=membership.workspace_id,
        user_id=user.id,
        title=(payload.title if payload and payload.title else "New conversation"),
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get(
    "/workspaces/{workspace_id}/conversations",
    response_model=list[ConversationOut],
)
async def list_conversations(
    workspace_id: uuid.UUID, db: DbSession, membership: Membership, user: CurrentUser
):
    """All AI conversations in the workspace for admins/members.
    Viewers only see their own."""
    query = select(Conversation).where(
        Conversation.workspace_id == membership.workspace_id,
        Conversation.type == "docs_qa",
        Conversation.deleted_at.is_(None),
    )
    role = await _workspace_role(db, membership.workspace_id, user.id)
    if role == "viewer":
        query = query.where(Conversation.user_id == user.id)
    query = query.order_by(Conversation.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: uuid.UUID, db: DbSession, user: CurrentUser
):
    conv = await _get_conversation_checked(db, conversation_id, user)
    role = await _workspace_role(db, conv.workspace_id, user.id)
    if role is None:
        # non-member: don't reveal existence
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    if conv.user_id != user.id and role == "viewer":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Viewers can only view their own conversations")
    result = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
    )
    return list(result.scalars().all())


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: uuid.UUID, db: DbSession, user: CurrentUser
):
    """Owner or workspace admin can delete; messages are removed too."""
    conv = await _get_conversation_checked(db, conversation_id, user)
    if conv.user_id == user.id:
        allowed = True
    else:
        result = await db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == conv.workspace_id,
                WorkspaceMember.user_id == user.id,
            )
        )
        membership = result.scalar_one_or_none()
        if membership is None:
            # non-member: don't reveal existence
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
        role = membership.role.value if hasattr(membership.role, "value") else membership.role
        allowed = role == "admin"
    if not allowed:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Not allowed to delete this conversation"
        )
    await db.execute(delete(Message).where(Message.conversation_id == conv.id))
    await db.delete(conv)
    await db.commit()


@router.post("/conversations/{conversation_id}/ask", response_model=MessageOut)
async def ask_question_sync(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    db: DbSession,
    user: CurrentUser,
):
    """Non-streaming Q&A - same pipeline as SSE, easier to test/debug."""
    conv = await _get_conversation_checked(db, conversation_id, user)
    role = await _workspace_role(db, conv.workspace_id, user.id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    if conv.user_id != user.id and role == "viewer":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Viewers can only use their own conversations")

    db.add(Message(conversation_id=conv.id, role="user", content=payload.content))
    if conv.title == "New conversation":
        conv.title = payload.content[:80]
    await db.commit()

    llm = get_llm()
    query_embedding = (await llm.embed([payload.content]))[0]
    chunks = await search_chunks(db, conv.workspace_id, query_embedding)
    suggestions = (
        await suggest_colleagues(db, conv.workspace_id, chunks)
        if is_low_confidence(chunks)
        else []
    )

    if not chunks:
        answer, citations = REFUSAL, []
        conflict = None
    else:
        history = await conversation_history(db, conv.id)
        answer = await llm.answer(payload.content, chunks, history)
        citations = _citations_json(chunks)
        conflict = await llm.detect_conflict(chunks)
    freshness = await get_freshness(db, chunks)

    msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=answer,
        citations=citations,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    out = MessageOut.model_validate(msg)
    out.suggested_colleagues = suggestions
    out.conflict = conflict
    out.freshness = freshness
    return out


@router.post("/conversations/{conversation_id}/messages")
async def ask_question_stream(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    db: DbSession,
    user: CurrentUser,
):
    """SSE streaming Q&A. Events: {type: answer|done|error}."""
    conv = await _get_conversation_checked(db, conversation_id, user)
    role = await _workspace_role(db, conv.workspace_id, user.id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    if conv.user_id != user.id and role == "viewer":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Viewers can only use their own conversations")

    # Check question limit
    await check_question_limit(db, user)

    # Resolve attachments (images -> vision parts, docs -> text context)
    image_parts, doc_context, atts = await _resolve_attachments(
        db, payload.attachment_ids or [], user.id
    )

    # Link attachments to the conversation (message_id set after user msg saved)
    user_content = payload.content.strip()
    if not user_content and atts:
        user_content = "Please analyze the attached file(s)."

    user_msg = Message(conversation_id=conv.id, role="user", content=user_content)
    db.add(user_msg)
    await db.flush()
    for att in atts:
async def ask_question_stream(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    db: DbSession,
    user: CurrentUser,
):
    """SSE streaming Q&A. Events: {type: answer|done|error}."""
    conv = await _get_conversation_checked(db, conversation_id, user)
    role = await _workspace_role(db, conv.workspace_id, user.id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    if conv.user_id != user.id and role == "viewer":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Viewers can only use their own conversations")

    # Check question limit
    await check_question_limit(db, user)

    # Resolve attachments (images -> vision parts, docs -> text context)
    image_parts, doc_context, atts = await _resolve_attachments(
        db, payload.attachment_ids or [], user.id
    )

    # Link attachments to the conversation (message_id set after user msg saved)
    user_content = payload.content.strip()
    if not user_content and atts:
        user_content = "Please analyze the attached file(s)."

    user_msg = Message(conversation_id=conv.id, role="user", content=user_content)
    db.add(user_msg)
    await db.flush()
    for att in atts:
        att.message_id = user_msg.id
    if conv.title == "New conversation":
        conv.title = (user_content or "Attachment question")[:80]
    await db.commit()

    llm = get_llm()
    # Embed the question (or attachment excerpt if question is empty)
    embed_text = user_content
    if not embed_text and atts and atts[0].text_excerpt:
        embed_text = atts[0].text_excerpt[:1000]

    try:
        query_embeddings = await llm.embed([embed_text or user_content])
        query_embedding = query_embeddings[0] if query_embeddings else [0.0] * 768
        chunks = await search_chunks(db, conv.workspace_id, query_embedding)
    except Exception:
        chunks = []

    try:
        suggestions = (
            await suggest_colleagues(db, conv.workspace_id, chunks)
            if is_low_confidence(chunks)
            else []
        )
    except Exception:
        suggestions = []

    try:
        history = await conversation_history(db, conv.id)
    except Exception:
        history = []

    # If attachments carry text (pdf/doc) and no RAG chunks, still answer from them
    has_attachment_context = bool(doc_context) or bool(image_parts)

    async def event_stream():
        answer_parts: list[str] = []
        try:
            if not chunks and not has_attachment_context:
                yield f"data: {json.dumps({'type': 'answer', 'text': REFUSAL})}\n\n"
                answer_parts.append(REFUSAL)
                conflict = None
                freshness = None
            else:
                question_with_ctx = payload.content.strip() + doc_context
                async for token in llm.stream_answer(question_with_ctx, chunks, history, image_parts):
                    answer_parts.append(token)
                    yield f"data: {json.dumps({'type': 'answer', 'text': token})}\n\n"
                try:
                    conflict = await llm.detect_conflict(chunks) if chunks else None
                except Exception:
                    conflict = None
                try:
                    freshness = await get_freshness(db, chunks) if chunks else None
                except Exception:
                    freshness = None

            citations = _citations_json(chunks)
            yield f"data: {json.dumps({'type': 'done', 'citations': citations, 'suggested_colleagues': suggestions, 'conflict': conflict, 'freshness': freshness})}\n\n"

            if answer_parts:
                try:
                    async with AsyncSessionLocal() as session:
                        saved = Message(
                            conversation_id=conv.id,
                            role="assistant",
                            content="".join(answer_parts),
                            citations=citations,
                        )
                        session.add(saved)
                        await session.commit()
                        yield f"data: {json.dumps({'type': 'saved', 'message_id': str(saved.id)})}\n\n"
                except Exception:
                    pass
        except Exception as exc:  # noqa: BLE001
            err_msg = str(exc)[:300] or "An unexpected issue occurred while generating the answer."
            yield f"data: {json.dumps({'type': 'error', 'message': err_msg})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/answers/{message_id}")
async def get_answer_permalink(
    message_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Shareable cited answer: the assistant message plus its original question.
    Accessible to any member of the workspace the conversation belongs to."""
    from app.models.workspace import WorkspaceMember

    msg = await db.get(Message, message_id)
    if (
        msg is None
        or (msg.role.value if hasattr(msg.role, "value") else str(msg.role)) != "assistant"
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Answer not found")

    conv = await db.get(Conversation, msg.conversation_id)
    if conv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Answer not found")

    membership = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == conv.workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Answer not found")

    # original question = latest user message before this answer
    q_result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conv.id,
            Message.role == "user",
            Message.created_at <= msg.created_at,
        )
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    question = q_result.scalar_one_or_none()

    return {
        "id": str(msg.id),
        "question": question.content if question else "",
        "answer": msg.content,
        "citations": msg.citations or [],
        "conversation_title": conv.title,
        "workspace_id": str(conv.workspace_id),
        "created_at": msg.created_at.isoformat(),
    }
