from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "AskDocs"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+psycopg://askdocs:askdocs@localhost:5432/askdocs"

    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    GEMINI_API_KEY: str | None = None
    GEMINI_CHAT_MODEL: str = "gemini-2.0-flash"
    GEMINI_EMBED_MODEL: str = "models/text-embedding-004"

    STORAGE_DIR: str = "storage"
    MAX_UPLOAD_BYTES: int = 20 * 1024 * 1024

    CHUNK_SIZE_TOKENS: int = 500
    CHUNK_OVERLAP_TOKENS: int = 50
    TOP_K: int = 6


@lru_cache
def get_settings() -> Settings:
    return Settings()
