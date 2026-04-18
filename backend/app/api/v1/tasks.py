import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import TaskServiceDep
from app.db.models.task import TaskPriority, TaskStatus
from app.schemas.common import (
    Pagination,
    SortOrder,
    SortParams,
    TaskFilters,
    TaskSortField,
)
from app.schemas.task import TaskCreate, TaskListResponse, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, service: TaskServiceDep) -> TaskRead:
    task = await service.create(payload)
    return TaskRead.model_validate(task)


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    service: TaskServiceDep,
    status_filter: Annotated[TaskStatus | None, Query(alias="status")] = None,
    priority: Annotated[TaskPriority | None, Query()] = None,
    category: Annotated[str | None, Query(max_length=64)] = None,
    search: Annotated[str | None, Query(max_length=255)] = None,
    due_before: Annotated[date | None, Query()] = None,
    due_after: Annotated[date | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[TaskSortField, Query()] = TaskSortField.CREATED_AT,
    sort_order: Annotated[SortOrder, Query()] = SortOrder.DESC,
) -> TaskListResponse:
    filters = TaskFilters(
        status=status_filter,
        priority=priority,
        category=category,
        search=search,
        due_before=due_before,
        due_after=due_after,
    )
    pagination = Pagination(page=page, page_size=page_size)
    sort = SortParams(sort_by=sort_by, sort_order=sort_order)

    items, total = await service.list(filters, pagination, sort)
    return TaskListResponse(
        items=[TaskRead.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: uuid.UUID, service: TaskServiceDep) -> TaskRead:
    task = await service.get(task_id)
    return TaskRead.model_validate(task)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: uuid.UUID, payload: TaskUpdate, service: TaskServiceDep
) -> TaskRead:
    task = await service.update(task_id, payload)
    return TaskRead.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: uuid.UUID, service: TaskServiceDep) -> None:
    await service.delete(task_id)
