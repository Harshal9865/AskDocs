import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class WorkspaceCanvas(Base):
    __tablename__ = "workspace_canvases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    document_ids = Column(JSON, nullable=False, default=list)
    matrix_data = Column(JSON, nullable=False, default=dict)
    checklists = Column(JSON, nullable=False, default=list)
    heat_map = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
