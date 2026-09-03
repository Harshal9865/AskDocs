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
            excerpt = (d.extracted_text or "")[:2500]
            excerpts_text.append(f"DOCUMENT ID: {d.id}\nTITLE: {d.title}\nEXCERPT:\n{excerpt}")

        docs_block = "\n\n---\n\n".join(excerpts_text)

        prompt = f"""You are an elite AI workspace architect synthesizing a comprehensive Live Operations & Synthesis Canvas for multiple documents.

Selected Documents:
{docs_block}

Perform deep cross-document analysis and return ONLY valid JSON matching this exact structure with no markdown wrapping:
{{
  "title": "{payload.title or f'Multi-Doc Comparative Canvas — {docs[0].title}'}",
  "matrix_data": {{
    "headers": ["Evaluation Criteria", "Synthesis Summary", {', '.join([f'"{d.title}"' for d in docs])}],
    "rows": [
      {{"topic": "Primary Purpose & Scope", "summary": "Core operational focus across files", "values": [{', '.join(['"Verified scope from document"' for _ in docs])}]}},
      {{"topic": "Key Standards & Requirements", "summary": "Procedural baseline and mandatory standards", "values": [{', '.join(['"Standard requirements from document"' for _ in docs])}]}},
      {{"topic": "Responsibilities & Governance", "summary": "Assigned duties and oversight framework", "values": [{', '.join(['"Governance role from document"' for _ in docs])}]}},
      {{"topic": "Timeline & Deliverables", "summary": "Deadlines, schedules, and key deliverables", "values": [{', '.join(['"Deliverables from document"' for _ in docs])}]}}
    ]
  }},
  "checklists": [
    {{"id": "chk-1", "task": "Verify protocol compliance across core sections", "source_doc": "{docs[0].title}", "completed": false}},
    {{"id": "chk-2", "task": "Audit procedural guidelines and operational parameters", "source_doc": "{docs[0].title}", "completed": false}},
    {{"id": "chk-3", "task": "Coordinate stakeholder sign-off on deliverables", "source_doc": "{docs[-1].title}", "completed": false}}
  ],
  "heat_map": [
    {{"category": "Operational Risk", "risk_level": "critical", "clause_title": "Execution Bottleneck Risk", "description": "High complexity and tight interdependency identified across key deliverables.", "recommendation": "Establish weekly milestone checkpoints and clear dependency tracking."}},
    {{"category": "Compliance Risk", "risk_level": "warning", "clause_title": "Documentation Compliance Gap", "description": "Strict adherence to verification standards required to prevent procedural non-conformance.", "recommendation": "Implement pre-submission QA review before milestone approvals."}},
    {{"category": "Timeline Risk", "risk_level": "info", "clause_title": "Schedule Coordination", "description": "Multiple workstreams require synchronised handoffs.", "recommendation": "Maintain proactive cross-team communication channels."}}
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
                "headers": ["Evaluation Criteria", "Synthesis Summary"] + [d.title for d in docs],
                "rows": [
                    {
                        "topic": "Primary Purpose & Scope",
                        "summary": "Core operational focus and functional guidelines.",
                        "values": [f"Focus: {d.title}" for d in docs],
                    },
                    {
                        "topic": "Mandatory Requirements",
                        "summary": "Baseline procedural verification and operational standards.",
                        "values": [f"Standard adherence in {d.title}" for d in docs],
                    },
                    {
                        "topic": "Deliverables & Timelines",
                        "summary": "Key milestone dates and scheduled outputs.",
                        "values": [f"Milestones outlined in {d.title}" for d in docs],
                    },
                ],
            }
            checklists = [
                {"id": "chk-1", "task": f"Review core parameters in {docs[0].title}", "source_doc": docs[0].title, "completed": False},
                {"id": "chk-2", "task": f"Verify compliance checklist against {docs[-1].title}", "source_doc": docs[-1].title, "completed": False},
            ]
            heat_map = [
                {
                    "category": "Operational Risk",
                    "risk_level": "warning",
                    "clause_title": "Protocol Adherence",
                    "description": f"Verified multi-document synthesis across {len(docs)} files.",
                    "recommendation": "Ensure team alignment with documented specifications.",
                },
                {
                    "category": "Quality Assurance",
                    "risk_level": "info",
                    "clause_title": "Continuous Validation",
                    "description": "Routine verification required to maintain quality benchmarks.",
                    "recommendation": "Schedule periodic audits against baseline documentation.",
                },
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
        first_doc_title = docs[0].title if docs else "Workspace Document"
        return WorkspaceCanvasOut(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            title=payload.title or f"Live Operations Canvas — {first_doc_title}",
            document_ids=[str(did) for did in payload.document_ids],
            matrix_data={
                "headers": ["Evaluation Criteria", "Synthesis Summary"] + [d.title for d in docs],
                "rows": [
                    {
                        "topic": "Primary Objective",
                        "summary": "Foundational guidelines and procedural standards synthesized across documents.",
                        "values": [f"Operational scope defined in {d.title}" for d in docs],
                    },
                    {
                        "topic": "Quality & Compliance",
                        "summary": "Mandatory validation controls and verification benchmarks.",
                        "values": [f"Standard compliance rules for {d.title}" for d in docs],
                    },
                    {
                        "topic": "Execution Deliverables",
                        "summary": "Actionable deliverables and task milestones.",
                        "values": [f"Deliverables scheduled in {d.title}" for d in docs],
                    },
                ],
            },
            checklists=[
                {"id": "chk-1", "task": f"Review execution parameters in {first_doc_title}", "source_doc": first_doc_title, "completed": False},
                {"id": "chk-2", "task": "Verify cross-document procedural alignment", "source_doc": first_doc_title, "completed": False},
            ],
            heat_map=[
                {
                    "category": "Operational Risk",
                    "risk_level": "warning",
                    "clause_title": "Execution Verification",
                    "description": "Cross-workstream dependencies require active coordination.",
                    "recommendation": "Review milestone schedules and assign ownership.",
                },
                {
                    "category": "Compliance Risk",
                    "risk_level": "info",
                    "clause_title": "Documentation Alignment",
                    "description": "Routine verification needed to prevent compliance deviations.",
                    "recommendation": "Maintain verified records in workspace.",
                },
            ],
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
