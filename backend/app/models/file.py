import uuid

from sqlalchemy import LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class FileBlob(BaseModel):
    """Raw uploaded file bytes stored in Postgres (portable across hosts)."""

    __tablename__ = "file_blobs"

    key: Mapped[str] = mapped_column(String(500), unique=True, index=True)
    data: Mapped[bytes] = mapped_column(LargeBinary)
