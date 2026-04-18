from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_llm_client_dep, get_llm_service, get_session, get_task_service
from app.core.exceptions import LLMError, LLMNotConfiguredError
from app.main import app
from app.services.llm_service import LLMService
from app.services.task_service import TaskService


class FakeLLMClient:
    def __init__(
        self,
        json_response: dict | None = None,
        text_response: str | None = None,
        raise_error: Exception | None = None,
    ) -> None:
        self.json_response = json_response
        self.text_response = text_response
        self.raise_error = raise_error
        self.calls: list[dict] = []

    async def complete_json(self, **kwargs) -> dict:  # noqa: ANN003
        self.calls.append({"type": "json", **kwargs})
        if self.raise_error:
            raise self.raise_error
        return self.json_response or {}

    async def complete_text(self, **kwargs) -> str:  # noqa: ANN003
        self.calls.append({"type": "text", **kwargs})
        if self.raise_error:
            raise self.raise_error
        return self.text_response or ""


@pytest_asyncio.fixture
async def llm_client_and_app(session: AsyncSession) -> AsyncGenerator[tuple[FakeLLMClient, AsyncClient], None]:
    fake = FakeLLMClient()

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield session

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_task_service] = lambda: TaskService(session)
    app.dependency_overrides[get_llm_client_dep] = lambda: fake
    app.dependency_overrides[get_llm_service] = lambda: LLMService(session, fake)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield fake, client

    app.dependency_overrides.clear()


async def test_categorize_success(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.json_response = {"category": "работа"}

    resp = await client.post(
        "/api/v1/llm/categorize",
        json={"title": "Сдать отчёт", "description": "по Q1"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"category": "работа"}
    assert fake.calls[0]["type"] == "json"


async def test_categorize_trims_and_truncates(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.json_response = {"category": "  " + "x" * 100 + "  "}

    resp = await client.post("/api/v1/llm/categorize", json={"title": "T"})
    assert resp.status_code == 200
    assert len(resp.json()["category"]) == 64


async def test_categorize_invalid_response(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.json_response = {"something_else": "oops"}

    resp = await client.post("/api/v1/llm/categorize", json={"title": "T"})
    assert resp.status_code == 502
    assert resp.json()["code"] == "llm_invalid_response"


async def test_categorize_not_configured(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.raise_error = LLMNotConfiguredError("LLM не настроен")

    resp = await client.post("/api/v1/llm/categorize", json={"title": "T"})
    assert resp.status_code == 503
    assert resp.json()["code"] == "llm_not_configured"


async def test_categorize_upstream_failure(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.raise_error = LLMError("Groq недоступен")

    resp = await client.post("/api/v1/llm/categorize", json={"title": "T"})
    assert resp.status_code == 502


async def test_decompose_success(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.json_response = {
        "subtasks": [
            {"title": "Шаг 1", "description": "Сделать А"},
            {"title": "Шаг 2", "description": "Сделать Б"},
            {"title": "Шаг 3"},
        ],
    }

    resp = await client.post(
        "/api/v1/llm/decompose",
        json={"title": "Сделать проект", "description": "..."},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["subtasks"]) == 3
    assert body["subtasks"][0]["title"] == "Шаг 1"
    assert body["subtasks"][2]["description"] is None


async def test_decompose_empty_list(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.json_response = {"subtasks": []}

    resp = await client.post("/api/v1/llm/decompose", json={"title": "T"})
    assert resp.status_code == 502


async def test_decompose_filters_invalid_items(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.json_response = {
        "subtasks": [
            {"title": "Valid"},
            {"description": "без title — отбросить"},
            "строка вместо объекта",
            {"title": "   "},  # blank — отбросить
        ]
    }

    resp = await client.post("/api/v1/llm/decompose", json={"title": "T"})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["subtasks"]) == 1
    assert body["subtasks"][0]["title"] == "Valid"


async def test_workload_summary_empty(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    resp = await client.get("/api/v1/llm/workload-summary", params={"language": "ru"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["task_count"] == 0
    assert body["overdue_count"] == 0
    assert "задач" in body["summary"].lower()
    # Для пустого списка LLM не должен вызываться
    assert fake.calls == []


async def test_workload_summary_with_tasks(llm_client_and_app) -> None:
    fake, client = llm_client_and_app
    fake.text_response = "## Сводка\n\nУ вас 2 задачи."

    await client.post("/api/v1/tasks", json={"title": "A", "priority": "high"})
    await client.post("/api/v1/tasks", json={"title": "B", "priority": "low"})

    resp = await client.get("/api/v1/llm/workload-summary", params={"language": "ru"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["task_count"] == 2
    assert body["summary"].startswith("## Сводка")
    assert fake.calls[0]["type"] == "text"
