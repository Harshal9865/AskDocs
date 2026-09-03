"""
Gemini AI provider — uses google-genai >= 1.0 SDK.
This is the single source of truth for all LLM calls in AskDocs.
"""

import asyncio
import json
import logging
from typing import AsyncGenerator

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.services.llm.base import LLMProvider, RetrievedChunk

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model lists — tried in order, first success wins
# ---------------------------------------------------------------------------
CHAT_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.6-pro",
]
EMBED_MODELS = [
    "text-embedding-004",
    "gemini-embedding-001",
]

# ---------------------------------------------------------------------------
# System instruction — defines AskDocs AI personality & answer format
# ---------------------------------------------------------------------------
SYSTEM_INSTRUCTION = (
    "You are AskDocs AI, an expert document analysis assistant. "
    "You answer questions using the provided document excerpts and synthesize rich, intelligent responses.\n\n"
    "RESPONSE FORMAT RULES:\n"
    "1. Start with ONE polite intro sentence referencing the documents.\n"
    "2. Organize by document with bold headers: ### ***Document Name***\n"
    "3. Write rich, narrative bullet points with bold descriptive titles:\n"
    "   * **The Central Theme:** <your synthesis and analysis here>. [Source 1, Source 2]\n"
    "4. NEVER slice raw PDF sentences into fake titles. Always write NATURAL prose.\n"
    "5. Add source citations after each fact: [Source 1] or [Source 1, Source 3]\n"
    "6. End with an engaging follow-up offer.\n"
    "7. For story questions — narrate the plot, characters, themes. Be like a smart book reviewer.\n"
    "8. For factual questions — be precise, structured, cite everything.\n"
    "9. For greetings — respond warmly without needing documents.\n"
    "10. You have access to FULL document excerpts below. Use them to give COMPLETE answers."
)


# ---------------------------------------------------------------------------
# Prompt builder — context + history + question, all in one string
# ---------------------------------------------------------------------------
def _build_prompt(question: str, contexts: list[RetrievedChunk], history: list[dict] | None) -> str:
    lines = []

    if contexts:
        lines.append("=== DOCUMENT EXCERPTS FROM WORKSPACE ===")
        for i, c in enumerate(contexts, 1):
            snippet = c.content if len(c.content) <= 1500 else c.content[:1500]
            lines.append(f"\n[Source {i}] Document: \"{c.document_title}\" | Section #{c.ordinal}")
            lines.append(snippet)
        lines.append("\n=== END OF DOCUMENT EXCERPTS ===\n")

    if history:
        lines.append("=== RECENT CONVERSATION ===")
        for turn in history[-8:]:
            role_label = "User" if turn.get("role") == "user" else "AskDocs AI"
            msg = (turn.get("content") or "")[:400]
            lines.append(f"{role_label}: {msg}")
        lines.append("=== END CONVERSATION ===\n")

    lines.append(f"User: {question}")
    lines.append("\nAskDocs AI (provide a thorough, intelligent, well-cited answer):")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Emergency fallback — only used if ALL Gemini API calls fail
# ---------------------------------------------------------------------------
def _emergency_fallback(question: str, contexts: list[RetrievedChunk]) -> str:
    if not contexts:
        return (
            "Hello! I'm AskDocs AI. Upload documents to your workspace and I'll "
            "analyze and answer questions about them with citations."
        )
    by_title: dict[str, list[RetrievedChunk]] = {}
    for c in contexts:
        by_title.setdefault(c.document_title, []).append(c)

    lines = ["Based on the provided documents:\n"]
    for idx, (title, chunks) in enumerate(by_title.items(), 1):
        text = " ".join(c.content for c in chunks[:2])
        text = " ".join(text.split())
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 40]
        lines.append(f"### ***{title}***")
        if sentences:
            summary = ". ".join(sentences[:4]) + f". [Source {idx}]"
            lines.append(summary)
        else:
            lines.append(f"{text[:500]} [Source {idx}]")
        lines.append("")

    lines.append("Would you like a deeper analysis of any specific section?")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_llm_instance: "GeminiProvider | None" = None


def get_llm() -> "GeminiProvider":
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = GeminiProvider()
    return _llm_instance


# ---------------------------------------------------------------------------
# Main provider class
# ---------------------------------------------------------------------------
class GeminiProvider(LLMProvider):
    def __init__(self):
        settings = get_settings()
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("GeminiProvider initialized with API key (len=%d)", len(settings.GEMINI_API_KEY))

        # Build deduplicated model lists, preferred model first
        def _dedup(preferred: str | None, defaults: list[str]) -> list[str]:
            seen: set[str] = set()
            out: list[str] = []
            for m in ([preferred] if preferred else []) + defaults:
                if m and m not in seen:
                    seen.add(m)
                    out.append(m)
            return out or defaults[:1]

        self.chat_models = _dedup(settings.GEMINI_CHAT_MODEL, CHAT_MODELS)
        self.embed_models = _dedup(settings.GEMINI_EMBED_MODEL, EMBED_MODELS)
        logger.info("Chat models: %s | Embed models: %s", self.chat_models, self.embed_models)

    # ------------------------------------------------------------------
    # Embed
    # ------------------------------------------------------------------
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of texts. Returns list of float vectors."""
        for model_name in self.embed_models:
            try:
                # Embed one at a time to avoid batch issues across SDK versions
                vectors = []
                for text in texts:
                    result = await self.client.aio.models.embed_content(
                        model=model_name,
                        contents=text,
                    )
                    # google-genai v1: result.embeddings is a list of ContentEmbedding
                    if hasattr(result, "embeddings") and result.embeddings:
                        vectors.append(list(result.embeddings[0].values))
                    else:
                        raise ValueError(f"Unexpected embed result shape: {result}")
                logger.info("embed() model %s OK for %d texts", model_name, len(texts))
                return vectors
            except Exception as e:
                logger.warning("embed() model %s failed: %s", model_name, e)

        logger.error("All embed models failed — returning zero vectors")
        return [[0.0] * 768 for _ in texts]

    # ------------------------------------------------------------------
    # OCR image
    # ------------------------------------------------------------------
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
                    logger.info("ocr_image() model %s OK", model_name)
                    return response.text
            except Exception as e:
                logger.warning("ocr_image() model %s failed: %s", model_name, e)
        return ""

    # ------------------------------------------------------------------
    # Auto-title generation
    # ------------------------------------------------------------------
    async def generate_title(self, first_message: str) -> str:
        """Generate a short 4-6 word conversation title from the user's first message."""
        prompt = (
            f"Generate a concise 4-6 word title for a conversation that starts with this message. "
            f"Return ONLY the title, no quotes, no punctuation at the end:\n\n{first_message[:300]}"
        )
        for model_name in self.chat_models:
            try:
                response = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                )
                if response.text and response.text.strip():
                    title = response.text.strip().strip('"').strip("'")[:80]
                    logger.info("generate_title() model=%s -> %r", model_name, title)
                    return title
            except Exception as e:
                logger.warning("generate_title() model=%s failed: %s", model_name, e)
        # Fallback: smart truncation of user message
        words = first_message.split()
        return " ".join(words[:6]) if words else "New conversation"


    async def answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ) -> str:
        prompt = _build_prompt(question, contexts, history)
        config = types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION)

        for model_name in self.chat_models:
            for attempt in range(2):
                try:
                    contents: list = [prompt]
                    if image_parts:
                        contents.extend(image_parts)
                    response = await self.client.aio.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config,
                    )
                    if response.text and response.text.strip():
                        logger.info("answer() model=%s SUCCESS (len=%d)", model_name, len(response.text))
                        return response.text
                    logger.warning("answer() model=%s returned empty text", model_name)
                    break
                except Exception as e:
                    err_str = str(e)
                    logger.warning("answer() model=%s attempt=%d FAILED: %s", model_name, attempt + 1, err_str)
                    if ("503" in err_str or "UNAVAILABLE" in err_str or "demand" in err_str) and attempt == 0:
                        await asyncio.sleep(0.6)
                        continue
                    break

        logger.error("answer() — all models failed — using emergency fallback")
        return _emergency_fallback(question, contexts)

    # ------------------------------------------------------------------
    # Streaming answer (SSE)
    # ------------------------------------------------------------------
    async def stream_answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ) -> AsyncGenerator[str, None]:
        prompt = _build_prompt(question, contexts, history)
        config = types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION)

        # ---- Pass 1: streaming ----------------------------------------
        for model_name in self.chat_models:
            for attempt in range(2):
                try:
                    contents: list = [prompt]
                    if image_parts:
                        contents.extend(image_parts)
                    stream = await self.client.aio.models.generate_content_stream(
                        model=model_name,
                        contents=contents,
                        config=config,
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
                        logger.info("stream_answer() model=%s STREAMING OK", model_name)
                        return
                    logger.warning("stream_answer() model=%s streamed but emitted nothing", model_name)
                    break
                except Exception as e:
                    err_str = str(e)
                    logger.warning("stream_answer() streaming model=%s attempt=%d FAILED: %s", model_name, attempt + 1, err_str)
                    if ("503" in err_str or "UNAVAILABLE" in err_str or "demand" in err_str) and attempt == 0:
                        await asyncio.sleep(0.6)
                        continue
                    break

        # ---- Pass 2: non-streaming fallback ---------------------------
        for model_name in self.chat_models:
            try:
                contents = [prompt]
                if image_parts:
                    contents.extend(image_parts)
                response = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                if response.text and response.text.strip():
                    logger.info("stream_answer() model=%s NON-STREAM OK (len=%d)", model_name, len(response.text))
                    yield response.text
                    return
                logger.warning("stream_answer() non-stream model=%s empty", model_name)
            except Exception as e:
                logger.warning("stream_answer() non-stream model=%s FAILED: %s", model_name, e)

        # ---- Pass 3: emergency fallback --------------------------------
        logger.error("stream_answer() — ALL models failed — using emergency fallback")
        yield _emergency_fallback(question, contexts)

    # ------------------------------------------------------------------
    # Conflict detection
    # ------------------------------------------------------------------
    async def detect_conflict(self, contexts: list[RetrievedChunk]) -> dict | None:
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
                logger.warning("detect_conflict() model=%s failed: %s", model_name, e)
        return None
