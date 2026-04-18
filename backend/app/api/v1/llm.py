from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import LLMServiceDep
from app.schemas.llm import (
    CategorizeRequest,
    CategorizeResponse,
    DecomposeRequest,
    DecomposeResponse,
    Language,
    WorkloadSummaryResponse,
)

router = APIRouter(prefix="/llm", tags=["llm"])


@router.post("/categorize", response_model=CategorizeResponse)
async def categorize(payload: CategorizeRequest, service: LLMServiceDep) -> CategorizeResponse:
    return await service.categorize(payload)


@router.post("/decompose", response_model=DecomposeResponse)
async def decompose(payload: DecomposeRequest, service: LLMServiceDep) -> DecomposeResponse:
    return await service.decompose(payload)


@router.get("/workload-summary", response_model=WorkloadSummaryResponse)
async def workload_summary(
    service: LLMServiceDep,
    language: Annotated[Language, Query()] = Language.RU,
) -> WorkloadSummaryResponse:
    return await service.workload_summary(language)
