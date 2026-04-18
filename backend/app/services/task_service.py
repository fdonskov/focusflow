import uuid
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.models.task import Task
from app.repositories.task_repo import TaskRepository
from app.schemas.common import Pagination, SortParams, TaskFilters
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = TaskRepository(session)

    async def create(self, data: TaskCreate) -> Task:
        payload = data.model_dump()
        task = await self.repo.create(payload)
        await self.session.commit()
        return task

    async def get(self, task_id: uuid.UUID) -> Task:
        task = await self.repo.get_by_id(task_id)
        if task is None:
            raise NotFoundError(f"Задача {task_id} не найдена")
        return task

    async def list(
        self,
        filters: TaskFilters,
        pagination: Pagination,
        sort: SortParams,
    ) -> tuple[Sequence[Task], int]:
        return await self.repo.list(filters, pagination, sort)

    async def update(self, task_id: uuid.UUID, data: TaskUpdate) -> Task:
        task = await self.get(task_id)
        payload = data.model_dump(exclude_unset=True)
        if not payload:
            return task
        task = await self.repo.update(task, payload)
        await self.session.commit()
        return task

    async def delete(self, task_id: uuid.UUID) -> None:
        task = await self.get(task_id)
        await self.repo.delete(task)
        await self.session.commit()
