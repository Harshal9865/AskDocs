import logging
import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession, Membership
from app.models.memory import WorkspaceMemory
from app.models.document import Document
from app.models.contract import ContractObligation
from app.services.llm.gemini_provider import get_llm

logger = logging.getLogger(__name__)
router = APIRouter()


class WorkspaceMemoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: uuid.UUID
    source_type: str
    title: str
    summary: str
    entities: List[Any]
    tags: List[Any]
    created_at: datetime


class MemoryGraphNode(BaseModel):
    id: str
    label: str
    type: str  # "document", "contract", "decision", "policy"
    details: str


class MemoryGraphEdge(BaseModel):
    source: str
    target: str
    relation: str


class MemoryGraphOut(BaseModel):
    nodes: List[MemoryGraphNode]
    edges: List[MemoryGraphEdge]
    memories: List[WorkspaceMemoryOut]


class MemoryQueryPayload(BaseModel):
    query: str


class MemoryQueryResponse(BaseModel):
    answer: str
    relevant_memories: List[WorkspaceMemoryOut]


@router.get("", response_model=List[WorkspaceMemoryOut])
async def list_workspace_memories(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    """List all workspace memory entries."""
    try:
        res = await db.execute(
            select(WorkspaceMemory)
            .where(WorkspaceMemory.workspace_id == workspace_id)
            .order_by(WorkspaceMemory.created_at.desc())
        )
        return res.scalars().all()
    except Exception as err:
        logger.warning("Error listing workspace memories: %s", err)
        return []


@router.get("/graph", response_model=MemoryGraphOut)
async def get_workspace_memory_graph(
    workspace_id: uuid.UUID,
    db: DbSession,
    membership: Membership,
):
    """Fetch Knowledge Mind Map nodes, edges, and memory records."""
    try:
        # Fetch documents, obligations, and memories
        doc_res = await db.execute(
            select(Document).where(Document.workspace_id == workspace_id, Document.deleted_at.is_(None)).limit(10)
        )
        docs = doc_res.scalars().all()

        ob_res = await db.execute(
            select(ContractObligation).where(ContractObligation.workspace_id == workspace_id).limit(10)
        )
        obs = ob_res.scalars().all()

        mem_res = await db.execute(
            select(WorkspaceMemory).where(WorkspaceMemory.workspace_id == workspace_id).order_by(WorkspaceMemory.created_at.desc()).limit(15)
        )
        memories = mem_res.scalars().all()

        nodes: List[MemoryGraphNode] = []
        edges: List[MemoryGraphEdge] = []

        # Add root node
        nodes.append(MemoryGraphNode(
            id="ws-root",
            label="Workspace Mind Map",
            type="root",
            details="Central Knowledge Node",
        ))

        for d in docs:
            node_id = f"doc-{d.id}"
            nodes.append(MemoryGraphNode(
                id=node_id,
                label=d.title,
                type="document",
                details=f"Type: {d.file_type.upper()} · Uploaded {d.created_at.strftime('%b %d')}",
            ))
            edges.append(MemoryGraphEdge(source="ws-root", target=node_id, relation="contains_doc"))

        for o in obs:
            node_id = f"ob-{o.id}"
            nodes.append(MemoryGraphNode(
                id=node_id,
                label=o.title,
                type="contract",
                details=f"Type: {o.obligation_type.upper()} · Status: {o.status.upper()}",
            ))
            edges.append(MemoryGraphEdge(source="ws-root", target=node_id, relation="tracks_contract"))

        for m in memories:
            node_id = f"mem-{m.id}"
            nodes.append(MemoryGraphNode(
                id=node_id,
                label=m.title,
                type="decision",
                details=m.summary[:100],
            ))
            edges.append(MemoryGraphEdge(source="ws-root", target=node_id, relation="retains_memory"))

        return MemoryGraphOut(
            nodes=nodes,
            edges=edges,
            memories=memories,
        )

    except Exception as err:
        logger.error("Error building memory graph: %s", err, exc_info=True)
        return MemoryGraphOut(
            nodes=[MemoryGraphNode(id="ws-root", label="Workspace Knowledge", type="root", details="Active Mind Map")],
            edges=[],
            memories=[],
        )


@router.post("/query", response_model=MemoryQueryResponse)
async def query_workspace_memory(
    workspace_id: uuid.UUID,
    payload: MemoryQueryPayload,
    db: DbSession,
    membership: Membership,
):
    """Query workspace institutional memory timeline."""
    try:
        mem_res = await db.execute(
            select(WorkspaceMemory).where(WorkspaceMemory.workspace_id == workspace_id).order_by(WorkspaceMemory.created_at.desc()).limit(20)
        )
        memories = mem_res.scalars().all()

        mem_context = "\n\n".join([f"RECORD: {m.title}\nSUMMARY: {m.summary}\nDATE: {m.created_at.strftime('%Y-%m-%d')}" for m in memories])

        prompt = f"""You are an elite Institutional Memory Preserver analyzing company decision history.

Query: "{payload.query}"

Workspace Historical Context:
{mem_context or "No historical decision records indexed yet."}

Provide an articulate, structured chronological answer summarizing decisions, agreements, and policies."""

        llm = get_llm()
        ai_answer = await llm.answer(prompt, [])

        return MemoryQueryResponse(
            answer=ai_answer,
            relevant_memories=memories[:5],
        )
    except Exception as err:
        logger.warning("Error querying memory: %s", err)
        return MemoryQueryResponse(
            answer="No relevant institutional memory records found matching your query.",
            relevant_memories=[],
        )


class IngestTranscriptPayload(BaseModel):
    title: str
    transcript_text: str


@router.post("/transcript", response_model=WorkspaceMemoryOut)
async def ingest_meeting_transcript(
    workspace_id: uuid.UUID,
    payload: IngestTranscriptPayload,
    db: DbSession,
    membership: Membership,
):
    """Parse meeting transcript or call summary with Gemini AI and index into Institutional Memory."""
    try:
        prompt = f"""You are an elite Institutional Memory Preserver. Analyze this meeting transcript / call summary:

TITLE: {payload.title}
TRANSCRIPT:
{payload.transcript_text[:4000]}

Return ONLY valid JSON matching this exact structure:
{{
  "title": "{payload.title}",
  "summary": "Concise summary of key decisions, agreements, attendees, and action items",
  "entities": ["Attendee / Project Name 1", "Entity 2"],
  "tags": ["meeting", "decision", "action-item"]
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
            mem_title = parsed.get("title", payload.title)
            mem_summary = parsed.get("summary", payload.transcript_text[:300])
            entities = parsed.get("entities", ["Meeting Notes"])
            tags = parsed.get("tags", ["meeting", "notes"])
        except Exception:
            mem_title = payload.title
            mem_summary = payload.transcript_text[:300]
            entities = ["Meeting Notes"]
            tags = ["meeting"]

        mem = WorkspaceMemory(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            source_type="chat",
            title=mem_title,
            summary=mem_summary,
            entities=entities,
            tags=tags,
        )
        db.add(mem)
        await db.commit()
        await db.refresh(mem)
        return mem

    except Exception as exc:
        logger.error("Error ingesting meeting transcript: %s", exc, exc_info=True)
        await db.rollback()
        mem = WorkspaceMemory(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            source_type="chat",
            title=payload.title,
            summary=payload.transcript_text[:300],
            entities=["Meeting Notes"],
            tags=["meeting"],
        )
        db.add(mem)
        await db.commit()
        await db.refresh(mem)
        return mem
