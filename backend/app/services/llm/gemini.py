"""Gemini-based LLM summarizer for bilingual explanation generation.

Uses the same Gemini API key already used for OCR — no extra credentials needed.
Calls gemini-2.0-flash-lite for the text-only summary task (fast, cheap).
Only cites evidence the rule engine actually found — the prompt forbids inventing claims.
"""
from __future__ import annotations

import json
from typing import Any

import httpx

from app.core.errors import LLMProviderError
from app.core.logging import get_logger
from app.models.analysis import OCRResult, RuleEngineResult
from app.schemas.request import UserPreferences
from app.schemas.response import AnalysisStatus
from app.services.llm.base import LLMSummarizer, Summary

logger = get_logger(__name__)

GEMINI_LLM_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash-lite:generateContent"
)

SYSTEM_INSTRUCTION = (
    "You are ShiroScan's explanation engine. You explain Japanese food-label "
    "analysis results to users in plain language. STRICT RULES:\n"
    "1. Output ONLY a single JSON object with exactly two string fields: "
    "summary_en (English) and summary_ja (Japanese).\n"
    "2. Cite ONLY the evidence the rule engine has already found. Do NOT "
    "invent allergens, ingredients, or claims that are not in the evidence.\n"
    "3. Be calm, factual, and brief. 2-4 short sentences per language.\n"
    "4. Use natural, native-sounding language. The Japanese summary must "
    "be fluent (desu/masu form) and avoid sounding like a machine translation.\n"
    "5. Never give medical advice. Never tell the user to consult a doctor.\n"
    "6. Match the requested decision (safe / caution / avoid / info) — do not "
    "second-guess it.\n"
    "7. When the decision is 'info', list ALL detected allergen-related "
    "ingredients and suggest setting preferences.\n"
    "8. If custom allergy or dietary terms are provided, mention them specifically.\n"
    "9. When additives, spices, or stock ingredients are present in evidence, "
    "briefly acknowledge them so the user is aware."
)


class GeminiSummarizer(LLMSummarizer):
    name = "gemini"

    def __init__(
        self,
        api_key: str,
        *,
        timeout_seconds: float = 15.0,
    ) -> None:
        self._api_key = api_key
        self._timeout = timeout_seconds

    def _build_user_prompt(
        self,
        *,
        ocr: OCRResult,
        rules: RuleEngineResult,
        status: AnalysisStatus,
        preferences: UserPreferences,
    ) -> str:
        evidence_payload = [
            {
                "japanese_text": e.japanese_text,
                "meaning": e.normalized_meaning,
                "category": e.category,
            }
            for e in rules.evidence
        ]
        user_prefs: dict[str, Any] = {
            "allergies": list(preferences.allergies),
            "dietary": list(preferences.dietary),
        }
        if preferences.custom_allergies:
            user_prefs["custom_allergies"] = list(preferences.custom_allergies)
        if preferences.custom_dietary:
            user_prefs["custom_dietary"] = list(preferences.custom_dietary)

        payload = {
            "decision": status,
            "matched_allergens": rules.matched_allergens,
            "matched_diet_conflicts": rules.matched_diet_conflicts,
            "user_preferences": user_prefs,
            "evidence": evidence_payload,
            "ocr_confidence": ocr.confidence,
            "caution_phrases": rules.caution_phrases_found,
        }
        return (
            "Given the following structured analysis of a Japanese food label, "
            "produce the JSON described in the system instruction.\n\n"
            f"DATA:\n{json.dumps(payload, ensure_ascii=False)}"
        )

    async def summarize(
        self,
        *,
        ocr: OCRResult,
        rules: RuleEngineResult,
        status: AnalysisStatus,
        preferences: UserPreferences,
    ) -> Summary:
        user_prompt = self._build_user_prompt(
            ocr=ocr,
            rules=rules,
            status=status,
            preferences=preferences,
        )

        body: dict[str, Any] = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_INSTRUCTION}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 600,
                "responseMimeType": "application/json",
            },
        }
        params = {"key": self._api_key}

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(
                    GEMINI_LLM_ENDPOINT, params=params, json=body
                )
            if resp.status_code >= 400:
                logger.warning(
                    "Gemini LLM returned %s: %s", resp.status_code, resp.text[:200]
                )
                raise LLMProviderError(f"Gemini LLM HTTP {resp.status_code}")
            data = resp.json()
        except httpx.HTTPError as exc:
            raise LLMProviderError(f"Gemini LLM transport error: {exc}") from exc

        try:
            content = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(content)
            return Summary(
                summary_en=str(parsed.get("summary_en", "")).strip(),
                summary_ja=str(parsed.get("summary_ja", "")).strip(),
            )
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise LLMProviderError(
                "Gemini LLM returned an unparseable payload."
            ) from exc
