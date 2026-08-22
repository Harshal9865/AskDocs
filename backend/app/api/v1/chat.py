import json
import uuid

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.core.deps import AsyncSessionLocal, CurrentUser, DbSession, Membership
from app.models.chat import Conversation, Message
from app.schemas.chat import (
    ConversationCreate,
    ConversationOut,
    MessageCreate,
    MessageOut,
)
from app.services.llm.gemini_provider import get_llm
from app.services.retrieval import conversation_history, search_chunks

router = APIRouter()

REFUSAL = "I couldn't find an answer to this in the uploaded documents."


async def _get_conversation_checked(
    db, conversation_id: uuid.UUID, user: CurrentUser
) -> Conversation:
    conv = await db.get(Conversation, conversation_id)
    if conv is None or conv.user_id != user.id:
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
    conversation_id: uuid.UUID, db: DbSession, membership: Membership, user: CurrentUser
):
    del membership
    conv = await _get_conversation_checked(db, conversation_id, user)
    result = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
    )
    return list(result.scalars().all())


@router.post("/conversations/{conversation_id}/ask", response_model=MessageOut)
async def ask_question_sync(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    db: DbSession,
    membership: Membership,
    user: CurrentUser,
):
    """Non-streaming Q&A - same pipeline as SSE, easier to test/debug."""
    conv = await _get_conversation_checked(db, conversation_id, user)

    db.add(Message(conversation_id=conv.id, role="user", content=payload.content))
    if conv.title == "New conversation":
        conv.title = payload.content[:80]
    await db.commit()

    llm = get_llm()
    query_embedding = (await llm.embed([payload.content]))[0]
    chunks = await search_chunks(db, conv.workspace_id, query_embedding)

    if not chunks:
        answer, citations = REFUSAL, []
    else:
        history = await conversation_history(db, conv.id)
        answer = await llm.answer(payload.content, chunks, history)
        citations = _citations_json(chunks)

    msg = Message(conversation_id=conv.id, role="assistant", content=answer, citations=citations)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


@router.post("/conversations/{conversation_id}/messages")
async def ask_question_stream(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    db: DbSession,
    membership: Membership,
    user: CurrentUser,
):
    """SSE streaming Q&A. Events: {type: answer|done|error}."""
    conv = await _get_conversation_checked(db, conversation_id, user)

    db.add(Message(conversation_id=conv.id, role="user", content=payload.content))
    if conv.title == "New conversation":
        conv.title = payload.content[:80]
    await db.commit()

    llm = get_llm()
    query_embedding = (await llm.embed([payload.content]))[0]
    chunks = await search_chunks(db, conv.workspace_id, query_embedding)
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
            yield f"data: {json.dumps({'type': 'done', 'citations': citations})}\n\n"

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

