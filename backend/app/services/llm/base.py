from abc import ABC, abstractmethod

from pydantic import BaseModel


class Citation(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    ordinal: int
    snippet: str
    score: float


class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    ordinal: int
    content: str
    score: float


class LLMProvider(ABC):
    """Interface every AI provider must implement (swappable / mockable)."""

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts."""

    @abstractmethod
    async def answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ) -> str:
        """Answer a question grounded in the given context chunks.
        image_parts: optional provider-native multimodal parts (e.g. images)."""

    @abstractmethod
    async def stream_answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ):
        """Yield answer tokens one by one.
        image_parts: optional provider-native multimodal parts (e.g. images)."""

    async def detect_conflict(self, contexts: list[RetrievedChunk]) -> dict | None:
        """Check whether top excerpts from different documents contradict each
        other. Returns {"is_conflict": bool, "note": str} or None if not
        applicable (single document) or the check fails."""
        return None
