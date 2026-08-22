import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    HTTPException,
    UploadFile,
    status,
)
from pydantic import BaseModel, ConfigDict
from sqlalchemy import delete, select

from app.core.config import get_settings
from app.core.deps import AdminMembership, CurrentUser, DbSession, MemberMembership, Membership
from app.models.activity import log_activity
from app.models.document import Chunk, Document
from app.services.ingestion import ingest_document
from app.storage.db_storage import get_storage

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"application/pdf", "text/markdown", "text/plain"}


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    file_type: str
    status: str
    error_msg: str | None = None
    size_bytes: int


def _detect_file_type(filename: str, content_type: str | None) -> str | None:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in ("pdf", "docx", "md", "txt"):
        return ext
    if content_type == "application/pdf":
        return "pdf"
    if content_type in ("text/markdown", "text/plain"):
        return "md" if content_type == "text/markdown" else "txt"
    return None


async def _run_ingest(document_id: uuid.UUID):
    from app.core.deps import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        await ingest_document(session, document_id)


@router.post(
    "/workspaces/{workspace_id}/documents",
    response_model=DocumentOut,
    status_code=201,
)
async def upload_document(
    workspace_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: DbSession,
    membership: MemberMembership,
    user: CurrentUser,
    file: UploadFile = File(...),
):
    settings = get_settings()
    file_type = _detect_file_type(file.filename or "", file.content_type)
    if file_type is None:
        raise HTTPException(400, "Unsupported file type (allowed: pdf, docx, md, txt)")
    data = await file.read()
    if len(data) > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large (max 20 MB)")

    storage = get_storage()
    key = await storage.save(str(membership.workspace_id), file.filename or "untitled.txt", data)

    document = Document(
        workspace_id=membership.workspace_id,
        uploader_id=user.id,
        title=file.filename or "Untitled",
        file_type=file_type,
        storage_key=key,
        status="pending",
        size_bytes=len(data),
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    await log_activity(db, membership.workspace_id, user.id, "document.uploaded", document.title)
    await db.commit()
    background_tasks.add_task(_run_ingest, document.id)
    return document


@router.get("/workspaces/{workspace_id}/documents", response_model=list[DocumentOut])
async def list_documents(
    workspace_id: uuid.UUID, db: DbSession, membership: Membership
):
    result = await db.execute(
        select(Document)
        .where(Document.workspace_id == membership.workspace_id)
        .where(Document.deleted_at.is_(None))
        .order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/workspaces/{workspace_id}/documents/{document_id}", response_model=DocumentOut)
async def get_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    document = await db.get(Document, document_id)
    if document is None or document.workspace_id != membership.workspace_id or document.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return document


@router.get("/workspaces/{workspace_id}/documents/{document_id}/chunks")
async def get_document_chunks(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    document = await db.get(Document, document_id)
    if document is None or document.workspace_id != membership.workspace_id or document.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    result = await db.execute(
        select(Chunk)
        .where(Chunk.document_id == document.id)
        .order_by(Chunk.ordinal)
    )
    chunks = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "ordinal": c.ordinal,
            "token_count": c.token_count,
            "content": c.content,
        }
        for c in chunks
    ]


@router.delete("/workspaces/{workspace_id}/documents/{document_id}", status_code=204)
async def delete_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
):
    """Soft-delete to trash (restore via /trash endpoints)."""
    from app.models.base import utcnow

    document = await db.get(Document, document_id)
    if document is None or document.workspace_id != membership.workspace_id or document.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    document.deleted_at = utcnow()
    await log_activity(db, membership.workspace_id, membership.user_id, "document.trashed", document.title)
    await db.commit()




