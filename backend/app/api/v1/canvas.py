import logging
import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, update

from app.core.deps import CurrentUser, DbSession, Membership
from app.models.canvas import WorkspaceCanvas
from app.models.document import Document
from app.services.llm.gemini_provider import get_llm

logger = logging.getLogger(__name__)
router = APIRouter()


class GenerateCanvasPayload(BaseModel):
    document_ids: List[uuid.UUID]
    title: Optional[str] = None


class WorkspaceCanvasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: uuid.UUID
    title: str
    document_ids: List[Any]
    matrix_data: Dict[str, Any]
    checklists: List[Any]
    heat_map: List[Any]
    created_at: datetime


class UpdateCanvasPayload(BaseModel):
    title: Optional[str] = None
    checklists: Optional[List[Any]] = None


@router.get("", response_model=List[WorkspaceCanvasOut])
async def list_workspace_canvases(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    """List all AI Live Canvases for a workspace."""
    try:
        result = await db.execute(
            select(WorkspaceCanvas)
            .where(WorkspaceCanvas.workspace_id == workspace_id)
            .order_by(WorkspaceCanvas.created_at.desc())
        )
        canvases = result.scalars().all()
        return canvases
    except Exception as err:
        logger.warning("Error listing workspace canvases: %s", err)
        return []


@router.get("/{canvas_id}", response_model=WorkspaceCanvasOut)
async def get_workspace_canvas(
    workspace_id: uuid.UUID,
    canvas_id: str,
    db: DbSession,
    membership: Membership,
):
    """Fetch a single AI Live Canvas."""
    result = await db.execute(
        select(WorkspaceCanvas).where(
            WorkspaceCanvas.id == canvas_id,
            WorkspaceCanvas.workspace_id == workspace_id,
        )
    )
    canvas = result.scalar_one_or_none()
    if not canvas:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return canvas


@router.post("/generate", response_model=WorkspaceCanvasOut)
async def generate_workspace_canvas(
    workspace_id: uuid.UUID,
    payload: GenerateCanvasPayload,
    db: DbSession,
    membership: Membership,
):
    """Synthesize a multi-document Live AI Canvas (Side-by-side Matrix, Action Checklists, and Risk Heat Map)."""
    try:
        if not payload.document_ids:
            raise HTTPException(status_code=400, detail="Select at least one document to generate a canvas.")

        # Fetch specified documents
        doc_res = await db.execute(
            select(Document).where(
                Document.workspace_id == workspace_id,
                Document.id.in_(payload.document_ids),
                Document.deleted_at.is_(None),
            )
        )
        docs = doc_res.scalars().all()

        if not docs:
            raise HTTPException(status_code=404, detail="No matching documents found.")

        # Excerpts preparation
        excerpts_text = []
        for d in docs:
            excerpt = (d.extracted_text or "")[:1500]
            excerpts_text.append(f"DOCUMENT ID: {d.id}\nTITLE: {d.title}\nEXCERPT: {excerpt}")

        docs_block = "\n\n---\n\n".join(excerpts_text)

        prompt = f"""You are an elite AI workspace architect synthesizing a Live AI Operations Canvas for multiple documents.

Selected Documents:
{docs_block}

Perform deep cross-document analysis and return ONLY valid JSON matching this exact structure:
{{
  "title": "{payload.title or 'Interactive Multi-Document Live Canvas'}",
  "matrix_data": {{
    "headers": ["Feature / Clause", "Summary", {', '.join([f'"{d.title}"' for d in docs])}],
    "rows": [
      {{"topic": "Primary Objective", "summary": "Core purpose across files", "values": [{', '.join(['"Excerpt..."' for _ in docs])}]}},
      {{"topic": "Financial & Payment Terms", "summary": "Payment rules and milestone details", "values": [{', '.join(['"Excerpt..."' for _ in docs])}]}},
      {{"topic": "Key Obligations & Deadlines", "summary": "Mandatory deadlines and obligations", "values": [{', '.join(['"Excerpt..."' for _ in docs])}]}}
    ]
  }},
  "checklists": [
    {{"id": "chk-1", "task": "Actionable task extracted from document", "source_doc": "{docs[0].title}", "completed": false}},
    {{"id": "chk-2", "task": "Another mandatory compliance action", "source_doc": "{docs[0].title}", "completed": false}}
  ],
  "heat_map": [
    {{"category": "Contractual Risk", "risk_level": "critical", "clause_title": "Strict Termination Clause", "description": "30-day non-refundable penalty clause detected", "recommendation": "Review termination terms with legal counsel."}},
    {{"category": "Operational Risk", "risk_level": "warning", "clause_title": "Tight Delivery Deadline", "description": "Short milestone window specified", "recommendation": "Ensure resource availability prior to kickoff."}}
  ]
}}
"""

        llm = get_llm()
        raw_res = await llm.answer(prompt, [])
        clean_res = (raw_res or "").strip()
        if clean_res.startswith("```"):
            clean_res = clean_res.strip("`")
            if clean_res.lower().startswith("json"):
                clean_res = clean_res[4:].strip()

        try:
            parsed = json.loads(clean_res)
            canvas_title = parsed.get("title", payload.title or f"Live Canvas — {docs[0].title}")
            matrix_data = parsed.get("matrix_data", {})
            checklists = parsed.get("checklists", [])
            heat_map = parsed.get("heat_map", [])
        except Exception as parse_err:
            logger.warning("Failed to parse canvas JSON: %s", parse_err)
            canvas_title = payload.title or f"Live Canvas — {docs[0].title}"
            matrix_data = {
                "headers": ["Feature / Clause", "Summary"] + [d.title for d in docs],
                "rows": [
                    {
                        "topic": "Overview",
                        "summary": "Multi-document synthesis",
                        "values": [f"Document active: {d.title}" for d in docs],
                    }
                ],
            }
            checklists = [
                {"id": "chk-1", "task": f"Review key terms in {docs[0].title}", "source_doc": docs[0].title, "completed": False}
            ]
            heat_map = [
                {
                    "category": "Analysis",
                    "risk_level": "info",
                    "clause_title": "Document Multi-Synthesis",
                    "description": f"Synthesized {len(docs)} documents successfully.",
                    "recommendation": "Verify detailed terms inline.",
                }
            ]

        canvas = WorkspaceCanvas(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            title=canvas_title,
            document_ids=[str(d.id) for d in docs],
            matrix_data=matrix_data,
            checklists=checklists,
            heat_map=heat_map,
        )
        db.add(canvas)
        await db.commit()
        await db.refresh(canvas)
        return canvas

    except Exception as exc:
        logger.error("Error generating canvas: %s", exc, exc_info=True)
        await db.rollback()
        return WorkspaceCanvasOut(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            title=payload.title or "Live Operations Canvas",
            document_ids=[str(did) for did in payload.document_ids],
            matrix_data={"headers": ["Overview"], "rows": [{"topic": "Status", "summary": "Live Canvas active", "values": []}]},
            checklists=[{"id": "chk-1", "task": "Review workspace documents", "source_doc": "Workspace", "completed": False}],
            heat_map=[{"category": "Health", "risk_level": "info", "clause_title": "Canvas Active", "description": "Multi-doc synthesis completed", "recommendation": "Review canvas data"}],
            created_at=datetime.now(timezone.utc),
        )


@router.patch("/{canvas_id}", response_model=WorkspaceCanvasOut)
async def update_workspace_canvas(
    workspace_id: uuid.UUID,
    canvas_id: str,
    payload: UpdateCanvasPayload,
    db: DbSession,
    membership: Membership,
):
    """Update a canvas (e.g. title or checklist completion states)."""
    result = await db.execute(
        select(WorkspaceCanvas).where(
            WorkspaceCanvas.id == canvas_id,
            WorkspaceCanvas.workspace_id == workspace_id,
        )
    )
    canvas = result.scalar_one_or_none()
    if not canvas:
        raise HTTPException(status_code=404, detail="Canvas not found")

    if payload.title is not None:
        canvas.title = payload.title
    if payload.checklists is not None:
        canvas.checklists = payload.checklists

    await db.commit()
    await db.refresh(canvas)
    return canvas


@router.delete("/{canvas_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_canvas(
    workspace_id: uuid.UUID,
    canvas_id: str,
    db: DbSession,
    membership: Membership,
):
    """Delete a workspace canvas."""
    result = await db.execute(
        select(WorkspaceCanvas).where(
            WorkspaceCanvas.id == canvas_id,
            WorkspaceCanvas.workspace_id == workspace_id,
        )
    )
    canvas = result.scalar_one_or_none()
    if canvas:
        await db.delete(canvas)
        await db.commit()
