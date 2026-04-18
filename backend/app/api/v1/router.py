from fastapi import APIRouter

from app.api.v1.llm import router as llm_router
from app.api.v1.tasks import router as tasks_router
from app.core.config import settings

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/health", tags=["health"])
async def health() -> dict[str, str | bool]:
    return {"status": "ok", "llm_enabled": settings.llm_enabled}


api_router.include_router(tasks_router)
api_router.include_router(llm_router)
