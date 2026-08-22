from sqlalchemy import select, text

from app.models.chat import Message
from app.services.llm.base import RetrievedChunk


async def search_chunks(
    db,
    workspace_id,
    query_embedding: list[float],
    top_k: int = 6,
) -> list[RetrievedChunk]:
    """Top-k cosine similarity, strictly scoped to one workspace."""
    sql = text(
        """
        SELECT c.id::text          AS chunk_id,
               d.id::text          AS document_id,
               d.title             AS document_title,
               c.ordinal           AS ordinal,
               c.content           AS content,
               1 - (c.embedding <=> :emb) AS score
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.workspace_id = :wsid AND d.deleted_at IS NULL
        ORDER BY c.embedding <=> :emb
        LIMIT :k
        """
    )
    result = await db.execute(
        sql,
        {"emb": str(query_embedding), "wsid": str(workspace_id), "k": top_k},
    )
    return [
        RetrievedChunk(
            chunk_id=r.chunk_id,
            document_id=r.document_id,
            document_title=r.document_title,
            ordinal=r.ordinal,
            content=r.content,
            score=float(r.score),
        )
        for r in result.all()
    ]


async def conversation_history(
    db, conversation_id, last_n: int = 8
) -> list[dict]:
    """Last few turns of the thread as [{role, content}] for prompt memory."""
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(last_n)
    )
    msgs = list(result.scalars().all())
    msgs.reverse()
    return [
        {
            "role": m.role.value if hasattr(m.role, "value") else m.role,
            "content": m.content,
        }
        for m in msgs
    ]


LOW_CONFIDENCE_SCORE = 0.35

FRESHNESS_THRESHOLD_DAYS = 90


async def get_freshness(db, chunks: list[RetrievedChunk]) -> dict | None:
    """Warn when the answer relies on old documents.

    Returns {"oldest_days": int, "document_title": str} for the oldest cited
    document when it is older than the threshold; otherwise None.
    """
    if not chunks:
        return None

    from app.models.base import utcnow
    from app.models.document import Document

    doc_ids = {c.document_id for c in chunks}
    result = await db.execute(
        select(Document.id, Document.title, Document.created_at).where(
            Document.id.in_(doc_ids)
        )
    )
    oldest = None  # (days, title)
    for _did, title, created_at in result.all():
        days = (utcnow() - created_at).days
        if oldest is None or days > oldest[0]:
            oldest = (days, title)

    if oldest is None or oldest[0] < FRESHNESS_THRESHOLD_DAYS:
        return None
    return {"oldest_days": oldest[0], "document_title": oldest[1]}


def is_low_confidence(chunks: list[RetrievedChunk]) -> bool:
    """No chunks at all, or best similarity is weak."""
    if not chunks:
        return True
    return max(c.score for c in chunks) < LOW_CONFIDENCE_SCORE


async def suggest_colleagues(db, workspace_id, chunks: list[RetrievedChunk], limit: int = 3):
    """The people most likely to know the answer: uploaders of the closest
    matching documents (even when the match itself was too weak to answer)."""
    from app.models.user import User
    from sqlalchemy import select

    doc_ids = {c.document_id for c in chunks}
    if not doc_ids:
        # fall back to the workspace's document uploaders
        from app.models.document import Document

        docs = await db.execute(
            select(Document.uploader_id)
            .where(Document.workspace_id == workspace_id)
            .limit(limit * 3)
        )
        uploader_ids = [uid for (uid,) in docs.all()][:limit]
    else:
        from app.models.document import Document

        docs = await db.execute(
            select(Document.id, Document.uploader_id).where(
                Document.id.in_(doc_ids)
            )
        )
        ranked: dict[str, float] = {}
        for c in chunks:
            if c.document_id not in ranked or c.score > ranked[c.document_id]:
                ranked[c.document_id] = c.score
        id_to_uploader = {str(did): uid for did, uid in docs.all()}
        ordered_docs = sorted(ranked.items(), key=lambda kv: -kv[1])
        uploader_ids = []
        for did, _score in ordered_docs:
            uid = id_to_uploader.get(did)
            if uid and uid not in uploader_ids:
                uploader_ids.append(uid)

    suggestions = []
    for uid in uploader_ids[:limit]:
        user = await db.get(User, uid)
        if user:
            suggestions.append({"user_id": str(uid), "name": user.name or user.email})
    return suggestions
