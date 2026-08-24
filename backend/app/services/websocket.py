"""WebSocket server for real-time communication."""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Set, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query, Path, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.deps import get_db, get_current_user_ws
from app.core.security import ALGORITHM, SECRET_KEY
from app.models.user import User
from app.models.chat import Conversation, Message
from app.models.workspace import WorkspaceMember, Role
from app.core.deps import get_db, get_db_session
from app.core.config import settings
from app.core.deps import get_db_session

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException, status
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time communication."""
    
    def __init__(self):
        # workspace_id -> {user_id: {connection_id: WebSocket}}
        self.workspace_connections: Dict[uuid.UUID, Dict[uuid.UUID, Set[WebSocket]]] = {}
        # user_id -> Set of (workspace_id, WebSocket) for DMs
        self.user_connections: Dict[uuid.UUID, Set[tuple]] = {}
        # connection metadata
        self.connection_meta: Dict[WebSocket, dict] = {}

    async def connect(
        self, 
        websocket: WebSocket, 
        user_id: uuid.UUID, 
        workspace_id: Optional[uuid.UUID] = None,
        connection_id: Optional[uuid.UUID] = None
    ):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        connection_id = connection_id or uuid.uuid4()
        
        # Track connection metadata
        self.connection_meta[websocket] = {
            "user_id": user_id,
            "workspace_id": workspace_id,
            "connection_id": connection_id,
            "connected_at": datetime.utcnow(),
        }
        
        # Track workspace connections
        if workspace_id:
            if workspace_id not in self.workspace_connections:
                self.workspace_connections[workspace_id] = {}
            if user_id not in self.workspace_connections[workspace_id]:
                self.workspace_connections[workspace_id][user_id] = set()
            self.workspace_connections[workspace_id][user_id].add(websocket)
        
        # Track user connections for DMs
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add((workspace_id, websocket))
        
        self.connection_meta[websocket] = {
            "user_id": user_id,
            "workspace_id": workspace_id,
            "connection_id": connection_id,
            "connected_at": datetime.utcnow(),
        }
        
        logger.info(f"User {user_id} connected to workspace {workspace_id}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        meta = self.connection_meta.get(websocket)
        if not meta:
            return
        
        user_id = meta["user_id"]
        workspace_id = meta.get("workspace_id")
        
        # Remove from workspace connections
        if workspace_id and workspace_id in self.workspace_connections:
            if user_id in self.workspace_connections[workspace_id]:
                self.workspace_connections[workspace_id][user_id].discard(websocket)
                if not self.workspace_connections[workspace_id][user_id]:
                    del self.workspace_connections[workspace_id][user_id]
                if not self.workspace_connections[workspace_id]:
                    del self.workspace_connections[workspace_id]
        
        # Remove from user connections
        if user_id in self.user_connections:
            # Find and remove the specific connection
            to_remove = None
            for ws_id, ws in self.user_connections[user_id]:
                if ws == websocket:
                    to_remove = (meta.get("workspace_id"), websocket)
                    break
            if to_remove:
                self.user_connections[user_id].discard(to_remove)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        del self.connection_meta[websocket]
        logger.info(f"User disconnected")

    async def send_personal_message(self, user_id: uuid.UUID, message: dict):
        """Send a message to all of a user's connections."""
        if user_id in self.user_connections:
            for ws_id, ws in self.user_connections.get(user_id, set()):
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send to user {user_id}: {e}")

    async def broadcast_to_workspace(
        self, 
        workspace_id: uuid.UUID, 
        message: dict, 
        exclude_user: Optional[uuid.UUID] = None
    ):
        """Broadcast a message to all users in a workspace."""
        if workspace_id not in self.workspace_connections:
            return
        
        for user_id, connections in self.workspace_connections[workspace_id].items():
            if exclude_user and user_id == exclude_user:
                continue
            for ws in connections:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send to user {user_id}: {e}")

    async def send_to_user_in_workspace(
        self, 
        workspace_id: uuid.UUID, 
        user_id: uuid.UUID, 
        message: dict
    ):
        """Send a message to a specific user in a workspace."""
        if workspace_id in self.workspace_connections:
            if user_id in self.workspace_connections[workspace_id]:
                for ws in self.workspace_connections[workspace_id][user_id]:
                    try:
                        await ws.send_json(message)
                    except Exception as e:
                        logger.error(f"Failed to send to user {user_id}: {e}")


# Global connection manager
manager = ConnectionManager()


async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    """Authenticate WebSocket connection via JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = uuid.UUID(payload.get("sub"))
    except (JWTError, ValueError) as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    async with get_db() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user


async def get_workspace_id_from_query(workspace_id: str = Query(...)) -> uuid.UUID:
    """Extract workspace ID from query parameter."""
    return uuid.UUID(workspace_id)


async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    """Authenticate WebSocket connection via JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = uuid.UUID(payload.get("sub"))
    except (JWTError, ValueError) as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    async with get_db() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user


async def get_workspace_id_from_query(workspace_id: str = Query(...)) -> uuid.UUID:
    """Extract workspace ID from query parameter."""
    return uuid.UUID(workspace_id)


async def handle_websocket_message(websocket: WebSocket, data: dict, user: User, db: AsyncSession):
    """Handle incoming WebSocket messages."""
    message_type = data.get("type")
    payload = data.get("payload", {})
    
    if message_type == "ping":
        await websocket.send_json({"type": "pong"})
        return
    
    elif message_type == "message":
        await handle_new_message(websocket, data, user, db)
    
    elif message_type == "typing":
        await handle_typing(websocket, data, user)
    
    elif message_type == "read_receipt":
        await handle_read_receipt(payload, user)
    
    elif message_type == "presence":
        await handle_presence(websocket, payload, user)
    
    elif message_type == "join_room":
        await handle_join_room(payload, user)
    
    elif message_type == "leave_room":
        await handle_leave_room(payload, user)
    
    else:
        logger.warning(f"Unknown message type: {message_type}")


async def handle_new_message(websocket, data, user, db):
    """Handle new message event."""
    pass


async def handle_typing(websocket, data, user):
    """Handle typing indicator — broadcast to workspace."""
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


async def handle_read_receipt(payload, user):
    """Handle read receipt."""
    pass


async def handle_presence(websocket, payload, user):
    """Handle presence updates."""
    pass


async def handle_join_room(payload, user):
    """Handle joining a conversation room."""
    pass


async def handle_leave_room(payload, user):
    """Handle leaving a room."""
    pass


async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    workspace_id: uuid.UUID = Path(...),
    user: User = Depends(get_current_user_ws),
    db: AsyncSession = Depends(get_db)
):
    """Main WebSocket endpoint for real-time communication."""
    await manager.connect(websocket, user.id, workspace_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            await handle_websocket_message(websocket, data, user, db)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason="Internal error")


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