import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    name: Mapped[str] = mapped_column(String(200))
    last_seen_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    avatar_kind: Mapped[str] = mapped_column(
        String(20), default="initials"
    )  # initials | sticker | upload
    avatar_value: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    pronouns: Mapped[str | None] = mapped_column(String(50), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    job_role: Mapped[str | None] = mapped_column(String(120), nullable=True)

    # Plan fields
    plan: Mapped[str] = mapped_column(String(20), default="free", server_default="free")  # free | pro | enterprise
    documents_used: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    questions_used: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    plan_reset_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
