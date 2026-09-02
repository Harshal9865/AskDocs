import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import delete, select

from app.core.deps import CurrentUser, DbSession, MemberMembership
from app.models.contract import ContractObligation
from app.models.document import Chunk, Document
from app.services.llm.gemini_provider import get_llm

router = APIRouter()


class ObligationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    document_id: uuid.UUID
    title: str
    party_name: str | None = None
    obligation_type: str
    due_date: datetime | None = None
    notice_days: int | None = 30
    amount: str | None = None
    status: str
    summary: str | None = None
    created_at: datetime


class ObligationStatusUpdate(BaseModel):
    status: Literal["active", "resolved", "expired"]


@router.get("/obligations", response_model=list[ObligationOut])
async def list_obligations(
    workspace_id: uuid.UUID,
    membership: MemberMembership,
    db: DbSession,
    status_filter: str | None = Query(None, alias="status"),
):
    """List all contract obligations for a workspace."""
    query = select(ContractObligation).where(ContractObligation.workspace_id == workspace_id)
    if status_filter and status_filter != "all":
        query = query.where(ContractObligation.status == status_filter)
    query = query.order_by(ContractObligation.due_date.asc().nulls_last(), ContractObligation.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()


@router.post("/scan/{document_id}", response_model=list[ObligationOut])
async def scan_document_for_contracts(
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    membership: MemberMembership,
    db: DbSession,
):
    """Trigger AI scan on a document to extract contract obligations and deadlines."""
    doc_res = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.workspace_id == workspace_id,
            Document.deleted_at.is_(None),
        )
    )
    doc = doc_res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Fetch document chunks text
    chunks_res = await db.execute(
        select(Chunk.content)
        .where(Chunk.document_id == document_id)
        .order_by(Chunk.ordinal.asc())
        .limit(20)
    )
    chunks = chunks_res.scalars().all()
    full_text = "\n\n".join(chunks)

    if not full_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document has no extractable text")

    llm = get_llm()
    items = await llm.extract_contract_obligations(full_text, doc.title)

    # Delete existing obligations for this doc before re-scanning
    await db.execute(
        delete(ContractObligation).where(
            ContractObligation.workspace_id == workspace_id,
            ContractObligation.document_id == document_id,
        )
    )

    created_obligations = []
    for item in items:
        due_dt = None
        due_str = item.get("due_date")
        if due_str:
            try:
                due_dt = datetime.fromisoformat(due_str.replace("Z", "+00:00"))
                if due_dt.tzinfo is None:
                    due_dt = due_dt.replace(tzinfo=timezone.utc)
            except Exception:
                due_dt = None

        ob = ContractObligation(
            workspace_id=workspace_id,
            document_id=document_id,
            title=str(item.get("title", "Contract Deadline"))[:300],
            party_name=str(item.get("party_name", ""))[:200] if item.get("party_name") else None,
            obligation_type=str(item.get("obligation_type", "renewal")).lower() if item.get("obligation_type") in ["renewal", "payment", "expiration", "compliance", "deliverable", "other"] else "renewal",
            due_date=due_dt,
            notice_days=int(item.get("notice_days", 30)) if item.get("notice_days") else 30,
            amount=str(item.get("amount", ""))[:100] if item.get("amount") else None,
            status="active",
            summary=str(item.get("summary", ""))[:1000] if item.get("summary") else None,
        )
        db.add(ob)
        created_obligations.append(ob)

    await db.commit()
    for ob in created_obligations:
        await db.refresh(ob)
    return created_obligations


@router.patch("/obligations/{obligation_id}", response_model=ObligationOut)
async def update_obligation_status(
    workspace_id: uuid.UUID,
    obligation_id: uuid.UUID,
    payload: ObligationStatusUpdate,
    membership: MemberMembership,
    db: DbSession,
):
    """Update contract obligation status (active, resolved, expired)."""
    res = await db.execute(
        select(ContractObligation).where(
            ContractObligation.id == obligation_id,
            ContractObligation.workspace_id == workspace_id,
        )
    )
    ob = res.scalar_one_or_none()
    if not ob:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obligation not found")

    ob.status = payload.status
    await db.commit()
    await db.refresh(ob)
    return ob


@router.delete("/obligations/{obligation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_obligation(
    workspace_id: uuid.UUID,
    obligation_id: uuid.UUID,
    membership: MemberMembership,
    db: DbSession,
):
    """Delete a contract obligation entry."""
    res = await db.execute(
        select(ContractObligation).where(
            ContractObligation.id == obligation_id,
            ContractObligation.workspace_id == workspace_id,
        )
    )
    ob = res.scalar_one_or_none()
    if not ob:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obligation not found")

    await db.delete(ob)
    await db.commit()
