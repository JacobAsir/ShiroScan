"""Health & readiness endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_pipeline
from app.core.config import Settings, get_settings
from app.schemas.response import HealthResponse
from app.services.pipeline import AnalysisPipeline

router = APIRouter(tags=["health"])


def _processing_mode(ocr_name: str) -> str:
    if ocr_name == "gemini":
        return "gemini"
    return "fallback"


@router.get("/health", response_model=HealthResponse)
@router.get("/healthz", response_model=HealthResponse)
async def health(
    pipeline: AnalysisPipeline = Depends(get_pipeline),
    settings: Settings = Depends(get_settings),
) -> HealthResponse:
    ocr_name = pipeline._ocr.name  # noqa: SLF001
    llm_name = pipeline._llm.name  # noqa: SLF001
    return HealthResponse(
        status="ok",
        processing_mode=_processing_mode(ocr_name),  # type: ignore[arg-type]
        ocr_provider=ocr_name,
        llm_provider=llm_name,
        version=settings.version,
    )
