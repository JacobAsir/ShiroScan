"""FastAPI dependency providers for the analysis pipeline."""
from __future__ import annotations

from functools import lru_cache

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.services.llm.base import LLMSummarizer
from app.services.llm.groq import GroqSummarizer
from app.services.llm.template import TemplateSummarizer
from app.services.ocr.base import OCRProvider
from app.services.ocr.gemini import GeminiOCRProvider
from app.services.ocr.mock import MockOCRProvider
from app.services.pipeline import AnalysisPipeline

logger = get_logger(__name__)


def _resolve_ocr_provider(settings: Settings) -> OCRProvider:
    # OCRProviderChoice is "auto" | "mock" | "gemini" — invalid values are
    # rejected by Pydantic at Settings construction time, so we never silently
    # treat unknown env values as "auto".
    choice = settings.ocr_provider
    if choice == "mock":
        return MockOCRProvider()
    if choice == "gemini":
        if not settings.gemini_api_key:
            logger.warning("OCR_PROVIDER=gemini but GEMINI_API_KEY missing — using mock")
            return MockOCRProvider()
        return GeminiOCRProvider(settings.gemini_api_key)
    # auto
    if settings.gemini_api_key:
        return GeminiOCRProvider(settings.gemini_api_key)
    return MockOCRProvider()


def _resolve_llm_provider(settings: Settings) -> LLMSummarizer:
    # LLMProviderChoice is "auto" | "template" | "groq" — invalid values are
    # rejected by Pydantic at Settings construction time.
    choice = settings.llm_provider
    if choice == "template":
        return TemplateSummarizer()
    if choice == "groq":
        if not settings.groq_api_key:
            logger.warning("LLM_PROVIDER=groq but GROQ_API_KEY missing — using template")
            return TemplateSummarizer()
        return GroqSummarizer(settings.groq_api_key)
    # auto
    if settings.groq_api_key:
        return GroqSummarizer(settings.groq_api_key)
    return TemplateSummarizer()


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
