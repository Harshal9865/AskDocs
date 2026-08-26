import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    created_at: datetime
    avatar_kind: str = "initials"
    avatar_value: str | None = None
    bio: str | None = None
    phone: str | None = None
    status: str | None = None
    location: str | None = None
    pronouns: str | None = None
    job_title: str | None = None
    job_role: str | None = None
    online: bool = False
    friendship_status: str = "none"
    friendship_id: str | None = None
    friendship_by_me: bool = False


class ProfileUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
    phone: str | None = None
    status: str | None = None
    location: str | None = None
    pronouns: str | None = None
    job_title: str | None = None
    job_role: str | None = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    username: str  # OAuth2 password flow sends email here
    password: str
