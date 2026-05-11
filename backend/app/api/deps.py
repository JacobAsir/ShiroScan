"""FastAPI dependency providers for the analysis pipeline."""
from __future__ import annotations

from functools import lru_cache

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.services.llm.base import LLMSummarizer
from app.services.llm.gemini import GeminiSummarizer
from app.services.ocr.base import OCRProvider
from app.services.ocr.gemini import GeminiOCRProvider
from app.services.pipeline import AnalysisPipeline

logger = get_logger(__name__)


def _resolve_ocr_provider(settings: Settings) -> OCRProvider:
    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is required. Set it in your .env file. "
            "Get one at https://aistudio.google.com/app/apikey"
        )
    return GeminiOCRProvider(settings.gemini_api_key)


def _resolve_llm_provider(settings: Settings) -> LLMSummarizer:
    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is required for both OCR and summarization. "
            "Set it in your .env file. "
            "Get one at https://aistudio.google.com/app/apikey"
        )
    return GeminiSummarizer(settings.gemini_api_key)


@lru_cache(maxsize=1)
def _build_pipeline_singleton() -> AnalysisPipeline:
    settings = get_settings()
    ocr = _resolve_ocr_provider(settings)
    llm = _resolve_llm_provider(settings)
    logger.info(
        "Built analysis pipeline (ocr=%s, llm=%s)", ocr.name, llm.name
    )
    return AnalysisPipeline(ocr_provider=ocr, llm_provider=llm, settings=settings)


def get_pipeline() -> AnalysisPipeline:
    return _build_pipeline_singleton()


def get_provider_names(
    settings: Settings = Depends(get_settings),
) -> tuple[str, str]:
    pipeline = _build_pipeline_singleton()
    return pipeline._ocr.name, pipeline._llm.name  # noqa: SLF001 — internal read
