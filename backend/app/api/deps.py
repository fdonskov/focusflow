from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.llm.client import GroqClient, get_llm_client
from app.services.llm_service import LLMService
from app.services.task_service import TaskService

SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def get_task_service(session: SessionDep) -> TaskService:
    return TaskService(session)


TaskServiceDep = Annotated[TaskService, Depends(get_task_service)]


def get_llm_client_dep() -> GroqClient:
    return get_llm_client()


LLMClientDep = Annotated[GroqClient, Depends(get_llm_client_dep)]


async def get_llm_service(session: SessionDep, client: LLMClientDep) -> LLMService:
    return LLMService(session, client)


LLMServiceDep = Annotated[LLMService, Depends(get_llm_service)]
