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
    async def answer(self, question: str, contexts: list[RetrievedChunk], history: list[dict] | None = None) -> str:
        """Answer a question grounded in the given context chunks."""

    @abstractmethod
    async def stream_answer(self, question: str, contexts: list[RetrievedChunk], history: list[dict] | None = None):
        """Yield answer tokens one by one."""
