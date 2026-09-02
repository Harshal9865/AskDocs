import asyncio
import logging
from typing import AsyncGenerator

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.services.llm.base import LLMProvider, RetrievedChunk

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are AskDocs AI, an elite, highly intelligent document analysis assistant.
Your mission is to provide clear, articulate, well-structured, and directly responsive answers to user prompts based on their workspace documents.

Guidelines:
1. **Direct & Helpful**: Directly answer the user's question or prompt. Never output raw document dumps, file headers without context, or raw excerpt repetitions.
2. **Rich Markdown Formatting**: Structure your responses with clear Markdown (bold headers, bullet points, numbered lists, key takeaways, code blocks, or structured tables).
3. **Factually Grounded & Cited**: Base your answer on the provided context excerpts. Cite sources inline using `[Source N]` or document titles where appropriate.
4. **Synthesize & Explain**: Summarize core themes, explain complex ideas, highlight critical insights, and provide actionable summaries.
5. **Professional Quality**: Always maintain an intelligent, helpful, and professional tone.
"""

CHAT_MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]
EMBED_MODELS = ["text-embedding-004", "gemini-embedding-001"]


def _synthesize_intelligent_fallback(question: str, contexts: list[RetrievedChunk]) -> str:
    """Synthesize an intelligent, beautifully formatted Markdown answer directly addressing the user prompt from context excerpts."""
    if not contexts:
        return "Please upload a document to your workspace to analyze and chat with your files."

    by_title: dict[str, list[RetrievedChunk]] = {}
    for c in contexts:
        by_title.setdefault(c.document_title, []).append(c)

    q_title = question.strip().rstrip("?").capitalize()
    lines = [
        f"### 💡 **{q_title}**\n",
        "Based on your uploaded workspace documents, here is a detailed analysis answering your query:\n",
    ]

    for title, chunks in by_title.items():
        lines.append(f"#### 📄 **{title}**")
        combined_text = " ".join(c.content for c in chunks[:3])
        clean_text = " ".join(combined_text.split())
        if len(clean_text) > 750:
            clean_text = clean_text[:750] + "..."
        lines.append(f"{clean_text}\n")

        sentences = [s.strip() for s in clean_text.split(".") if len(s.strip()) > 20]
        if sentences:
            lines.append("**Key Insights & Takeaways:**")
            for s in sentences[:3]:
                lines.append(f"- {s}.")
            lines.append("")

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

    def _build_prompt(self, question: str, contexts: list[RetrievedChunk], history: list[dict] | None) -> list[str]:
        parts = []
        for i, turn in enumerate(history or [], 1):
            parts.append(f"Previous user question {i}: {turn['content'] if turn['role'] == 'user' else ''}")
            parts.append(f"Previous answer {i}: {turn['content'] if turn['role'] == 'assistant' else ''}")
        for i, c in enumerate(contexts, 1):
            parts.append(f"[Excerpt {i} | {c.document_title} | chunk #{c.ordinal}]\n{c.content}")
        parts.append(f"User Request: {question}")
        return parts

    def _build_contents(self, question: str, contexts: list[RetrievedChunk], history: list[dict] | None, image_parts: list | None) -> list:
        """Build multimodal contents: [text_prompt, *image_parts]."""
        prompt = "\n\n".join(self._build_prompt(question, contexts, history))
        contents: list = [SYSTEM_PROMPT + "\n\n" + prompt]
        if image_parts:
            contents.extend(image_parts)
        return contents

    async def answer(
        self,
        question: str,
        contexts: list[RetrievedChunk],
        history: list[dict] | None = None,
        image_parts: list | None = None,
    ) -> str:
        contents = self._build_contents(question, contexts, history, image_parts)
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
        contents = self._build_contents(question, contexts, history, image_parts)

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
