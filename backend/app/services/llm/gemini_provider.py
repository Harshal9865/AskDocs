import asyncio
import logging
from typing import AsyncGenerator

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.services.llm.base import LLMProvider, RetrievedChunk

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are AskDocs AI, an elite, highly intelligent document analysis assistant and workspace teammate.
Your mission is to provide articulate, beautifully formatted, insightful, and directly responsive answers based on the provided workspace document excerpts.

STRICT ANSWER FORMATTING INSTRUCTIONS:
1. **Direct Synthesized Intro**: Always open with a polite, direct 1-sentence intro (e.g., "Based on the provided excerpts, here is a detailed breakdown answering your query:" or "Based on your uploaded workspace documents, several key insights are revealed across the texts:").
2. **Grouped by Document / Story**: When analyzing multiple documents or stories, group your response cleanly under bold section headers (e.g. `### ***The Star***` or `**From *The Last Question* excerpts:**`).
3. **Rich Concept Bullet Points with Bold Titles**: Present key takeaways, plot developments, or character insights using structured bullet points with meaningful bold descriptive titles (e.g. `* **A Lost Civilization's Legacy:** Explanation... [Source 1, Source 2]` or `* **The Fate of the Universe (Entropy):** Explanation... [Source 4, Source 5]`).
4. **Subtle Source Citations**: End key facts with subtle source tags like `[Source 1, Source 2]` or `[Source: DocumentName.pdf]`.
5. **Polite Follow-up Offer**: Conclude with a helpful, engaging question (e.g., "Would you like a summary of the next section or a deeper analysis of any specific story?").
6. **No Mechanical Word Cutting**: Write natural, fluent, intelligent prose. Do NOT slice raw sentences into artificial titles.
"""

CHAT_MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]
EMBED_MODELS = ["text-embedding-004", "gemini-embedding-001"]


def _synthesize_intelligent_fallback(question: str, contexts: list[RetrievedChunk]) -> str:
    """Synthesize a clean, natural fallback answer directly from document context without mechanical word slicing."""
    if not contexts:
        return "Hello! I am AskDocs AI. How can I assist you with your workspace documents today?"

    by_title: dict[str, list[RetrievedChunk]] = {}
    for c in contexts:
        by_title.setdefault(c.document_title, []).append(c)

    lines = [
        "Based on the provided excerpts, here is a detailed summary of the texts:\n",
    ]

    doc_idx = 1
    for title, chunks in by_title.items():
        combined_text = " ".join(c.content for c in chunks[:4])
        clean_text = " ".join(combined_text.split())

        sentences = [s.strip() for s in clean_text.split(".") if len(s.strip()) > 25]

        lines.append(f"### ***{title}***")

        if sentences:
            intro_p = ". ".join(sentences[:2]) + f". [Source {doc_idx}]"
            lines.append(f"{intro_p}\n")

            if len(sentences) > 2:
                for s in sentences[2:6]:
                    lines.append(f"* {s}. [Source {doc_idx}]")
                lines.append("")
        else:
            lines.append(f"{clean_text[:400]}... [Source {doc_idx}]\n")

        doc_idx += 1

    lines.append("Would you like a summary of the next section or a deeper analysis of any specific story?")
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
        self.settings = settings

        raw_list = [settings.GEMINI_CHAT_MODEL] + CHAT_MODELS
        seen = set()
        clean = []
        for m in raw_list:
            if m and m not in seen:
                seen.add(m)
                clean.append(m)
        self.chat_models = clean or ["gemini-2.5-flash", "gemini-1.5-flash"]

        self.embed_models = [settings.GEMINI_EMBED_MODEL] + [
            m for m in EMBED_MODELS if m != settings.GEMINI_EMBED_MODEL
        ]

    async def embed(self, texts: list[str]) -> list[list[float]]:
        last_err = None
        for model_name in self.embed_models:
            try:
                result = await self.client.aio.models.embed_content(
                    model=model_name,
                    contents=texts,
                    config=types.EmbedContentConfig(output_dimensionality=768),
                )
                return [list(e.values) for e in result.embeddings]
            except Exception as e:
                logger.warning("Embed model %s failed: %s; trying next fallback", model_name, e)
                last_err = e
        logger.error("All embed models failed: %s", last_err)
        return [[0.0] * 768 for _ in texts]

    async def ocr_image(self, image_bytes: bytes, mime_type: str = "image/png") -> str:
        """Extract text from an image using Gemini vision."""
        prompt = (
            "Extract ALL text from this image. "
            "If the image contains handwritten notes, transcribe them exactly as written. "
            "If there are tables, preserve their structure using pipe delimiters. "
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
                logger.warning("OCR with %s failed: %s", model_name, e)
        return ""

    def _build_contents(self, question: str, contexts: list[RetrievedChunk], history: list[dict] | None) -> list:
        parts = [SYSTEM_PROMPT, "\n\n"]

        if contexts:
            parts.append("WORKSPACE DOCUMENT CONTEXT EXCERPTS:")
            for i, c in enumerate(contexts, 1):
                parts.append(f"--- Document: {c.document_title} (Chunk #{c.ordinal}) ---\n{c.content}")
            parts.append(
                "\nINSTRUCTIONS: Follow the strict answer formatting guidelines. "
                "Open with a direct 1-sentence intro ('Based on the provided excerpts, here is a detailed breakdown answering your query:'). "
                "Group findings by Document/Story (`### ***Title***` or `**From *Title* Excerpts:**`). "
                "Use bullet points with meaningful bold descriptive titles (`* **Concept Title:** Description... [Source 1, Source 2]`). "
                "End with a polite follow-up question."
            )
        else:
            parts.append("INSTRUCTIONS: Respond conversationally, articulately, and helpfully to the user's message.")

        if history:
            parts.append("\nCONVERSATION HISTORY:")
            for turn in history[-6:]:
                role_label = "User" if turn.get("role") == "user" else "Assistant"
                parts.append(f"{role_label}: {turn.get('content', '')}")

        parts.append(f"\nUser Question: {question}")
        full_text = "\n\n".join(parts)
        return [full_text]

    async def answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ) -> str:
        contents = self._build_contents(question, contexts, history)
        if image_parts:
            contents.extend(image_parts)

        for model_name in self.chat_models:
            try:
                response = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                )
                if response.text and response.text.strip():
                    return response.text
            except Exception as e:
                logger.warning("Answer generation with %s failed: %s", model_name, e)

        return _synthesize_intelligent_fallback(question, contexts)

    async def stream_answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ) -> AsyncGenerator[str, None]:
        contents = self._build_contents(question, contexts, history)
        if image_parts:
            contents.extend(image_parts)

        # Attempt 1: Stream generation across models
        for model_name in self.chat_models:
            try:
                response_stream = await self.client.aio.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                )
                emitted = False
                async for chunk in response_stream:
                    chunk_text = ""
                    try:
                        if hasattr(chunk, "text") and chunk.text:
                            chunk_text = chunk.text
                        elif hasattr(chunk, "candidates") and chunk.candidates:
                            parts = chunk.candidates[0].content.parts
                            chunk_text = "".join(p.text for p in parts if hasattr(p, "text") and p.text)
                    except Exception:
                        pass

                    if chunk_text:
                        emitted = True
                        yield chunk_text

                if emitted:
                    return
            except Exception as e:
                logger.warning("Stream with model %s failed: %s", model_name, e)

        # Attempt 2: Non-streaming generate_content across models
        for model_name in self.chat_models:
            try:
                res = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                )
                if res and res.text and res.text.strip():
                    yield res.text
                    return
            except Exception as e:
                logger.warning("Non-stream fallback with model %s failed: %s", model_name, e)

        # Fallback 3: Synthesize intelligent Markdown answer from context excerpts
        yield _synthesize_intelligent_fallback(question, contexts)

    async def detect_conflict(self, contexts: list[RetrievedChunk]) -> dict | None:
        """Ask Gemini whether the best excerpts from different documents
        contradict each other. Only runs when 2+ documents are involved."""
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
            "If they contradict each other, reply with JSON: "
            '{"has_conflict": true, "summary": "...", "doc1_title": "...", "doc2_title": "..."}.\n'
            'If there is NO conflict, reply with: {"has_conflict": false}.\n\n'
            + "\n\n".join(excerpts)
        )
        for model_name in self.chat_models:
            try:
                res = await self.client.aio.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(response_mime_type="application/json"),
                )
                if res.text:
                    import json

                    data = json.loads(res.text)
                    if data.get("has_conflict"):
                        return data
            except Exception as e:
                logger.warning("Conflict detection with %s failed: %s", model_name, e)
        return None
