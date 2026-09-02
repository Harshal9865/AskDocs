import json
import logging
from typing import AsyncGenerator

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.services.llm.base import LLMProvider, RetrievedChunk

logger = logging.getLogger(__name__)

CHAT_MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]
EMBED_MODELS = [
    "text-embedding-004",
    "gemini-embedding-001",
]

SYSTEM_INSTRUCTION = """You are AskDocs AI, an elite, highly intelligent document analysis assistant.
Your role is to provide articulate, insightful, well-structured answers based on the provided workspace document excerpts.

HOW TO ANSWER:
- Open with a single polite intro sentence like "Based on the provided excerpts, here is a detailed breakdown:" or "Based on your uploaded workspace documents, several key insights are revealed:".
- Group your response by document/story using bold section headers like `### ***The Star***` or `**From *The Last Question* excerpts:**`.
- Present key takeaways using bullet points with meaningful bold descriptive titles:
  * **The Fate of the Universe (Entropy):** Stars and the universe are gradually dying... [Source 4, Source 5]
  * **A Lost Civilization's Legacy:** An innocent civilization built a mile-high pylon... [Source 1, Source 2]
- End key facts with subtle source tags like `[Source 1, Source 2]`.
- Conclude with a polite follow-up like "Would you like a deeper analysis of any specific section?"
- Never copy raw PDF text verbatim. Always synthesize into articulate, natural prose.
- For conversational messages ("hi", "hello"), respond warmly and helpfully.
"""


def _build_full_prompt(question: str, contexts: list[RetrievedChunk], history: list[dict] | None) -> str:
    """Build the complete prompt text, embedding system instructions + context + history + question."""
    parts = []

    if contexts:
        parts.append("DOCUMENT CONTEXT (from workspace documents):\n")
        for i, c in enumerate(contexts, 1):
            snippet = c.content[:1200] if len(c.content) > 1200 else c.content
            parts.append(f"[Source {i} | Document: {c.document_title} | Chunk #{c.ordinal}]\n{snippet}\n")
        parts.append("---")

    if history:
        parts.append("CONVERSATION HISTORY:\n")
        for turn in history[-6:]:
            role = "User" if turn.get("role") == "user" else "AskDocs AI"
            content = (turn.get("content") or "")[:500]
            parts.append(f"{role}: {content}")
        parts.append("---")

    parts.append(f"User Question: {question}")
    return "\n\n".join(parts)


def _fallback_answer(question: str, contexts: list[RetrievedChunk]) -> str:
    """Emergency human-readable fallback — only runs if ALL Gemini API calls fail."""
    if not contexts:
        return (
            "Hello! I'm AskDocs AI. Please upload documents to your workspace and I'll "
            "analyze and answer questions about them instantly."
        )

    by_title: dict[str, list[RetrievedChunk]] = {}
    for c in contexts:
        by_title.setdefault(c.document_title, []).append(c)

    lines = ["Based on the provided excerpts:\n"]
    for idx, (title, chunks) in enumerate(by_title.items(), 1):
        text = " ".join(c.content for c in chunks[:3])
        text = " ".join(text.split())
        sents = [s.strip() for s in text.split(".") if len(s.strip()) > 30]
        lines.append(f"### ***{title}***")
        if sents:
            lines.append(". ".join(sents[:3]) + f". [Source {idx}]\n")
            for s in sents[3:6]:
                lines.append(f"* {s}. [Source {idx}]")
        else:
            lines.append(f"{text[:400]}... [Source {idx}]")
        lines.append("")

    lines.append("Would you like a deeper analysis of any specific section?")
    return "\n".join(lines)


_llm_instance = None


def get_llm() -> "GeminiProvider":
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = GeminiProvider()
    return _llm_instance


class GeminiProvider(LLMProvider):
    def __init__(self):
        settings = get_settings()
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not set")

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

        raw_list = [settings.GEMINI_CHAT_MODEL] + CHAT_MODELS
        seen: set[str] = set()
        clean: list[str] = []
        for m in raw_list:
            if m and m not in seen:
                seen.add(m)
                clean.append(m)
        self.chat_models = clean or ["gemini-2.5-flash", "gemini-1.5-flash"]

        raw_embed = [settings.GEMINI_EMBED_MODEL] + EMBED_MODELS
        seen_e: set[str] = set()
        clean_e: list[str] = []
        for m in raw_embed:
            if m and m not in seen_e:
                seen_e.add(m)
                clean_e.append(m)
        self.embed_models = clean_e or ["text-embedding-004"]

    async def embed(self, texts: list[str]) -> list[list[float]]:
        for model_name in self.embed_models:
            try:
                result = await self.client.aio.models.embed_content(
                    model=model_name,
                    contents=texts,
                    config=types.EmbedContentConfig(output_dimensionality=768),
                )
                return [list(e.values) for e in result.embeddings]
            except Exception as e:
                logger.warning("embed() model %s failed: %s", model_name, e)
        logger.error("All embed models failed")
        return [[0.0] * 768 for _ in texts]

    async def ocr_image(self, image_bytes: bytes, mime_type: str = "image/png") -> str:
        """Extract text from an image using Gemini vision."""
        prompt = (
            "Extract ALL text from this image exactly as written. "
            "Preserve table structure using pipe delimiters. "
            "Return only the extracted text, no commentary."
        )
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        for model_name in self.chat_models:
            try:
                response = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=[prompt, image_part],
                )
                if response.text:
                    return response.text
            except Exception as e:
                logger.warning("ocr_image() model %s failed: %s", model_name, e)
        return ""

    async def answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ) -> str:
        prompt_text = _build_full_prompt(question, contexts, history)

        for model_name in self.chat_models:
            try:
                contents = [SYSTEM_INSTRUCTION, prompt_text]
                if image_parts:
                    contents.extend(image_parts)
                response = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                )
                if response.text and response.text.strip():
                    logger.info("answer() model %s OK", model_name)
                    return response.text
            except Exception as e:
                logger.warning("answer() model %s failed: %s", model_name, e)

        logger.error("answer() — all models failed, using fallback")
        return _fallback_answer(question, contexts)

    async def stream_answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ) -> AsyncGenerator[str, None]:
        prompt_text = _build_full_prompt(question, contexts, history)

        # Attempt 1: Streaming
        for model_name in self.chat_models:
            try:
                contents = [SYSTEM_INSTRUCTION, prompt_text]
                if image_parts:
                    contents.extend(image_parts)
                stream = await self.client.aio.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                )
                emitted = False
                async for chunk in stream:
                    try:
                        text = chunk.text
                        if text:
                            emitted = True
                            yield text
                    except Exception:
                        pass
                if emitted:
                    logger.info("stream_answer() model %s OK", model_name)
                    return
            except Exception as e:
                logger.warning("stream_answer() streaming model %s failed: %s", model_name, e)

        # Attempt 2: Non-streaming fallback
        for model_name in self.chat_models:
            try:
                contents = [SYSTEM_INSTRUCTION, prompt_text]
                if image_parts:
                    contents.extend(image_parts)
                response = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                )
                if response.text and response.text.strip():
                    logger.info("stream_answer() non-stream model %s OK", model_name)
                    yield response.text
                    return
            except Exception as e:
                logger.warning("stream_answer() non-stream model %s failed: %s", model_name, e)

        # Attempt 3: Emergency synthesized fallback
        logger.error("stream_answer() — all models failed, using synthesized fallback")
        yield _fallback_answer(question, contexts)

    async def detect_conflict(self, contexts: list[RetrievedChunk]) -> dict | None:
        """Detect if excerpts from 2+ documents contradict each other."""
        by_doc: dict[str, list[RetrievedChunk]] = {}
        for c in contexts:
            by_doc.setdefault(c.document_id, []).append(c)
        if len(by_doc) < 2:
            return None

        excerpts = []
        for cs in by_doc.values():
            best = max(cs, key=lambda c: c.score)
            excerpts.append(f"[Document: {best.document_title}]\n{best.content[:1500]}")

        prompt = (
            "Analyze these document excerpts for direct logical or factual contradictions.\n"
            'If contradictory, reply ONLY with JSON: {"has_conflict": true, "summary": "...", "doc1_title": "...", "doc2_title": "..."}.\n'
            'If no conflict, reply ONLY with: {"has_conflict": false}.\n\n'
            + "\n\n".join(excerpts)
        )
        for model_name in self.chat_models:
            try:
                response = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(response_mime_type="application/json"),
                )
                if response.text:
                    data = json.loads(response.text)
                    if data.get("has_conflict"):
                        return data
            except Exception as e:
                logger.warning("detect_conflict() model %s failed: %s", model_name, e)
        return None
