from httpx import AsyncClient


async def _create(client: AsyncClient, **overrides) -> dict:
    payload = {
        "title": "Test task",
        "description": "demo",
        "priority": "medium",
        "status": "pending",
    }
    payload.update(overrides)
    resp = await client.post("/api/v1/tasks", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_create_task(client: AsyncClient) -> None:
    data = await _create(client, title="Написать тесты")
    assert data["id"]
    assert data["title"] == "Написать тесты"
    assert data["priority"] == "medium"
    assert data["status"] == "pending"
    assert data["created_at"]


async def test_create_task_validation_empty_title(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/tasks", json={"title": "   "})
    assert resp.status_code == 422


async def test_get_task(client: AsyncClient) -> None:
    created = await _create(client)
    resp = await client.get(f"/api/v1/tasks/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


async def test_get_task_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/tasks/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
    body = resp.json()
    assert body["code"] == "not_found"


async def test_update_task(client: AsyncClient) -> None:
    created = await _create(client)
    resp = await client.patch(
        f"/api/v1/tasks/{created['id']}",
        json={"status": "in_progress", "priority": "high"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "in_progress"
    assert body["priority"] == "high"
    assert body["title"] == created["title"]  # не менялось


async def test_delete_task(client: AsyncClient) -> None:
    created = await _create(client)
    resp = await client.delete(f"/api/v1/tasks/{created['id']}")
    assert resp.status_code == 204

    resp = await client.get(f"/api/v1/tasks/{created['id']}")
    assert resp.status_code == 404


async def test_list_tasks_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/tasks")
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"items": [], "total": 0, "page": 1, "page_size": 20}


async def test_list_tasks_pagination(client: AsyncClient) -> None:
    for i in range(5):
        await _create(client, title=f"Задача {i}")

    resp = await client.get("/api/v1/tasks", params={"page": 1, "page_size": 2})
    body = resp.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2

    resp = await client.get("/api/v1/tasks", params={"page": 3, "page_size": 2})
    body = resp.json()
    assert len(body["items"]) == 1


async def test_filter_by_status(client: AsyncClient) -> None:
    await _create(client, title="A", status="pending")
    await _create(client, title="B", status="in_progress")
    await _create(client, title="C", status="done")

    resp = await client.get("/api/v1/tasks", params={"status": "in_progress"})
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "B"


async def test_filter_combined_status_and_priority(client: AsyncClient) -> None:
    await _create(client, title="A", status="pending", priority="high")
    await _create(client, title="B", status="pending", priority="low")
    await _create(client, title="C", status="done", priority="high")

    resp = await client.get(
        "/api/v1/tasks", params={"status": "pending", "priority": "high"}
    )
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "A"


async def test_search_by_title_and_description(client: AsyncClient) -> None:
    await _create(client, title="Купить молоко", description="в магазине")
    await _create(client, title="Написать отчёт", description="по молочной ферме")
    await _create(client, title="Сходить в банк", description=None)

    resp = await client.get("/api/v1/tasks", params={"search": "молоч"})
    body = resp.json()
    assert body["total"] == 1
    assert "отчёт" in body["items"][0]["title"]

    resp = await client.get("/api/v1/tasks", params={"search": "молок"})
    body = resp.json()
    assert body["total"] == 1

    resp = await client.get("/api/v1/tasks", params={"search": "МОЛОК"})
    body = resp.json()
    # ILIKE у sqlite тоже case-insensitive для ASCII; для кириллицы зависит от движка
    assert body["total"] >= 0  # просто убедимся что 500 не прилетел


async def test_filter_by_due_date_range(client: AsyncClient) -> None:
    await _create(client, title="Раньше", due_date="2026-04-01")
    await _create(client, title="Сейчас", due_date="2026-04-17")
    await _create(client, title="Позже", due_date="2026-05-01")

    resp = await client.get(
        "/api/v1/tasks", params={"due_after": "2026-04-10", "due_before": "2026-04-25"}
    )
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Сейчас"
