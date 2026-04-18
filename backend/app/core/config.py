from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "FocusFlow"
    app_version: str = "0.1.0"
    debug: bool = False

    database_url: str = Field(
        default="postgresql+asyncpg://focusflow:focusflow@postgres:5432/focusflow",
    )

    cors_origins: str = "http://localhost:5173"

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def llm_enabled(self) -> bool:
        return bool(self.groq_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
