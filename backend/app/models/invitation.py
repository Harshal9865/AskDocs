import uuid
from datetime import datetime, timedelta

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, utcnow
from app.models.workspace import Role

InvitationStatus = Enum(
    "pending", "accepted", "declined", "cancelled", name="invitation_status"
)


def default_expiry():
    return utcnow() + timedelta(days=7)


class Invitation(BaseModel):
    __tablename__ = "invitations"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id"), index=True
    )
    inviter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    email: Mapped[str] = mapped_column(String(320), index=True)
    role: Mapped[Role] = mapped_column(Enum(Role, name="invite_role"))
    status: Mapped[str] = mapped_column(InvitationStatus, default="pending")
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=default_expiry
    )
