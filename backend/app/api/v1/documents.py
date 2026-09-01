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
from app.services.plan_enforcement import check_document_limit, check_file_size_limit
from app.storage.db_storage import get_storage

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "text/markdown",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
}


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    file_type: str
    status: str
    error_msg: str | None = None
    size_bytes: int
    uploader_id: uuid.UUID | None = None
    created_at: object | None = None
    workspace_id: uuid.UUID | None = None


def _detect_file_type(filename: str, content_type: str | None) -> str | None:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in ("pdf", "docx", "md", "txt", "png", "jpg", "jpeg", "webp", "gif"):
        return ext
    if content_type == "application/pdf":
        return "pdf"
    if content_type in ("text/markdown", "text/plain"):
        return "md" if content_type == "text/markdown" else "txt"
    if content_type in ("image/png", "image/jpeg", "image/webp", "image/gif"):
        return ext or "png"
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
        raise HTTPException(400, "Unsupported file type (allowed: pdf, docx, md, txt, image)")
    data = await file.read()
    
    # Enforce tier-based maximum file upload size
    check_file_size_limit(user, len(data))

    # Check plan limits for total document count
    await check_document_limit(db, user)

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
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(Document)
        .where(Document.workspace_id == membership.workspace_id)
        .where(Document.deleted_at.is_(None))
        .order_by(Document.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


@router.get("/workspaces/{workspace_id}/documents/count")
async def document_count(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(Document.id))
        .where(Document.workspace_id == membership.workspace_id)
        .where(Document.deleted_at.is_(None))
    )
    return {"count": result.scalar() or 0}


@router.get("/documents/mine", response_model=list[DocumentOut])
async def list_my_documents(db: DbSession, user: CurrentUser):
    """Return all non-deleted documents uploaded by the current user across all workspaces."""
    result = await db.execute(
        select(Document)
        .where(Document.uploader_id == user.id)
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
    membership: Membership,
    user: CurrentUser,
):
    """Soft-delete to trash (restore via /trash endpoints). Owner or admin can delete."""
    from app.models.base import utcnow

    document = await db.get(Document, document_id)
    if document is None or document.workspace_id != membership.workspace_id or document.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    
    role = membership.role.value if hasattr(membership.role, "value") else str(membership.role)
    if role != "admin" and document.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the document uploader or workspace admin can delete this document")

    document.deleted_at = utcnow()
    await log_activity(db, membership.workspace_id, user.id, "document.trashed", document.title)
    await db.commit()


@router.post("/workspaces/{workspace_id}/documents/{document_id}/retry", response_model=DocumentOut)
async def retry_document(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: DbSession,
    membership: MemberMembership,
):
    """Re-run ingestion for a failed document."""
    document = await db.get(Document, document_id)
    if document is None or document.workspace_id != membership.workspace_id or document.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    if document.status != "failed":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Only failed documents can be retried")
    document.status = "pending"
    document.error_msg = None
    await db.commit()
    await db.refresh(document)
    background_tasks.add_task(_run_ingest, document.id)
    return document
