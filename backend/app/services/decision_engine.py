"""Decision engine: maps rule engine output + OCR confidence to a
final Safe / Caution / Avoid decision plus a confidence score.

Rules:
- Any matched user allergen     -> AVOID
- Any matched dietary conflict  -> AVOID
- Caution phrase present        -> CAUTION
- OCR confidence < 0.55         -> CAUTION (never overconfident SAFE on bad OCR)
- No recognizable ingredient panel found -> CAUTION
- Otherwise                      -> SAFE
"""
from __future__ import annotations

from dataclasses import dataclass

from app.models.analysis import OCRResult, RuleEngineResult
from app.schemas.response import AnalysisStatus


@dataclass
class DecisionResult:
    status: AnalysisStatus
    confidence_score: float
    warnings: list[str]


def decide(ocr: OCRResult, rules: RuleEngineResult) -> DecisionResult:
    warnings: list[str] = []

    if rules.matched_allergens or rules.matched_diet_conflicts:
        # Strong signal — clamp confidence near OCR confidence but high floor
        score = max(0.7, min(0.95, ocr.confidence + 0.1))
        return DecisionResult(status="avoid", confidence_score=round(score, 2), warnings=warnings)

    if rules.caution_phrases_found:
        score = max(0.55, min(0.85, ocr.confidence))
        return DecisionResult(
            status="caution",
            confidence_score=round(score, 2),
            warnings=warnings,
        )

    if ocr.confidence < 0.55:
        warnings.append("Low OCR confidence — please retake the photo in good lighting.")
        return DecisionResult(
            status="caution",
            confidence_score=round(max(0.3, ocr.confidence), 2),
            warnings=warnings,
        )

    if not rules.has_ingredient_panel:
        warnings.append(
            "No recognizable ingredient panel detected. "
            "Make sure the back of the package is in frame."
        )
        return DecisionResult(
            status="caution",
            confidence_score=round(max(0.4, ocr.confidence - 0.1), 2),
            warnings=warnings,
        )

    return DecisionResult(
        status="safe",
        confidence_score=round(min(0.95, ocr.confidence + 0.05), 2),
        warnings=warnings,
    )
