from functools import lru_cache
import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "AskDocs"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+psycopg://askdocs:askdocs@localhost:5432/askdocs"

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def _force_psycopg3_driver(cls, v: str) -> str:
        """Hosts (Neon/Render) hand out plain postgresql:// URLs; force the
        psycopg3 dialect since psycopg2 isn't installed."""
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        return v

    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    GOOGLE_CLIENT_ID: str | None = None

    GEMINI_API_KEY: str | None = None
    GEMINI_CHAT_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBED_MODEL: str = "gemini-embedding-001"

    STORAGE_DIR: str = "storage"
    STORAGE_BACKEND: str = "local"  # "local" (dev) or "db" (hosted, e.g. Render)
    MAX_UPLOAD_BYTES: int = 20 * 1024 * 1024

    CHUNK_SIZE_TOKENS: int = 500
    CHUNK_OVERLAP_TOKENS: int = 50
    TOP_K: int = 6

    # Plan limits
    FREE_MAX_DOCUMENTS: int = 10
    FREE_MAX_QUESTIONS: int = 50
    FREE_MAX_WORKSPACES: int = 2
    PRO_MAX_DOCUMENTS: int = 100
    PRO_MAX_QUESTIONS: int = 500
    PRO_MAX_WORKSPACES: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = Settings()
