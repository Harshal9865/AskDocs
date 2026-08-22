import enum
import uuid

from sqlalchemy import Enum, ForeignKey, UniqueConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Role(str, enum.Enum):
    admin = "admin"
    member = "member"
    viewer = "viewer"


class Workspace(BaseModel):
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))


class WorkspaceMember(BaseModel):
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id"),)

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[Role] = mapped_column(Enum(Role, name="member_role"))
