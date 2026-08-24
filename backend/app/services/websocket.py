"""WebSocket support for real-time communication."""

import logging
import uuid
from typing import Dict, Optional, Set

import jwt as pyjwt
from fastapi import (
    Depends,
    FastAPI,
    Path,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import AsyncSessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time communication."""

    def __init__(self):
        self.workspace_connections: Dict[uuid.UUID, Dict[uuid.UUID, Set[WebSocket]]] = {}
        self.connection_meta: Dict[WebSocket, dict] = {}

    async def connect(
        self,
        websocket: WebSocket,
        user_id: uuid.UUID,
        workspace_id: Optional[uuid.UUID] = None,
    ):
        await websocket.accept()
        self.connection_meta[websocket] = {
            "user_id": user_id,
            "workspace_id": workspace_id,
        }
        if workspace_id:
            if workspace_id not in self.workspace_connections:
                self.workspace_connections[workspace_id] = {}
            if user_id not in self.workspace_connections[workspace_id]:
                self.workspace_connections[workspace_id][user_id] = set()
            self.workspace_connections[workspace_id][user_id].add(websocket)
        logger.info(f"User {user_id} connected to workspace {workspace_id}")

    def disconnect(self, websocket: WebSocket):
        meta = self.connection_meta.pop(websocket, None)
        if not meta:
            return
        user_id = meta["user_id"]
        workspace_id = meta.get("workspace_id")
        if workspace_id and workspace_id in self.workspace_connections:
            conns = self.workspace_connections[workspace_id].get(user_id)
            if conns:
                conns.discard(websocket)
                if not conns:
                    del self.workspace_connections[workspace_id][user_id]
            if not self.workspace_connections[workspace_id]:
                del self.workspace_connections[workspace_id]
        logger.info(f"User {user_id} disconnected")

    async def broadcast_to_workspace(
        self,
        workspace_id: uuid.UUID,
        message: dict,
        exclude_user: Optional[uuid.UUID] = None,
    ):
        if workspace_id not in self.workspace_connections:
            return
        for uid, connections in self.workspace_connections[workspace_id].items():
            if exclude_user and uid == exclude_user:
                continue
            for ws in list(connections):
                try:
                    await ws.send_json(message)
                except Exception:
                    pass


manager = ConnectionManager()


async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(...),
) -> User:
    settings = get_settings()
    try:
        payload = pyjwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = uuid.UUID(payload.get("sub"))
    except (pyjwt.PyJWTError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        raise
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
            raise
        return user


async def handle_typing(websocket: WebSocket, data: dict, user: User):
    payload = data.get("payload", {})
    workspace_id = payload.get("workspace_id")
    conversation_id = payload.get("conversation_id")
    if not workspace_id or not conversation_id:
        return
    try:
        ws_id = uuid.UUID(workspace_id)
    except ValueError:
        return
    await manager.broadcast_to_workspace(
        ws_id,
        {
            "type": "typing",
            "payload": {
                "user_id": str(user.id),
                "user_name": user.name,
                "conversation_id": conversation_id,
            },
        },
        exclude_user=user.id,
    )


async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    workspace_id: uuid.UUID = Path(...),
):
    user = await get_current_user_ws(websocket, token)
    await manager.connect(websocket, user.id, workspace_id)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif msg_type == "typing":
                await handle_typing(websocket, data, user)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# FastAPI app for WebSocket server
ws_app = FastAPI(title="AskDocs WebSocket Server")

ws_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ws_app.websocket("/ws/{workspace_id}")(websocket_endpoint)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(ws_app, host="0.0.0.0", port=8001)
