import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import AdminMembership, CurrentUser, DbSession, Membership
from app.models.activity import log_activity
from app.models.base import utcnow
from app.models.chat import Conversation, Message
from app.models.document import Chunk, Document

router = APIRouter()

TRASH_LIMIT = 100


async def _get_trashed_document_async(db, workspace_id, document_id) -> Document:
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.workspace_id == workspace_id,
            Document.deleted_at.is_not(None),
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found in trash")
    return doc


# ---------------- Trash: documents ----------------


@router.get("/workspaces/{workspace_id}/trash/documents")
async def trashed_documents(
    workspace_id: uuid.UUID, db: DbSession, membership: Membership
):
    result = await db.execute(
        select(Document)
        .where(
            Document.workspace_id == membership.workspace_id,
            Document.deleted_at.is_not(None),
        )
        .order_by(Document.deleted_at.desc())
        .limit(TRASH_LIMIT)
    )
    return [
        {
            "id": str(d.id),
            "title": d.title,
            "file_type": d.file_type,
            "deleted_at": d.deleted_at.isoformat(),
        }
        for d in result.scalars().all()
    ]


@router.post("/workspaces/{workspace_id}/trash/documents/{document_id}/restore", status_code=204)
async def restore_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
):
    doc = await _get_trashed_document_async(db, membership.workspace_id, document_id)
    doc.deleted_at = None
    await log_activity(db, membership.workspace_id, membership.user_id, "document.restored", doc.title)
    await db.commit()


@router.delete("/workspaces/{workspace_id}/trash/documents/{document_id}", status_code=204)
async def purge_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
):
    """Permanently delete a trashed document and its chunks/file."""
    doc = await _get_trashed_document_async(db, membership.workspace_id, document_id)
    from sqlalchemy import delete as sa_delete

    # delete file blob from storage
    try:
        from app.models.file import FileBlob
        from app.storage.db_storage import get_storage
        storage = get_storage()
        await storage.delete(doc.storage_key)
    except Exception:
        pass  # best-effort cleanup

    await db.execute(sa_delete(Chunk).where(Chunk.document_id == doc.id))
    await log_activity(db, membership.workspace_id, membership.user_id, "document.purged", doc.title)
    await db.delete(doc)
    await db.commit()


# ---------------- Trash: conversations ----------------


@router.get("/workspaces/{workspace_id}/trash/conversations")
async def trashed_conversations(
    workspace_id: uuid.UUID, db: DbSession, membership: Membership, user: CurrentUser
):
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.workspace_id == membership.workspace_id,
            Conversation.type == "docs_qa",
            Conversation.user_id == user.id,
            Conversation.deleted_at.is_not(None),
        )
        .order_by(Conversation.deleted_at.desc())
        .limit(TRASH_LIMIT)
    )
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "deleted_at": c.deleted_at.isoformat(),
        }
        for c in result.scalars().all()
    ]


# ---------------- Search ----------------


@router.get("/workspaces/{workspace_id}/search")
async def global_search(
    workspace_id: uuid.UUID,
    q: str,
    db: DbSession,
    membership: Membership,
    limit: int = 10,
    offset: int = 0,
):
    """Search across documents (title + content) and docs-QA messages with resilient fallback."""
    query = q.strip()
    if len(query) < 2:
        return {"documents": [], "messages": [], "excerpts": []}
    like = f"%{query}%"

    doc_hits = []
    msg_hits = []
    excerpts = []

    # 1. Document title matches
    try:
        docs = await db.execute(
            select(Document)
            .where(
                Document.workspace_id == membership.workspace_id,
                Document.deleted_at.is_(None),
                Document.title.ilike(like),
            )
            .order_by(Document.created_at.desc())
            .limit(min(limit, 20))
            .offset(max(offset, 0))
        )
        doc_hits = [
            {"id": str(d.id), "title": d.title, "file_type": d.file_type}
            for d in docs.scalars().all()
        ]
    except Exception:
        await db.rollback()

    # 2. Chat message matches
    try:
        msgs = await db.execute(
            select(Message, Conversation.title.label("conv_title"))
            .join(Conversation, Conversation.id == Message.conversation_id)
            .where(
                Conversation.workspace_id == membership.workspace_id,
                Conversation.deleted_at.is_(None),
                Message.content.ilike(like),
            )
            .order_by(Message.created_at.desc())
            .limit(min(limit, 20))
            .offset(max(offset, 0))
        )
        for m, conv_title in msgs.all():
            msg_hits.append(
                {
                    "id": str(m.id),
                    "conversation_id": str(m.conversation_id),
                    "conversation_title": conv_title or "AI Chat",
                    "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                    "snippet": (m.content or "")[:160],
                }
            )
    except Exception:
        await db.rollback()

    # 3. Document Chunk Excerpts (ILIKE text search first, then optional vector scoring)
    try:
        chunks = await db.execute(
            select(Chunk, Document.title)
            .join(Document, Document.id == Chunk.document_id)
            .where(
                Chunk.workspace_id == membership.workspace_id,
                Document.deleted_at.is_(None),
                Chunk.content.ilike(like),
            )
            .order_by(Chunk.ordinal)
            .limit(8)
        )
        for c, doc_title in chunks.all():
            excerpts.append({
                "id": str(c.id),
                "document_title": doc_title or "",
                "snippet": (c.content or "")[:220],
                "score": 0.95
            })
    except Exception:
        await db.rollback()

    # 4. Optional Vector similarity search enhancement (if text excerpts is empty)
    if not excerpts:
        try:
            from app.services.llm.gemini_provider import get_llm
            llm = get_llm()
            q_emb = (await llm.embed([query]))[0]
            from sqlalchemy import text as sql_text

            vec_rows = await db.execute(
                sql_text(
                    "SELECT c.id, c.content, d.title as doc_title, 1 - (c.embedding <=> CAST(:emb AS vector)) as score "
                    "FROM chunks c JOIN documents d ON d.id = c.document_id "
                    "WHERE c.workspace_id = :wsid AND d.deleted_at IS NULL "
                    "ORDER BY c.embedding <=> CAST(:emb AS vector) LIMIT 5"
                ),
                {"emb": str(q_emb), "wsid": str(membership.workspace_id)},
            )
            for r in vec_rows.mappings().all():
                if r["score"] is not None and r["score"] > 0.15:
                    excerpts.append({
                        "id": str(r["id"]),
                        "document_title": r["doc_title"] or "",
                        "snippet": (r["content"] or "")[:220],
                        "score": round(float(r["score"]), 3)
                    })
        except Exception:
            await db.rollback()

    return {"documents": doc_hits, "messages": msg_hits, "excerpts": excerpts}


# ---------------- Insights ----------------


@router.get("/workspaces/{workspace_id}/insights")
async def get_insights(workspace_id: uuid.UUID, db: DbSession, membership: Membership):
    wsid = membership.workspace_id

    total_docs = len(
        (
            await db.execute(
                select(Document.id).where(
                    Document.workspace_id == wsid, Document.deleted_at.is_(None)
                )
            )
        ).all()
    )
    ready_docs = len(
        (
            await db.execute(
                select(Document.id).where(
                    Document.workspace_id == wsid,
                    Document.deleted_at.is_(None),
                    Document.status == "ready",
                )
            )
        ).all()
    )

    # top-cited documents from assistant message citations
    all_msgs = (
        await db.execute(
            select(Message)
            .join(Conversation, Conversation.id == Message.conversation_id)
            .where(
                Conversation.workspace_id == wsid,
                Conversation.type == "docs_qa",
                Conversation.deleted_at.is_(None),
            )
        )
    ).scalars().all()

    questions = [m for m in all_msgs if (m.role.value if hasattr(m.role, "value") else str(m.role)) == "user"]
    answers = [m for m in all_msgs if (m.role.value if hasattr(m.role, "value") else str(m.role)) == "assistant"]

    citation_counts: dict[str, int] = {}
    unanswered: list[dict] = []
    answer_by_conv_order: dict[str, list] = {}
    for a in answers:
        answer_by_conv_order.setdefault(str(a.conversation_id), []).append(a)

    REFUSAL_PREFIX = "I couldn't find an answer"
    qi = 0
    for q in questions:
        conv_key = str(q.conversation_id)
        seq = answer_by_conv_order.get(conv_key, [])
        ans = next((a for a in seq if a.created_at >= q.created_at), None)
        is_refusal = ans is not None and ans.content.startswith(REFUSAL_PREFIX)
        no_citation = ans is not None and not ans.citations
        if is_refusal or no_citation or ans is None:
            unanswered.append({"question": q.content[:200], "asked_at": q.created_at.isoformat()})
        else:
            for cit in ans.citations or []:
                title = cit.get("document_title") or "Unknown"
                citation_counts[title] = citation_counts.get(title, 0) + 1
        qi += 1

    top_cited = sorted(citation_counts.items(), key=lambda kv: -kv[1])[:5]

    return {
        "total_documents": total_docs,
        "ready_documents": ready_docs,
        "total_questions": len(questions),
        "unanswered_count": len(unanswered),
        "unanswered_questions": unanswered[-20:][::-1],  # newest first
        "top_cited_documents": [{"title": t, "citations": n} for t, n in top_cited],
    }
