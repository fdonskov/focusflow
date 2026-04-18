import json
import logging
from typing import Protocol

from groq import AsyncGroq, GroqError

from app.core.config import settings
from app.core.exceptions import LLMError, LLMNotConfiguredError

logger = logging.getLogger(__name__)


class LLMClient(Protocol):
    async def complete_json(
        self,
        *,
        system: str,
        user: str,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> dict: ...

    async def complete_text(
        self,
        *,
        system: str,
        user: str,
        temperature: float = 0.5,
        max_tokens: int = 1024,
    ) -> str: ...


class GroqClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._api_key = api_key or settings.groq_api_key
        self._model = model or settings.groq_model
        if not self._api_key:
            self._client: AsyncGroq | None = None
        else:
            self._client = AsyncGroq(api_key=self._api_key, timeout=30.0)

    def _ensure_configured(self) -> AsyncGroq:
        if self._client is None:
            raise LLMNotConfiguredError(
                "LLM не настроен: укажите GROQ_API_KEY в .env",
                code="llm_not_configured",
            )
        return self._client

    async def complete_json(
        self,
        *,
        system: str,
        user: str,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> dict:
        client = self._ensure_configured()
        try:
            resp = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                response_format={"type": "json_object"},
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except GroqError as e:
            logger.exception("Groq API error")
            raise LLMError(f"Ошибка LLM API: {e}") from e

        content = resp.choices[0].message.content or ""
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.warning("LLM вернул невалидный JSON: %s", content[:200])
            raise LLMError(
                "LLM вернул невалидный JSON",
                code="llm_invalid_response",
            ) from e

    async def complete_text(
        self,
        *,
        system: str,
        user: str,
        temperature: float = 0.5,
        max_tokens: int = 1024,
    ) -> str:
        client = self._ensure_configured()
        try:
            resp = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except GroqError as e:
            logger.exception("Groq API error")
            raise LLMError(f"Ошибка LLM API: {e}") from e

        return (resp.choices[0].message.content or "").strip()


_client: GroqClient | None = None


def get_llm_client() -> GroqClient:
    global _client
    if _client is None:
        _client = GroqClient()
    return _client
