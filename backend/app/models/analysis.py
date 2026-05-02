"""Internal pipeline dataclasses (not DB models — there is no DB)."""
from __future__ import annotations

from dataclasses import dataclass, field

from app.schemas.response import EvidenceItem


@dataclass
class OCRResult:
    raw_text: str
    confidence: float
    provider: str
    product_name_hint: str | None = None


@dataclass
class RuleEngineResult:
    matched_allergens: list[str] = field(default_factory=list)
    matched_diet_conflicts: list[str] = field(default_factory=list)
    extracted_keywords: list[str] = field(default_factory=list)
    evidence: list[EvidenceItem] = field(default_factory=list)
    caution_phrases_found: list[str] = field(default_factory=list)
    has_ingredient_panel: bool = False
