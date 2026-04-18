from datetime import date
from enum import StrEnum

from pydantic import BaseModel, Field

from app.db.models.task import TaskPriority, TaskStatus


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class TaskSortField(StrEnum):
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    DUE_DATE = "due_date"
    PRIORITY = "priority"
    TITLE = "title"


class TaskFilters(BaseModel):
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_before: date | None = None
    due_after: date | None = None
    search: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=64)


class Pagination(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class SortParams(BaseModel):
    sort_by: TaskSortField = TaskSortField.CREATED_AT
    sort_order: SortOrder = SortOrder.DESC
