"""Centralized configuration powered by Pydantic Settings."""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


OCRProviderChoice = Literal["auto", "gemini"]
LLMProviderChoice = Literal["auto", "groq"]


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_env: Literal["development", "production", "test"] = "development"
    log_level: str = "INFO"

    max_upload_mb: int = 10
    allowed_image_types: list[str] = Field(
        default_factory=lambda: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
        ]
    )

    gemini_api_key: str | None = None
    groq_api_key: str | None = None

    ocr_provider: OCRProviderChoice = "auto"
    llm_provider: LLMProviderChoice = "auto"

    cors_allowed_origins: list[str] = Field(default_factory=lambda: ["*"])

    version: str = "0.1.0"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("allowed_image_types", "cors_allowed_origins", mode="before")
    @classmethod
    def _split_csv(cls, value: object) -> object:
        if isinstance(value, str):
            return [v.strip() for v in value.split(",") if v.strip()]
        return value

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
