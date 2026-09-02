import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class WorkspaceDigest(Base):
    __tablename__ = "workspace_digests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    summary_markdown = Column(Text, nullable=False)
    key_takeaways = Column(JSON, nullable=True, default=list)
    document_count = Column(Integer, default=0)
    contract_alerts_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
