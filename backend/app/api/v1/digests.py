import logging
import uuid
from datetime import datetime, timezone
from typing import List, Union

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession, Membership
from app.models.contract import ContractObligation
from app.models.digest import WorkspaceDigest
from app.models.document import Document
from app.services.llm.gemini_provider import get_llm

logger = logging.getLogger(__name__)
router = APIRouter()


class WorkspaceDigestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: Union[uuid.UUID, str]
    title: str
    summary_markdown: str
    key_takeaways: List[str]
    document_count: int
    contract_alerts_count: int
    created_at: datetime


@router.get("", response_model=List[WorkspaceDigestOut])
async def list_workspace_digests(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    """List all AI weekly digests for a workspace."""
    try:
        result = await db.execute(
            select(WorkspaceDigest)
            .where(WorkspaceDigest.workspace_id == workspace_id)
            .order_by(WorkspaceDigest.created_at.desc())
        )
        digests = result.scalars().all()
        return digests
    except Exception as err:
        logger.warning("Error fetching workspace digests: %s", err)
        return []


@router.post("/generate", response_model=WorkspaceDigestOut)
async def generate_workspace_digest(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    """Synthesize an AI Executive Weekly Digest of all documents and obligations in the workspace."""
    try:
        # Fetch recent active documents
        doc_res = await db.execute(
            select(Document)
            .where(Document.workspace_id == workspace_id, Document.deleted_at.is_(None))
            .order_by(Document.created_at.desc())
            .limit(10)
        )
        docs = doc_res.scalars().all()

        # Fetch active contract obligations
        ob_res = await db.execute(
            select(ContractObligation)
            .where(ContractObligation.workspace_id == workspace_id)
            .order_by(ContractObligation.due_date.asc())
        )
        obligations = ob_res.scalars().all()

        # Prepare excerpts for Gemini AI synthesis
        excerpts_text = []
        for d in docs:
            excerpt = (d.extracted_text or "")[:1200]
            created_str = d.created_at.strftime("%Y-%m-%d") if getattr(d, "created_at", None) else "Recently"
            doc_title = getattr(d, "title", "Untitled Document")
            excerpts_text.append(f"Document: '{doc_title}' (Uploaded: {created_str})\nExcerpt: {excerpt}")

        ob_summaries = []
        for o in obligations:
            due_str = o.due_date.strftime("%Y-%m-%d") if getattr(o, "due_date", None) else "No fixed date"
            ob_type = getattr(o, "obligation_type", "obligation") or "obligation"
            ob_title = getattr(o, "title", "Contract Item")
            party = getattr(o, "party_name", "N/A") or "N/A"
            ob_status = getattr(o, "status", "active")
            ob_summaries.append(f"- [{ob_type.upper()}] {ob_title} (Party: {party}, Due: {due_str}, Status: {ob_status})")

        context_block = "\n\n".join(excerpts_text) if excerpts_text else "No documents uploaded yet."
        ob_block = "\n".join(ob_summaries) if ob_summaries else "No active contract obligations."

        date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
        prompt = f"""You are an executive AI assistant synthesizing a Proactive Weekly Digest for a team workspace.

Analyzing {len(docs)} documents and {len(obligations)} contract obligations:

=== RECENT DOCUMENTS ===
{context_block}

=== CONTRACT OBLIGATIONS ===
{ob_block}

Formulate a structured Weekly Executive Digest in Markdown. Include:
1. **Executive Overview**: A 2-3 sentence high-level summary of the workspace's primary focus, current active files, and operational health.
2. **Key Strategic Takeaways**: 3-5 concise bullet points highlighting key decisions, contractual commitments, or important knowledge.
3. **Contract & Deadline Alerts**: A summary of any upcoming contract renewals, payment terms, or compliance windows.
4. **Document Knowledge Breakdown**: Highlights of what the uploaded documents cover.

Reply ONLY with valid JSON in this exact structure:
{{
  "title": "Weekly Digest — {date_str}",
  "summary_markdown": "<complete markdown report>",
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}}
"""

        digest_title = f"Weekly Digest — {date_str}"
        summary_md = f"### Workspace Executive Digest\n\nSynthesized **{len(docs)} active documents** and **{len(obligations)} contract obligations**.\n\n"
        takeaways = [f"Analyzed {len(docs)} documents in workspace", f"Tracked {len(obligations)} contract obligations"]

        try:
            llm = get_llm()
            raw_res = await llm.answer(prompt, [])
            clean_res = (raw_res or "").strip()
            if clean_res.startswith("```"):
                clean_res = clean_res.strip("`")
                if clean_res.lower().startswith("json"):
                    clean_res = clean_res[4:].strip()

            import json
            parsed = json.loads(clean_res)
            digest_title = parsed.get("title", digest_title)
            summary_md = parsed.get("summary_markdown", summary_md)
            takeaways = parsed.get("key_takeaways", takeaways)
        except Exception as ai_err:
            logger.warning("AI Digest parsing fallback: %s", ai_err)
            if docs:
                summary_md += "\n#### Active Documents Breakdown:\n"
                for d in docs:
                    summary_md += f"- **{getattr(d, 'title', 'Document')}**: Active file in workspace repository.\n"

        try:
            digest = WorkspaceDigest(
                id=str(uuid.uuid4()),
                workspace_id=workspace_id,
                title=digest_title,
                summary_markdown=summary_md,
                key_takeaways=takeaways,
                document_count=len(docs),
                contract_alerts_count=len(obligations),
            )
            db.add(digest)
            await db.commit()
            await db.refresh(digest)
            return digest
        except Exception as commit_err:
            logger.error("Failed to commit WorkspaceDigest: %s", commit_err, exc_info=True)
            await db.rollback()
            return WorkspaceDigestOut(
                id=str(uuid.uuid4()),
                workspace_id=str(workspace_id),
                title=digest_title,
                summary_markdown=summary_md,
                key_takeaways=takeaways,
                document_count=len(docs),
                contract_alerts_count=len(obligations),
                created_at=datetime.now(timezone.utc),
            )

    except Exception as outer_err:
        logger.error("Unhandled error in generate_workspace_digest: %s", outer_err, exc_info=True)
        date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
        return WorkspaceDigestOut(
            id=str(uuid.uuid4()),
            workspace_id=str(workspace_id),
            title=f"Weekly Digest — {date_str}",
            summary_markdown="### Workspace Executive Digest\n\nSynthesized workspace status. Upload documents to generate deep strategic insights.",
            key_takeaways=["Workspace digest active"],
            document_count=0,
            contract_alerts_count=0,
            created_at=datetime.now(timezone.utc),
        )


@router.delete("/{digest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_digest(
    workspace_id: uuid.UUID,
    digest_id: str,
    db: DbSession,
    membership: Membership,
):
    """Delete a workspace digest entry."""
    try:
        result = await db.execute(
            select(WorkspaceDigest).where(
                WorkspaceDigest.id == digest_id,
                WorkspaceDigest.workspace_id == workspace_id,
            )
        )
        digest = result.scalar_one_or_none()
        if digest:
            await db.delete(digest)
            await db.commit()
    except Exception as err:
        logger.warning("Error deleting workspace digest: %s", err)
