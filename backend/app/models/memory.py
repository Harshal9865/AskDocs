import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class WorkspaceMemory(Base):
    __tablename__ = "workspace_memories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(50), nullable=False, default="decision")  # "decision", "contract", "document", "chat"
    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=False)
    entities = Column(JSON, nullable=False, default=list)  # ["Client X", "Refund Policy", "Finance SOP"]
    tags = Column(JSON, nullable=False, default=list)      # ["approval", "finance", "legal"]
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
