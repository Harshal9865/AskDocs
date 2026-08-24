import asyncio
import sys
from contextlib import asynccontextmanager

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.services.websocket import ws_app

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.services.slack_bot import start_slack_bot
    await start_slack_bot()
    yield
    # shutdown - cleanup if needed

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

allow_all = "*" in settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else settings.CORS_ORIGINS,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
# Mount WebSocket app
app.mount("/ws", ws_app)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    """Return CORS-headed JSON on unhandled errors instead of a bare 500,
    so the browser surfaces the real status code rather than a CORS error."""
    import logging
    import traceback

    logging.error("Unhandled error on %s: %s\n%s", request.url.path, exc, traceback.format_exc())
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": "*"},
    )


@app.get("/health")
def health():
    return {"status": "ok"}

