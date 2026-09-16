"""Application settings loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables / .env file."""

    # ── Required ──────────────────────────────────────────────────────
    google_api_key: str

    # ── Optional (have sensible defaults) ─────────────────────────────
    anilist_api_url: str = "https://graphql.anilist.co"
    gemini_model: str = "gemini-3.1-flash-lite"

    # ── pydantic-settings config ──────────────────────────────────────
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton)."""
    return Settings()
