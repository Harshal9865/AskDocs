import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    created_at: datetime


class MessageCreate(BaseModel):
    content: str
    attachment_ids: list[str] = []

    @field_validator("content")
    @classmethod
    def not_blank(cls, v: str) -> str:
        # allow empty content when attachments carry the message (e.g. image-only ask)
        if not v.strip():
            # caller must still send something; empty string with attachments is allowed
            return v.strip()
        return v.strip()


class Citation(BaseModel):
    document_id: str
    document_title: str
    chunk_ordinal: int
    snippet: str


class SuggestedColleague(BaseModel):
    user_id: str
    name: str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    content: str
    citations: list | None = None
    created_at: datetime
    suggested_colleagues: list[SuggestedColleague] | None = None
    conflict: dict | None = None
    freshness: dict | None = None
