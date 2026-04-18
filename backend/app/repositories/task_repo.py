import uuid
from collections.abc import Sequence

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.task import Task
from app.schemas.common import Pagination, SortOrder, SortParams, TaskFilters


class TaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: dict) -> Task:
        task = Task(**data)
        self.session.add(task)
        await self.session.flush()
        await self.session.refresh(task)
        return task

    async def get_by_id(self, task_id: uuid.UUID) -> Task | None:
        return await self.session.get(Task, task_id)

    async def list(
        self,
        filters: TaskFilters,
        pagination: Pagination,
        sort: SortParams,
    ) -> tuple[Sequence[Task], int]:
        conditions = self._build_filter_conditions(filters)

        count_stmt = select(func.count(Task.id))
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        total = await self.session.scalar(count_stmt) or 0

        stmt = select(Task)
        if conditions:
            stmt = stmt.where(and_(*conditions))

        sort_column = getattr(Task, sort.sort_by.value)
        stmt = stmt.order_by(
            sort_column.desc() if sort.sort_order == SortOrder.DESC else sort_column.asc()
        )
        stmt = stmt.offset(pagination.offset).limit(pagination.limit)

        result = await self.session.scalars(stmt)
        return result.all(), total

    async def update(self, task: Task, data: dict) -> Task:
        for key, value in data.items():
            setattr(task, key, value)
        await self.session.flush()
        await self.session.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self.session.delete(task)
        await self.session.flush()

    @staticmethod
    def _build_filter_conditions(filters: TaskFilters) -> list:
        conditions: list = []

        if filters.status is not None:
            conditions.append(Task.status == filters.status.value)

        if filters.priority is not None:
            conditions.append(Task.priority == filters.priority.value)

        if filters.category is not None:
            conditions.append(Task.category == filters.category)

        if filters.due_before is not None:
            conditions.append(Task.due_date <= filters.due_before)

        if filters.due_after is not None:
            conditions.append(Task.due_date >= filters.due_after)

        if filters.search:
            pattern = f"%{filters.search.strip()}%"
            conditions.append(
                or_(
                    Task.title.ilike(pattern),
                    Task.description.ilike(pattern),
                )
            )

        return conditions
