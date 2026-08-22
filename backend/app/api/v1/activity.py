import uuid

from fastapi import APIRouter
from sqlalchemy import select

from app.core.deps import AdminMembership, CurrentUser, DbSession
from app.models.activity import ActivityLog
from app.models.user import User

router = APIRouter()


@router.get("/workspaces/{workspace_id}/activity")
async def get_activity(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: AdminMembership,
    user: CurrentUser,
):
    """Admin-only audit trail, newest first."""
    result = await db.execute(
        select(ActivityLog, User)
        .join(User, User.id == ActivityLog.actor_id)
        .where(ActivityLog.workspace_id == membership.workspace_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(200)
    )
    return [
        {
            "id": str(log.id),
            "actor": actor.name or actor.email,
            "action": log.action,
            "target": log.target,
            "created_at": log.created_at.isoformat(),
        }
        for log, actor in result.all()
    ]
