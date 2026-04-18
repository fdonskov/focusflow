from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import LLMError
from app.db.models.task import Task
from app.llm.prompts import categorize_prompt, decompose_prompt, summary_prompt
from app.schemas.llm import (
    CategorizeRequest,
    CategorizeResponse,
    DecomposeRequest,
    DecomposeResponse,
    Language,
    SubtaskSuggestion,
    WorkloadSummaryResponse,
)

if TYPE_CHECKING:
    from app.llm.client import LLMClient


class LLMService:
    def __init__(self, session: AsyncSession, llm: "LLMClient") -> None:
        self.session = session
        self.llm = llm

    async def categorize(self, req: CategorizeRequest) -> CategorizeResponse:
        system, user = categorize_prompt(req.title, req.description, req.language.value)
        data = await self.llm.complete_json(system=system, user=user, temperature=0.2)

        category = data.get("category")
        if not isinstance(category, str) or not category.strip():
            raise LLMError("LLM не вернул валидную категорию", code="llm_invalid_response")

        cleaned = category.strip()[:64]
        return CategorizeResponse(category=cleaned)

    async def decompose(self, req: DecomposeRequest) -> DecomposeResponse:
        system, user = decompose_prompt(req.title, req.description, req.language.value)
        data = await self.llm.complete_json(system=system, user=user, temperature=0.4)

        raw = data.get("subtasks")
        if not isinstance(raw, list) or not raw:
            raise LLMError("LLM не вернул список подзадач", code="llm_invalid_response")

        subtasks: list[SubtaskSuggestion] = []
        for item in raw[:10]:
            if not isinstance(item, dict):
                continue
            title = item.get("title")
            description = item.get("description")
            if not isinstance(title, str) or not title.strip():
                continue
            subtasks.append(
                SubtaskSuggestion(
                    title=title.strip()[:255],
                    description=(
                        description.strip()[:10_000]
                        if isinstance(description, str) and description.strip()
                        else None
                    ),
                )
            )

        if not subtasks:
            raise LLMError("LLM вернул пустой список подзадач", code="llm_invalid_response")

        return DecomposeResponse(subtasks=subtasks)

    async def workload_summary(self, language: Language) -> WorkloadSummaryResponse:
        result = await self.session.scalars(select(Task).order_by(Task.due_date.asc().nulls_last()))
        tasks = list(result.all())

        today = date.today()
        overdue = [
            t for t in tasks if t.due_date and t.due_date < today and t.status != "done"
        ]

        if not tasks:
            empty = (
                "У вас пока нет задач. Добавьте первую — и я помогу спланировать работу."
                if language == Language.RU
                else "You have no tasks yet. Add the first one and I'll help you plan."
            )
            return WorkloadSummaryResponse(summary=empty, task_count=0, overdue_count=0)

        context = _format_tasks_for_prompt(tasks, language)
        system, user = summary_prompt(context, today.isoformat(), language.value)
        summary = await self.llm.complete_text(
            system=system, user=user, temperature=0.5, max_tokens=1200
        )

        return WorkloadSummaryResponse(
            summary=summary,
            task_count=len(tasks),
            overdue_count=len(overdue),
        )


def _format_tasks_for_prompt(tasks: list[Task], language: Language) -> str:
    lines = []
    is_en = language == Language.EN
    for t in tasks:
        due = t.due_date.isoformat() if t.due_date else ("—" if not is_en else "—")
        desc = t.description or ("(no description)" if is_en else "(без описания)")
        lines.append(
            f"- [{t.status} / {t.priority}] {t.title} (due: {due})\n  {desc[:200]}"
        )
    return "\n".join(lines)
