"""End-to-end pipeline orchestration:

   image bytes -> OCR -> rule engine -> decision -> LLM summary -> AnalysisResponse

Each step is isolated and falls back gracefully. The pipeline never raises
out of the LLM step — if Groq fails we fall back to template summaries.
"""
from __future__ import annotations

from app.core.config import Settings
from app.core.errors import OCRProviderError
from app.core.logging import get_logger
from app.models.analysis import OCRResult
from app.schemas.request import UserPreferences
from app.schemas.response import (
    AnalysisResponse,
    EvidenceItem,
    ProcessingMode,
)
from app.services.decision_engine import decide
from app.services.llm.base import LLMSummarizer
from app.services.llm.template import TemplateSummarizer
from app.services.ocr.base import OCRProvider
from app.services.ocr.mock import MockOCRProvider
from app.services.rule_engine import run_rule_engine
from app.utils.japanese import normalize_text

logger = get_logger(__name__)


def _processing_mode_for(provider_name: str) -> ProcessingMode:
    if provider_name == "mock":
        return "mock"
    if provider_name == "gemini":
        return "gemini"
    return "fallback"


class AnalysisPipeline:
    def __init__(
        self,
        ocr_provider: OCRProvider,
        llm_provider: LLMSummarizer,
        settings: Settings,
    ) -> None:
        self._ocr = ocr_provider
        self._llm = llm_provider
        self._template_fallback = TemplateSummarizer()
        self._mock_fallback = MockOCRProvider()
        self._settings = settings

    async def _ocr_with_fallback(
        self, image_bytes: bytes, content_type: str | None
    ) -> tuple[OCRResult, list[str]]:
        warnings: list[str] = []
        try:
            return await self._ocr.extract(image_bytes, content_type=content_type), warnings
        except OCRProviderError as exc:
            logger.warning("OCR provider %s failed: %s", self._ocr.name, exc)
            warnings.append(
                "Primary OCR provider failed; result generated from a fallback."
            )
            fallback = await self._mock_fallback.extract(
                image_bytes, content_type=content_type
            )
            return fallback, warnings

    async def run(
        self,
        image_bytes: bytes,
        *,
        content_type: str | None,
        preferences: UserPreferences,
        product_name_override: str | None = None,
    ) -> AnalysisResponse:
        # 1. OCR
        ocr_result, warnings = await self._ocr_with_fallback(image_bytes, content_type)
        normalized = normalize_text(ocr_result.raw_text)

        # 2. Rule engine
        rules = run_rule_engine(normalized, preferences)

        # 3. Decision engine
        decision = decide(ocr_result, rules)
        warnings.extend(decision.warnings)

        # 4. LLM summarization (with template fallback)
        try:
            summary = await self._llm.summarize(
                ocr=ocr_result,
                rules=rules,
                status=decision.status,
                preferences=preferences,
            )
        except Exception as exc:  # noqa: BLE001 — the fallback IS the safety net
            logger.warning(
                "LLM summarizer %s failed: %s; falling back to template",
                self._llm.name,
                exc,
            )
            warnings.append(
                "Explanation engine fell back to a template (LLM unavailable)."
            )
            summary = await self._template_fallback.summarize(
                ocr=ocr_result,
                rules=rules,
                status=decision.status,
                preferences=preferences,
            )

        # 5. Build response
        # Deduplicate evidence by (japanese_text, normalized_meaning) preserving order
        seen: set[tuple[str, str]] = set()
        deduped_evidence: list[EvidenceItem] = []
        for item in rules.evidence:
            key = (item.japanese_text, item.normalized_meaning)
            if key in seen:
                continue
            seen.add(key)
            deduped_evidence.append(item)

        return AnalysisResponse(
            product_name=product_name_override or ocr_result.product_name_hint,
            status=decision.status,
            confidence_score=decision.confidence_score,
            matched_allergens=rules.matched_allergens,
            matched_diet_conflicts=rules.matched_diet_conflicts,
            extracted_keywords=rules.extracted_keywords,
            evidence=deduped_evidence,
            summary_ja=summary.summary_ja,
            summary_en=summary.summary_en,
            raw_ocr_text=ocr_result.raw_text,
            warnings=warnings,
            processing_mode=_processing_mode_for(ocr_result.provider),
        )
