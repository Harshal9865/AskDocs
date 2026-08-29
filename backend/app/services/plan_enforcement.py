"""Plan limit enforcement."""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select

from app.core.config import get_settings
from app.models.document import Document
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember


PLAN_LIMITS = {
    "free": {"documents": 100, "questions": 200, "workspaces": 5},
    "pro": {"documents": 500, "questions": 2000, "workspaces": 20},
    "enterprise": {"documents": -1, "questions": -1, "workspaces": -1},  # -1 = unlimited
}


def get_plan_limits(plan: str) -> dict:
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])


async def check_document_limit(db, user: User):
    """Raise 429 if user has hit their document upload limit."""
    limits = get_plan_limits(user.plan)
    if limits["documents"] == -1:
        return  # unlimited

    # Count non-deleted documents across all user's workspaces
    my_ws = await db.execute(
        select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user.id)
    )
    ws_ids = [wid for (wid,) in my_ws.all()]
    if not ws_ids:
        return

    count = await db.execute(
        select(func.count(Document.id))
        .where(Document.workspace_id.in_(ws_ids))
        .where(Document.uploader_id == user.id)
        .where(Document.deleted_at.is_(None))
    )
    used = count.scalar() or 0
    if used >= limits["documents"]:
        raise HTTPException(
            429,
            f"Document limit reached ({limits['documents']}). "
            f"Upgrade to Pro for more at /settings."
        )
    # Update counter on user
    user.documents_used = used + 1
    await db.commit()


async def check_question_limit(db, user: User):
    """Raise 429 if user has hit their question limit for this billing period."""
    limits = get_plan_limits(user.plan)
    if limits["questions"] == -1:
        return  # unlimited

    # Check if billing period has reset
    now = datetime.now(timezone.utc)
    if user.plan_reset_at is None or (now - user.plan_reset_at).days >= 30:
        user.questions_used = 0
        user.plan_reset_at = now
        await db.commit()

    if user.questions_used >= limits["questions"]:
        raise HTTPException(
            429,
            f"Question limit reached ({limits['questions']}/month). "
            f"Upgrade to Pro for more at /settings."
        )
    user.questions_used += 1
    await db.commit()


async def check_workspace_limit(db, user: User):
    """Raise 429 if user has hit their workspace creation limit."""
    limits = get_plan_limits(user.plan)
    if limits["workspaces"] == -1:
        return  # unlimited

    count = await db.execute(
        select(func.count(Workspace.id))
        .where(Workspace.created_by == user.id)
    )
    used = count.scalar() or 0
    if used >= limits["workspaces"]:
        raise HTTPException(
            429,
            f"Workspace limit reached ({limits['workspaces']}). "
            f"Upgrade to Pro for more at /settings."
        )
