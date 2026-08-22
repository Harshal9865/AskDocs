import uuid

from sqlalchemy import delete, select

from app.core.deps import AsyncSessionLocal
from app.models.file import FileBlob
from app.storage.local import StorageService


class DbStorage(StorageService):
    """Stores raw bytes in Postgres so files survive host restarts (Render etc.)."""

    async def save(self, workspace_id: str, filename: str, data: bytes) -> str:
        base_key = f"{workspace_id}/{filename}"
        key = base_key
        i = 1
        async with AsyncSessionLocal() as session:
            while True:
                exists = await session.execute(
                    select(FileBlob.id).where(FileBlob.key == key)
                )
                if exists.scalar_one_or_none() is None:
                    break
                stem, dot, ext = base_key.rpartition(".")
                key = f"{stem}-{i}.{ext}" if dot else f"{base_key}-{i}"
                i += 1
            session.add(FileBlob(key=key, data=data))
            await session.commit()
        return key

    async def open(self, storage_key: str) -> bytes:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(FileBlob.data).where(FileBlob.key == storage_key)
            )
            row = result.scalar_one_or_none()
            if row is None:
                raise FileNotFoundError(storage_key)
            return bytes(row)


def get_storage():
    from app.core.config import get_settings

    if get_settings().STORAGE_BACKEND == "db":
        return DbStorage()
    from app.storage.local import LocalStorage

    return LocalStorage()
