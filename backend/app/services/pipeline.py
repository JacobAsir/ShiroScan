"""End-to-end pipeline orchestration:

   image bytes -> OCR -> rule engine -> decision -> LLM summary -> AnalysisResponse

Each step is isolated and falls back gracefully. The pipeline never raises
out of the LLM step — if Gemini summarizer fails we fall back to template summaries.
"""
from __future__ import annotations

from app.core.config import Settings
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
from app.services.rule_engine import run_rule_engine
from app.utils.image import compress_for_ocr
from app.utils.japanese import normalize_text

logger = get_logger(__name__)


def _processing_mode_for(provider_name: str) -> ProcessingMode:
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
        self._settings = settings

    async def run(
        self,
        image_bytes: bytes,
        *,
        content_type: str | None,
        preferences: UserPreferences,
        product_name_override: str | None = None,
    ) -> AnalysisResponse:
        warnings: list[str] = []

        # 0. Compress image for faster upload to Gemini (resize + JPEG)
        ocr_bytes, ocr_mime = compress_for_ocr(image_bytes)
        logger.info(
            "Image compressed: %dKB -> %dKB",
            len(image_bytes) // 1024,
            len(ocr_bytes) // 1024,
        )

        # 1. OCR — real provider only
        ocr_result = await self._ocr.extract(ocr_bytes, content_type=ocr_mime)
        normalized = normalize_text(ocr_result.raw_text)

        # 2. Rule engine
        rules = run_rule_engine(normalized, preferences)

        # 3. Decision engine (now receives preferences for info mode)
        decision = decide(ocr_result, rules, preferences)
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
        seen: set[tuple[str, str]] = set()
        deduped_evidence: list[EvidenceItem] = []
        for item in rules.evidence:
            meaning = item.normalized_meaning
            if summary.evidence_translations and item.japanese_text in summary.evidence_translations:
                meaning = summary.evidence_translations[item.japanese_text]

            key = (item.japanese_text, meaning)
            if key in seen:
                continue
            seen.add(key)
            deduped_evidence.append(
                EvidenceItem(
                    japanese_text=item.japanese_text,
                    normalized_meaning=meaning,
                    category=item.category,
                )
            )

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
