from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import get_settings


class StorageService(ABC):
    @abstractmethod
    async def save(self, workspace_id: str, filename: str, data: bytes) -> str:
        """Store bytes, return a storage key."""

    @abstractmethod
    async def open(self, storage_key: str) -> bytes:
        """Return raw file bytes for a key."""


class LocalStorage(StorageService):
    def __init__(self, base_dir: str | None = None):
        self.base = Path(base_dir or get_settings().STORAGE_DIR)

    def _path(self, key: str) -> Path:
        return self.base / key

    async def save(self, workspace_id: str, filename: str, data: bytes) -> str:
        key = f"{workspace_id}/{filename}"
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            # avoid silent overwrite of different content
            i = 1
            stem, suffix = path.stem, path.suffix
            while path.exists():
                key = f"{workspace_id}/{stem}-{i}{suffix}"
                path = self._path(key)
                i += 1
        path.write_bytes(data)
        return key

    async def open(self, storage_key: str) -> bytes:
        return self._path(storage_key).read_bytes()


def get_storage() -> StorageService:
    return LocalStorage()
