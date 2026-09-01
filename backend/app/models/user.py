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

    # Plan & Subscription fields
    plan: Mapped[str] = mapped_column(String(30), default="free", server_default="free")  # free | premium | ultra_premium
    billing_interval: Mapped[str | None] = mapped_column(String(20), nullable=True, default=None)  # monthly | annual
    subscription_status: Mapped[str] = mapped_column(String(30), default="active", server_default="active")  # active | canceled | past_due
    subscription_renews_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    card_brand: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    card_last4: Mapped[str | None] = mapped_column(String(10), nullable=True, default=None)
    documents_used: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    questions_used: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    plan_reset_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    # Password reset
    reset_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    reset_code_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
