"""Analyze endpoints — image upload OR demo sample, both produce the same shape."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import ValidationError

from app.api.deps import get_pipeline
from app.core.config import Settings, get_settings
from app.core.errors import (
    InvalidPreferencesError,
    SampleNotFoundError,
)
from app.core.logging import get_logger
from app.schemas.request import UserPreferences
from app.schemas.response import AnalysisResponse
from app.services.pipeline import AnalysisPipeline
from app.services.samples import get_sample
from app.utils.image import validate_image_bytes

logger = get_logger(__name__)

router = APIRouter(tags=["analyze"])


def _parse_preferences(raw: str | None) -> UserPreferences:
    if not raw:
        return UserPreferences()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InvalidPreferencesError(
            "preferences must be a JSON object."
        ) from exc
    try:
        return UserPreferences.model_validate(data)
    except ValidationError as exc:
        raise InvalidPreferencesError(
            f"preferences failed validation: {exc.errors()}"
        ) from exc


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    image: UploadFile = File(...),
    preferences: str | None = Form(default=None),
    pipeline: AnalysisPipeline = Depends(get_pipeline),
    settings: Settings = Depends(get_settings),
) -> AnalysisResponse:
    prefs = _parse_preferences(preferences)
    image_bytes = await image.read()
    validate_image_bytes(
        image_bytes,
        content_type=image.content_type,
        max_bytes=settings.max_upload_bytes,
        allowed_types=settings.allowed_image_types,
    )
    logger.info(
        "analyze request: bytes=%d type=%s allergies=%d dietary=%d",
        len(image_bytes),
        image.content_type,
        len(prefs.allergies),
        len(prefs.dietary),
    )
    return await pipeline.run(
        image_bytes,
        content_type=image.content_type,
        preferences=prefs,
    )


@router.post("/analyze-demo", response_model=AnalysisResponse)
async def analyze_demo(
    sample_id: str = Form(...),
    preferences: str | None = Form(default=None),
    pipeline: AnalysisPipeline = Depends(get_pipeline),
) -> AnalysisResponse:
    sample = get_sample(sample_id)
    if not sample:
        raise SampleNotFoundError(f"Unknown demo sample '{sample_id}'.")
    prefs = _parse_preferences(preferences)
    # We bypass OCR for demos by feeding the fixture text through the rest
    # of the pipeline. We do this by constructing a tiny in-memory payload
    # that the mock provider's hash-based selector won't actually use —
    # instead we run the rule + decision engine directly on the fixture text.
    from app.models.analysis import OCRResult
    from app.services.decision_engine import decide
    from app.services.llm.template import TemplateSummarizer
    from app.services.rule_engine import run_rule_engine
    from app.utils.japanese import normalize_text

    ocr = OCRResult(
        raw_text=sample.ocr_text,
        confidence=0.92,
        provider="mock",
        product_name_hint=sample.product_name,
    )
    normalized = normalize_text(ocr.raw_text)
    rules = run_rule_engine(normalized, prefs)
    decision = decide(ocr, rules)

    try:
        summary = await pipeline._llm.summarize(  # noqa: SLF001
            ocr=ocr, rules=rules, status=decision.status, preferences=prefs
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM failed in demo path (%s); using template", exc)
        summary = await TemplateSummarizer().summarize(
            ocr=ocr, rules=rules, status=decision.status, preferences=prefs
        )

    seen: set[tuple[str, str]] = set()
    deduped = []
    for item in rules.evidence:
        key = (item.japanese_text, item.normalized_meaning)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return AnalysisResponse(
        product_name=sample.product_name,
        status=decision.status,
        confidence_score=decision.confidence_score,
        matched_allergens=rules.matched_allergens,
        matched_diet_conflicts=rules.matched_diet_conflicts,
        extracted_keywords=rules.extracted_keywords,
        evidence=deduped,
        summary_ja=summary.summary_ja,
        summary_en=summary.summary_en,
        raw_ocr_text=ocr.raw_text,
        warnings=decision.warnings,
        processing_mode="mock",
    )
