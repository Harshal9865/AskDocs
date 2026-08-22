"""End-to-end smoke test: register -> workspace -> upload -> ingest -> ask."""
import asyncio
import io
import random
import string
import sys
import time

from docx import Document as DocxDocument

sys.path.insert(0, ".")

import httpx  # noqa: E402

BASE = "http://localhost:8000/api/v1"

PRICING_DOC = """# Pricing Change Decision - Internal Memo

## Final decision (approved by leadership, March 2026)
The Pro plan price changes from $29/month to $39/month, effective June 1st 2026.
Existing customers keep their current price for 12 months (grandfathering period).

## Rationale
Churn analysis showed price sensitivity concentrated in the Starter tier, not Pro.
Competitor benchmarking placed our Pro tier 20% below market median.

## Action items
- Billing team: implement grandfathering flag by April 15.
- Marketing: update all landing pages by May 15.
"""

MEETING_DOC = """# Weekly Sync Notes - Platform Team

Attendees: Sarah, Miguel, Priya.

Sarah announced the pricing change was approved: Pro goes to $39/month in June.
Miguel raised concerns about the API rate limits; new limits land in Q3.
Priya will own the customer email campaign announcing the change.
"""


def make_docx(text: str) -> bytes:
    buf = io.BytesIO()
    doc = DocxDocument()
    for para in text.split("\n"):
        if para.strip():
            doc.add_paragraph(para)
    doc.save(buf)
    return buf.getvalue()


async def main():
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    email = f"e2e_{suffix}@askdocs.dev"

    async with httpx.AsyncClient(timeout=120) as c:
        # auth
        r = await c.post(f"{BASE}/auth/register", json={"email": email, "password": "secret123", "name": "E2E Bot"})
        assert r.status_code == 201, r.text
        r = await c.post(f"{BASE}/auth/login", data={"username": email, "password": "secret123"})
        tok = r.json()["access_token"]
        h = {"Authorization": f"Bearer {tok}"}
        print("[1/5] auth ok")

        # workspace
        r = await c.post(f"{BASE}/workspaces", json={"name": f"E2E {suffix}"}, headers=h)
        ws_id = r.json()["id"]
        print("[2/5] workspace created")

        # upload md + docx
        r = await c.post(
            f"{BASE}/workspaces/{ws_id}/documents",
            files={"file": ("pricing-memo.md", PRICING_DOC.encode(), "text/markdown")},
            headers=h,
        )
        assert r.status_code == 201, r.text
        d1 = r.json()["id"]

        r = await c.post(
            f"{BASE}/workspaces/{ws_id}/documents",
            files={"file": ("meeting-notes.docx", make_docx(MEETING_DOC), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            headers=h,
        )
        assert r.status_code == 201, r.text
        d2 = r.json()["id"]
        print("[3/5] uploaded pricing-memo.md + meeting-notes.docx")

        # poll until ready
        deadline = time.time() + 180
        statuses = {}
        while time.time() < deadline:
            statuses = {}
            for did in (d1, d2):
                r = await c.get(f"{BASE}/workspaces/{ws_id}/documents/{did}", headers=h)
                statuses[did] = r.json()
            if all(s["status"] == "ready" for s in statuses.values()):
                break
            if any(s["status"] == "failed" for s in statuses.values()):
                failed = [s for s in statuses.values() if s["status"] == "failed"]
                raise SystemExit(f"INGESTION FAILED: {failed}")
            await asyncio.sleep(3)
        else:
            raise SystemExit(f"TIMEOUT waiting for ingestion: {statuses}")
        print(f"[4/5] ingestion ready ({sum(1 for s in statuses.values())} docs)")

        # ask question
        conv = await c.post(f"{BASE}/workspaces/{ws_id}/conversations", json={}, headers=h)
        assert conv.status_code == 201, conv.text
        conv_id = conv.json()["id"]

        q = "What was decided about the pricing change?"
        r = await c.post(f"{BASE}/conversations/{conv_id}/ask", json={"content": q}, headers=h)
        assert r.status_code == 200, r.text
        answer = r.json()
        print("\n=== QUESTION ===")
        print(q)
        print("\n=== ANSWER ===")
        print(answer["content"])
        print("\n=== CITATIONS ===")
        for cit in answer["citations"]:
            print(f"- {cit['document_title']} (chunk #{cit['chunk_ordinal']}): {cit['snippet'][:80]}...")
        assert len(answer["citations"]) > 0, "No citations returned!"
        assert "$39" in answer["content"], "Answer missing the key fact!"
        print("\n[E2E PASS]")


asyncio.run(main())
