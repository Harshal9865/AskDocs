from typing import Annotated
import uuid
import jwt

from fastapi import Depends, HTTPException, status, WebSocket, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.security import decode_token
from app.models.user import User

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,   # Pings DB before checkout; auto-reconnects on restart/disconnect
    pool_recycle=300,     # Recycles connections every 5m to avoid cloud idle disconnects
    pool_timeout=30,
    pool_size=10,
    max_overflow=20,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def get_db_session():
    async with AsyncSessionLocal() as session:
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]

# Role hierarchy: admin > member > viewer
ROLE_RANK = {"viewer": 0, "member": 1, "admin": 2}


async def get_current_user(
    db: DbSession,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    subject = decode_token(token, "access")
    if subject is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    result = await db.execute(select(User).where(User.id == uuid.UUID(subject)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_membership(min_role: str = "viewer"):
    """Dependency factory: resolves workspace_id from the path and enforces role.

    Non-members get 404 (don't reveal existence). Insufficient role gets 403.
    """

    async def dependency(
        workspace_id: uuid.UUID, db: DbSession, user: CurrentUser
    ):
        from app.models.workspace import WorkspaceMember

        result = await db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user.id,
            )
        )
        membership = result.scalar_one_or_none()
        if membership is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Workspace not found")
        if ROLE_RANK[membership.role] < ROLE_RANK[min_role]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return membership

    return dependency


Membership = Annotated[object, Depends(require_membership())]
AdminMembership = Annotated[object, Depends(require_membership("admin"))]
MemberMembership = Annotated[object, Depends(require_membership("member"))]


async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Authenticate WebSocket connection via JWT token from query parameter."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = uuid.UUID(payload.get("sub"))
    except (jwt.PyJWTError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        raise
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
            raise
        return user
