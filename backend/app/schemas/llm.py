from enum import StrEnum

from pydantic import BaseModel, Field


class Language(StrEnum):
    RU = "ru"
    EN = "en"


class CategorizeRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)
    language: Language = Language.RU


class CategorizeResponse(BaseModel):
    category: str = Field(..., min_length=1, max_length=64)


class DecomposeRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)
    language: Language = Language.RU


class SubtaskSuggestion(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)


class DecomposeResponse(BaseModel):
    subtasks: list[SubtaskSuggestion] = Field(..., min_length=1, max_length=10)


class WorkloadSummaryResponse(BaseModel):
    summary: str
    task_count: int
    overdue_count: int
