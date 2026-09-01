"""Plan limit enforcement."""
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select

from app.core.config import get_settings
from app.models.document import Document
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember


PLAN_LIMITS = {
    "free": {"documents": 100, "questions": 200, "workspaces": 3, "max_file_size_mb": 15, "name": "Free"},
    "premium": {"documents": 1000, "questions": 3000, "workspaces": 15, "max_file_size_mb": 50, "name": "Premium"},
    "ultra_premium": {"documents": -1, "questions": -1, "workspaces": -1, "max_file_size_mb": 200, "name": "Ultra Premium"},
    # Legacy fallbacks
    "pro": {"documents": 1000, "questions": 3000, "workspaces": 15, "max_file_size_mb": 50, "name": "Premium"},
    "enterprise": {"documents": -1, "questions": -1, "workspaces": -1, "max_file_size_mb": 200, "name": "Ultra Premium"},
}


def get_plan_limits(plan: str | None) -> dict:
    if not plan:
        return PLAN_LIMITS["free"]
    return PLAN_LIMITS.get(plan.lower(), PLAN_LIMITS["free"])


def check_file_size_limit(user: User, file_size_bytes: int):
    """Raise 413 if file exceeds user's tier maximum upload size."""
    limits = get_plan_limits(user.plan)
    max_mb = limits.get("max_file_size_mb", 15)
    max_bytes = max_mb * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            413,
            f"File size exceeds your {limits['name']} plan limit ({max_mb} MB). "
            f"Upgrade to Premium or Ultra Premium for larger files."
        )


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
            f"Document limit reached ({limits['documents']} documents). "
            f"Upgrade your plan for higher or unlimited document storage."
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
            f"Monthly question limit reached ({limits['questions']}/month). "
            f"Upgrade your plan for more questions."
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
            f"Workspace limit reached ({limits['workspaces']} workspaces). "
            f"Upgrade your plan to create more workspaces."
        )
