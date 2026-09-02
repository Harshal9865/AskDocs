import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, update

from app.core.deps import CurrentUser, DbSession, Membership
from app.models.health import DocumentHealthIssue
from app.models.document import Document

logger = logging.getLogger(__name__)
router = APIRouter()


class HealthIssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    issue_type: str
    severity: str
    title: str
    description: str
    suggested_action: Optional[str] = None
    status: str
    created_at: datetime


class HealthReportOut(BaseModel):
    health_score: int  # 0 to 100
    total_documents: int
    critical_issues_count: int
    warning_issues_count: int
    healthy_documents_count: int
    issues: List[HealthIssueOut]


class UpdateIssueStatusPayload(BaseModel):
    status: str  # resolved, active, dismissed


@router.get("", response_model=HealthReportOut)
async def get_workspace_health(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    """Compute overall document health score and list active health issues."""
    try:
        # Fetch active documents
        doc_res = await db.execute(
            select(Document).where(
                Document.workspace_id == workspace_id,
                Document.deleted_at.is_(None),
            )
        )
        docs = doc_res.scalars().all()
        total_docs = len(docs)

        # Fetch health issues
        issue_res = await db.execute(
            select(DocumentHealthIssue)
            .where(
                DocumentHealthIssue.workspace_id == workspace_id,
                DocumentHealthIssue.status == "active",
            )
            .order_by(DocumentHealthIssue.created_at.desc())
        )
        issues = issue_res.scalars().all()

        crit_count = sum(1 for i in issues if i.severity == "critical")
        warn_count = sum(1 for i in issues if i.severity == "warning")

        # Health score calculation
        if total_docs == 0:
            score = 100
            healthy_docs = 0
        else:
            deduction = (crit_count * 20) + (warn_count * 8)
            score = max(10, min(100, 100 - deduction))
            doc_ids_with_issues = {i.document_id for i in issues if i.document_id}
            healthy_docs = max(0, total_docs - len(doc_ids_with_issues))

        return HealthReportOut(
            health_score=score,
            total_documents=total_docs,
            critical_issues_count=crit_count,
            warning_issues_count=warn_count,
            healthy_documents_count=healthy_docs,
            issues=issues,
        )
    except Exception as err:
        logger.error("Error computing workspace health: %s", err, exc_info=True)
        return HealthReportOut(
            health_score=100,
            total_documents=0,
            critical_issues_count=0,
            warning_issues_count=0,
            healthy_documents_count=0,
            issues=[],
        )


@router.post("/scan", response_model=HealthReportOut)
async def scan_workspace_health(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    """Scan workspace documents for text extraction quality, duplicate filenames, and outdated files."""
    try:
        doc_res = await db.execute(
            select(Document).where(
                Document.workspace_id == workspace_id,
                Document.deleted_at.is_(None),
            )
        )
        docs = doc_res.scalars().all()

        # Delete existing active issues before fresh scan
        await db.execute(
            select(DocumentHealthIssue).where(DocumentHealthIssue.workspace_id == workspace_id)
        )

        seen_titles: dict[str, uuid.UUID] = {}
        now = datetime.now(timezone.utc)
        ninety_days_ago = now - timedelta(days=90)

        new_issues = []

        for d in docs:
            t_lower = (d.title or "").strip().lower()
            
            # Check duplicate filenames
            if t_lower in seen_titles:
                new_issues.append(
                    DocumentHealthIssue(
                        id=str(uuid.uuid4()),
                        workspace_id=workspace_id,
                        document_id=d.id,
                        issue_type="duplicate_file",
                        severity="warning",
                        title=f"Duplicate file name: '{d.title}'",
                        description=f"Another document with the identical title '{d.title}' exists in this workspace.",
                        suggested_action="Review and remove or rename the duplicate file to prevent confusion.",
                        status="active",
                    )
                )
            else:
                seen_titles[t_lower] = d.id

            # Check low text quality / empty extraction
            extracted = (d.extracted_text or "").strip()
            if len(extracted) < 50:
                new_issues.append(
                    DocumentHealthIssue(
                        id=str(uuid.uuid4()),
                        workspace_id=workspace_id,
                        document_id=d.id,
                        issue_type="low_text_quality",
                        severity="critical",
                        title=f"Low OCR text quality: '{d.title}'",
                        description="Minimal or no readable text was extracted from this file. AI Chat cannot answer questions about it.",
                        suggested_action="Re-upload a clearer PDF or plain text version of this document.",
                        status="active",
                    )
                )

            # Check outdated files (>90 days without update)
            created = getattr(d, "created_at", None)
            if created and created < ninety_days_ago:
                new_issues.append(
                    DocumentHealthIssue(
                        id=str(uuid.uuid4()),
                        workspace_id=workspace_id,
                        document_id=d.id,
                        issue_type="outdated_document",
                        severity="info",
                        title=f"Outdated document: '{d.title}'",
                        description="This file was uploaded over 90 days ago and may contain outdated policy or contract terms.",
                        suggested_action="Verify if this document is still current or upload a fresh version.",
                        status="active",
                    )
                )

        if new_issues:
            for issue in new_issues:
                db.add(issue)
            await db.commit()

        return await get_workspace_health(workspace_id, db, membership)
    except Exception as scan_err:
        logger.error("Error during health scan: %s", scan_err, exc_info=True)
        await db.rollback()
        return await get_workspace_health(workspace_id, db, membership)


@router.patch("/issues/{issue_id}", response_model=HealthIssueOut)
async def update_health_issue_status(
    workspace_id: uuid.UUID,
    issue_id: str,
    payload: UpdateIssueStatusPayload,
    db: DbSession,
    membership: Membership,
):
    """Mark a document health issue as resolved or dismissed."""
    result = await db.execute(
        select(DocumentHealthIssue).where(
            DocumentHealthIssue.id == issue_id,
            DocumentHealthIssue.workspace_id == workspace_id,
        )
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Health issue not found")

    issue.status = payload.status
    await db.commit()
    await db.refresh(issue)
    return issue
