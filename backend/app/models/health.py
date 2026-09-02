import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class DocumentHealthIssue(Base):
    __tablename__ = "document_health_issues"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True, index=True)
    issue_type = Column(String(50), nullable=False)  # low_text_quality, duplicate_file, outdated_document, missing_metadata, contract_risk
    severity = Column(String(20), nullable=False, default="warning")  # critical, warning, info
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, resolved, dismissed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
