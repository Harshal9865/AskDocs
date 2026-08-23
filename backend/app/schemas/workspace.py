import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkspaceCreate(BaseModel):
    name: str


class WorkspaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime
    brand_kind: str | None = None
    brand_value: str | None = None


class MemberAdd(BaseModel):
    email: str
    role: str = "member"


class MemberUpdate(BaseModel):
    role: str


class MemberOut(BaseModel):
    user_id: uuid.UUID
    email: str
    name: str = ""
    role: str
    online: bool = False
    last_seen_at: datetime | None = None
    avatar_kind: str | None = None
    avatar_value: str | None = None


class InvitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    email: str
    role: str
    status: str
    created_at: datetime
