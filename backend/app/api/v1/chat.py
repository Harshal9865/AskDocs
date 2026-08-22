import json
import uuid

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select

from app.core.deps import AsyncSessionLocal, CurrentUser, DbSession, Membership
from app.models.chat import Conversation, Message
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
    is_low_confidence,
    search_chunks,
    suggest_colleagues,
)

router = APIRouter()

REFUSAL = "I couldn't find an answer to this in the uploaded documents."


async def _get_conversation_checked(
    db, conversation_id: uuid.UUID, user: CurrentUser
) -> Conversation:
    conv = await db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    return conv


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
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.workspace_id == membership.workspace_id,
            Conversation.user_id == user.id,
        )
        .order_by(Conversation.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: uuid.UUID, db: DbSession, user: CurrentUser
):
    conv = await _get_conversation_checked(db, conversation_id, user)
    if conv.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
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
    if conv.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")

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
    else:
        history = await conversation_history(db, conv.id)
        answer = await llm.answer(payload.content, chunks, history)
        citations = _citations_json(chunks)

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
    if conv.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")

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
    history = await conversation_history(db, conv.id)

    async def event_stream():
        answer_parts: list[str] = []
        try:
            if not chunks:
                yield f"data: {json.dumps({'type': 'answer', 'text': REFUSAL})}\n\n"
                answer_parts.append(REFUSAL)
            else:
                async for token in llm.stream_answer(payload.content, chunks, history):
                    answer_parts.append(token)
                    yield f"data: {json.dumps({'type': 'answer', 'text': token})}\n\n"
            citations = _citations_json(chunks)
            yield f"data: {json.dumps({'type': 'done', 'citations': citations, 'suggested_colleagues': suggestions})}\n\n"

            async with AsyncSessionLocal() as session:
                session.add(
                    Message(
                        conversation_id=conv.id,
                        role="assistant",
                        content="".join(answer_parts),
                        citations=citations,
                    )
                )
                await session.commit()
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)[:300]})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")



