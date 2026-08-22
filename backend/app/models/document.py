import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel
from app.models.workspace import Workspace, WorkspaceMember  # noqa: F401 (mappers)

StatusEnum = Enum("pending", "processing", "ready", "failed", name="document_status")
FileTypeEnum = Enum("pdf", "docx", "md", "txt", name="file_type")


class Document(BaseModel):
    __tablename__ = "documents"

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
    uploader_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(300))
    file_type: Mapped[str] = mapped_column(FileTypeEnum)
    storage_key: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(StatusEnum, default="pending")
    error_msg: Mapped[str | None] = mapped_column(Text, nullable=True)
    size_bytes: Mapped[int] = mapped_column(Integer)


class Chunk(BaseModel):
    __tablename__ = "chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
    ordinal: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int] = mapped_column(Integer)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    embedding = mapped_column(Vector(768))
