import io
import uuid

from docx import Document as DocxDocument
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.document import Chunk, Document


def extract_text(data: bytes, file_type: str) -> str:
    if file_type == "pdf":
        reader = PdfReader(io.BytesIO(data))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    if file_type == "docx":
        doc = DocxDocument(io.BytesIO(data))
        parts = [p.text for p in doc.paragraphs]
        for table in doc.tables:
            for row in table.rows:
                parts.append(" | ".join(cell.text for cell in row.cells))
        return "\n".join(parts)
    return data.decode("utf-8", errors="replace")


_TOKEN_CHARS_PER_TOKEN = 4  # ~4 chars per token heuristic


def chunk_text(text: str) -> list[str]:
    """Token-approximate sliding-window chunking (~500 tokens, 50 overlap)."""
    settings = get_settings()
    size = settings.CHUNK_SIZE_TOKENS * _TOKEN_CHARS_PER_TOKEN
    overlap = settings.CHUNK_OVERLAP_TOKENS * _TOKEN_CHARS_PER_TOKEN

    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    # build blocks of paragraphs up to size
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    def flush():
        nonlocal current, current_len
        if current:
            chunks.append("\n\n".join(current))
        current, current_len = [], 0

    for para in paragraphs:
        while len(para) > size:
            if current:
                flush()
            chunks.append(para[:size])
            para = para[size - overlap:]
        if current_len + len(para) > size and current:
            flush()
        current.append(para)
        current_len += len(para)
    flush()

    # dedupe tiny trailing chunk
    return [c for c in chunks if len(c) > 20]


async def ingest_document(db: AsyncSession, document_id: uuid.UUID):
    """Full pipeline: extract -> chunk -> embed -> store. Updates status."""
    document = await db.get(Document, document_id)
    if document is None:
        return
    from app.storage.db_storage import get_storage
    from app.services.llm.gemini_provider import get_llm

    try:
        document.status = "processing"
        await db.commit()

        storage = get_storage()
        data = await storage.open(document.storage_key)
        text = extract_text(data, document.file_type)

        pieces = chunk_text(text)
        if not pieces:
            raise ValueError("No extractable text found in document")

        llm = get_llm()
        embeddings = await llm.embed(pieces)

        for ordinal, (piece, embedding) in enumerate(zip(pieces, embeddings)):
            db.add(
                Chunk(
                    document_id=document.id,
                    workspace_id=document.workspace_id,
                    ordinal=ordinal,
                    content=piece,
                    token_count=len(piece) // _TOKEN_CHARS_PER_TOKEN,
                    metadata_json={},
                    embedding=embedding,
                )
            )
        document.status = "ready"
        document.error_msg = None
        await db.commit()
    except Exception as exc:  # noqa: BLE001
        await db.rollback()
        document = await db.get(Document, document_id)
        document.status = "failed"
        document.error_msg = str(exc)[:1000]
        await db.commit()
