"""Response schemas for the ShiroScan API."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

EvidenceCategory = Literal["allergen", "caution", "ingredient", "diet_conflict", "additive", "spice", "stock"]
AnalysisStatus = Literal["safe", "caution", "avoid", "info"]
ProcessingMode = Literal["gemini", "fallback"]


class EvidenceItem(BaseModel):
    japanese_text: str
    normalized_meaning: str
    category: EvidenceCategory


class AnalysisResponse(BaseModel):
    product_name: str | None = None
    status: AnalysisStatus
    confidence_score: float = Field(ge=0.0, le=1.0)
    matched_allergens: list[str] = Field(default_factory=list)
    matched_diet_conflicts: list[str] = Field(default_factory=list)
    extracted_keywords: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    summary_ja: str
    summary_en: str
    raw_ocr_text: str
    warnings: list[str] = Field(default_factory=list)
    processing_mode: ProcessingMode


class HealthResponse(BaseModel):
    status: str = "ok"
    processing_mode: ProcessingMode
    ocr_provider: str
    llm_provider: str
    version: str
