import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

ObligationTypeEnum = Enum(
    "renewal", "payment", "expiration", "compliance", "deliverable", "other",
    name="obligation_type"
)
ObligationStatusEnum = Enum(
    "active", "resolved", "expired",
    name="obligation_status"
)


class ContractObligation(BaseModel):
    __tablename__ = "contract_obligations"

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    party_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    obligation_type: Mapped[str] = mapped_column(ObligationTypeEnum, default="renewal")
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    notice_days: Mapped[int | None] = mapped_column(Integer, nullable=True, default=30)
    amount: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(ObligationStatusEnum, default="active", index=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
