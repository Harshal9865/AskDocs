from datetime import timedelta

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.models.base import utcnow, BaseModel  # noqa: F401

router = APIRouter()

ONLINE_WINDOW = timedelta(seconds=60)


@router.post("/ping", status_code=204)
async def presence_ping(db: DbSession, user: CurrentUser):
    user.last_seen_at = utcnow()
    await db.commit()


def is_online(last_seen_at) -> bool:
    if last_seen_at is None:
        return False
    from app.models.base import utcnow

    return (utcnow() - last_seen_at) < ONLINE_WINDOW
