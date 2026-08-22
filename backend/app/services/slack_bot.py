"""Slack bot: /askdocs slash command + @mentions -> cited answers.

Uses Slack Socket Mode (no public webhook URL needed), so it works behind
Render. Binds to ONE AskDocs workspace via the SLACK_WORKSPACE_ID env var;
any Slack user in the installed workspace can ask, but answers only draw from
that workspace's documents.

Required env vars (set in Render dashboard):
  SLACK_BOT_TOKEN       xoxb-...  (Bot User OAuth Token, scopes: app_mentions:read,
                                  chat:write, commands)
  SLACK_APP_TOKEN       xapp-...  (App-Level Token for Socket Mode, scope: connections:write)
  SLACK_SIGNING_SECRET  (from Basic Information)
  SLACK_WORKSPACE_ID    AskDocs workspace UUID whose documents should be searched

The bot starts automatically with the FastAPI app when SLACK_BOT_TOKEN and
SLACK_APP_TOKEN are present.
"""

import uuid

from app.core.deps import AsyncSessionLocal
from app.services.llm.gemini_provider import get_llm
from app.services.retrieval import conversation_history, search_chunks


def _slack_available() -> bool:
    import os

    return bool(os.environ.get("SLACK_BOT_TOKEN") and os.environ.get("SLACK_APP_TOKEN"))


async def answer_for_slack(question: str) -> list[dict]:
    """Run the RAG pipeline against the configured workspace.

    Returns a list of Block Kit blocks for chat.postMessage.
    """
    import os

    from app.api.v1.chat import REFUSAL  # noqa: F401    
    workspace_id = uuid.UUID(os.environ["SLACK_WORKSPACE_ID"])
    llm = get_llm()

    embedding = (await llm.embed([question]))[0]
    async with AsyncSessionLocal() as db:
        chunks = await search_chunks(db, workspace_id, embedding)

        if not chunks:
            return [
                {"type": "section", "text": {"type": "mrkdwn", "text": f"â“ *{question}*"}},
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": ":shrug: I couldn't find an answer to this in the uploaded documents.",
                    },
                },
            ]

        history = await conversation_history(db, None) if False else []
        answer = await llm.answer(question, chunks, [])
        citations = [
            f"â€¢ _{c.document_title}_ (chunk #{c.ordinal})"
            for c in chunks[:3]
        ]

    blocks = [
        {"type": "section", "text": {"type": "mrkdwn", "text": f"â“ *{question}*"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": answer[:2900]}},
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": "*Sources:*\n" + "\n".join(citations)},
        },
    ]
    return blocks


def create_slack_app():
    """Build the Slack Bolt app. Returns None when not configured."""
    if not _slack_available():
        return None

    from slack_bolt.async_app import AsyncApp

    import os

    app = AsyncApp(token=os.environ["SLACK_BOT_TOKEN"])

    @app.command("/askdocs")
    async def askdocs_command(ack, respond, command):
        await ack()
        question = (command.get("text") or "").strip()
        if not question:
            await respond("Usage: `/askdocs your question here`")
            return
        await respond(f"ðŸ”Ž Searching documents for: _{question}_")
        blocks = await answer_for_slack(question)
        await respond(blocks=blocks)

    @app.event("app_mention")
    async def on_mention(event, say):
        text = event.get("text", "")
        # strip the <@BOTID> mention prefix
        question = text.split(">", 1)[-1].strip()
        if not question:
            await say("Ask me anything about the team's documents!")
            return
        blocks = await answer_for_slack(question)
        await say(blocks=blocks)

    return app


async def start_slack_bot():
    """Start Socket Mode in the background; safe to call always."""
    if not _slack_available():
        return
    try:
        import os

        from slack_bolt.adapter.socket_mode.aiohttp import AsyncSocketModeHandler

        app = create_slack_app()
        if app is None:
            return
        handler = AsyncSocketModeHandler(app, os.environ["SLACK_APP_TOKEN"])
        await handler.connect_async()
        print("Slack bot connected via Socket Mode")
    except Exception as exc:  # noqa: BLE001 - never block app startup over Slack
        print(f"Slack bot failed to start: {exc}")

