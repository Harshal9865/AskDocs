from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, status
from fastapi import UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.user import RefreshRequest, TokenPair, UserCreate, UserOut

router = APIRouter()


def _token_pair(user: User) -> TokenPair:
    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: UserCreate, db: DbSession):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenPair)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession
):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(form.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    return _token_pair(user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: DbSession):
    subject = decode_token(payload.refresh_token, "refresh")
    if subject is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    result = await db.execute(select(User).where(User.id == uuid.UUID(subject)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return _token_pair(user)


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user


# ---------- Avatar ----------

STICKER_IDS = [
    "male-1", "male-2", "male-3", "male-4",
    "female-1", "female-2", "female-3", "female-4",
    "cute-1", "cute-2", "cute-3", "cute-4",
]


class AvatarSetRequest(BaseModel):
    kind: str  # initials | sticker
    value: str | None = None


@router.post("/avatar/set", response_model=UserOut)
async def set_avatar(payload: AvatarSetRequest, db: DbSession, user: CurrentUser):
    """Choose initials mode or a default sticker."""
    if payload.kind == "initials":
        user.avatar_kind = "initials"
        user.avatar_value = None
    elif payload.kind == "sticker":
        if payload.value not in STICKER_IDS:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown sticker")
        user.avatar_kind = "sticker"
        user.avatar_value = payload.value
    else:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Use /avatar/photo for uploads")
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/avatar/photo", response_model=UserOut)
async def upload_avatar_photo(
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
):
    import os

    from app.storage.db_storage import DbStorage

    if file.content_type not in ("image/png", "image/jpeg", "image/webp"):
        raise HTTPException(400, "Only PNG, JPEG or WebP images are allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(413, "Max image size is 5 MB")

    ext = ".png" if file.content_type == "image/png" else ".jpg" if file.content_type == "image/jpeg" else ".webp"
    storage = DbStorage()
    key = storage.save(f"avatars/{user.id}", f"photo{ext}", data)

    user.avatar_kind = "upload"
    user.avatar_value = key
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/avatar/image")
async def avatar_image(db: DbSession, user: CurrentUser):
    """Serve the uploaded profile photo bytes (404 for initials/sticker modes)."""
    import mimetypes

    if user.avatar_kind != "upload" or not user.avatar_value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No uploaded photo")
    from app.models.file import FileBlob

    row = await db.execute(
        select(FileBlob.data).where(FileBlob.key == user.avatar_value)
    )
    data = row.scalar_one_or_none()
    if data is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Photo not found")
    media = mimetypes.guess_type(user.avatar_value)[0] or "application/octet-stream"
    from fastapi.responses import Response

    return Response(content=bytes(data), media_type=media)


class ProfileUpdate(BaseModel):
    name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.patch("/me", response_model=UserOut)
async def update_me(payload: ProfileUpdate, db: DbSession, user: CurrentUser):
    user.name = payload.name.strip()[:200] or user.name
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/change-password", status_code=204)
async def change_password(payload: PasswordChange, db: DbSession, user: CurrentUser):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "New password must be at least 8 characters")
    user.password_hash = hash_password(payload.new_password)
    await db.commit()
