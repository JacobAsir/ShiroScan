"""LLM summarizer abstraction."""
from __future__ import annotations

import abc
from dataclasses import dataclass

from app.models.analysis import OCRResult, RuleEngineResult
from app.schemas.request import UserPreferences
from app.schemas.response import AnalysisStatus


@dataclass
class Summary:
    summary_en: str
    summary_ja: str
    evidence_translations: dict[str, str] | None = None


class LLMSummarizer(abc.ABC):
    name: str = "base"

    @abc.abstractmethod
    async def summarize(
        self,
        *,
        ocr: OCRResult,
        rules: RuleEngineResult,
        status: AnalysisStatus,
        preferences: UserPreferences,
    ) -> Summary:
        raise NotImplementedError
