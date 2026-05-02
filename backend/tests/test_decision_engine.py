"""Unit tests for the decision engine."""
from __future__ import annotations

from app.models.analysis import OCRResult, RuleEngineResult
from app.schemas.response import EvidenceItem
from app.services.decision_engine import decide


def _ocr(confidence: float = 0.85, provider: str = "mock") -> OCRResult:
    return OCRResult(raw_text="dummy", confidence=confidence, provider=provider)


def test_matched_allergen_forces_avoid() -> None:
    rules = RuleEngineResult(matched_allergens=["egg"], has_ingredient_panel=True)
    out = decide(_ocr(0.9), rules)
    assert out.status == "avoid"
    assert out.confidence_score >= 0.7


def test_matched_diet_conflict_forces_avoid() -> None:
    rules = RuleEngineResult(matched_diet_conflicts=["no_pork"], has_ingredient_panel=True)
    out = decide(_ocr(0.9), rules)
    assert out.status == "avoid"


def test_caution_phrase_forces_caution() -> None:
    rules = RuleEngineResult(
        caution_phrases_found=["一部に小麦を含む"],
        has_ingredient_panel=True,
        evidence=[EvidenceItem(japanese_text="一部に小麦を含む", normalized_meaning="x", category="caution")],
    )
    out = decide(_ocr(0.85), rules)
    assert out.status == "caution"


def test_low_ocr_confidence_never_safe() -> None:
    rules = RuleEngineResult(has_ingredient_panel=True)
    out = decide(_ocr(0.3), rules)
    assert out.status == "caution"
    assert out.warnings  # should warn about low OCR


def test_no_ingredient_panel_returns_caution() -> None:
    rules = RuleEngineResult(has_ingredient_panel=False)
    out = decide(_ocr(0.85), rules)
    assert out.status == "caution"


def test_clean_label_is_safe() -> None:
    rules = RuleEngineResult(has_ingredient_panel=True)
    out = decide(_ocr(0.85), rules)
    assert out.status == "safe"
    assert out.confidence_score >= 0.85
