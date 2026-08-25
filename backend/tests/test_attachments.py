"""Tests for smart chat attachment uploads (pdf/txt extraction, video, rejection)."""

import io
import random
import string

from pypdf import PdfWriter


def _email() -> str:
    return "att_" + "".join(random.choices(string.ascii_lowercase, k=10)) + "@test.dev"


async def _register_and_login(client) -> dict:
    email = _email()
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "secret123", "name": "Att User"},
    )
    resp = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "secret123"}
    )
    tokens = resp.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def _upload(client, headers: dict, filename: str, content_type: str, data: bytes):
    return await client.post(
        "/api/v1/team-chats/upload",
        headers=headers,
        files={"file": (filename, io.BytesIO(data), content_type)},
    )


async def test_upload_pdf_extracts_text(client):
    headers = await _register_and_login(client)

    # Build a tiny real PDF in-memory
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    resp = await _upload(client, headers, "notes.pdf", "application/pdf", pdf_bytes)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["filename"] == "notes.pdf"
    assert body["content_type"] == "application/pdf"
    assert "id" in body
    # text_excerpt present (may be empty string for a blank page, but key exists)
    assert "text_excerpt" in body


async def test_upload_txt_extracts_text(client):
    headers = await _register_and_login(client)
    resp = await _upload(
        client, headers, "notes.txt", "text/plain", b"The leave policy allows 24 days."
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert "24 days" in (body.get("text_excerpt") or "")


async def test_upload_video_allowed(client):
    headers = await _register_and_login(client)
    resp = await _upload(
        client, headers, "clip.mp4", "video/mp4", b"\x00\x00\x00\x18ftypmp42"
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["content_type"] == "video/mp4"


async def test_upload_rejects_exe(client):
    headers = await _register_and_login(client)
    resp = await _upload(
        client, headers, "malware.exe", "application/x-msdownload", b"MZ..."
    )
    assert resp.status_code == 400


async def test_upload_rejects_oversized_video(client):
    headers = await _register_and_login(client)
    big = b"\x00" * (51 * 1024 * 1024)  # 51 MB > 50 MB video cap
    resp = await _upload(client, headers, "big.mp4", "video/mp4", big)
    assert resp.status_code == 413
