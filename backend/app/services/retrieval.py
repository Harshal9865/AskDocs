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
        WHERE c.workspace_id = :wsid
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
    return [{"role": m.role.value if hasattr(m.role, "value") else m.role, "content": m.content} for m in msgs]
