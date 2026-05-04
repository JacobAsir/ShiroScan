"""Groq-hosted LLM summarizer for fast bilingual explanation generation.

Uses Groq's OpenAI-compatible chat completions API. Model defaults to
llama-3.3-70b-versatile but can be swapped via the model parameter. Only cites
evidence the rule engine actually found — the prompt forbids inventing claims.
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

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
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
    "8. If custom allergy or dietary terms are provided, mention them specifically."
)


class GroqSummarizer(LLMSummarizer):
    name = "groq"

    def __init__(
        self,
        api_key: str,
        *,
        model: str = "llama-3.3-70b-versatile",
        timeout_seconds: float = 10.0,
    ) -> None:
        self._api_key = api_key
        self._model = model
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
            "produce the JSON described in the system prompt.\n\n"
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
        body: dict[str, Any] = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": self._build_user_prompt(
                        ocr=ocr,
                        rules=rules,
                        status=status,
                        preferences=preferences,
                    ),
                },
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 600,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(GROQ_ENDPOINT, headers=headers, json=body)
            if resp.status_code >= 400:
                logger.warning(
                    "Groq returned %s: %s", resp.status_code, resp.text[:200]
                )
                raise LLMProviderError(f"Groq HTTP {resp.status_code}")
            data = resp.json()
        except httpx.HTTPError as exc:
            raise LLMProviderError(f"Groq transport error: {exc}") from exc

        try:
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return Summary(
                summary_en=str(parsed.get("summary_en", "")).strip(),
                summary_ja=str(parsed.get("summary_ja", "")).strip(),
            )
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise LLMProviderError("Groq returned an unparseable payload.") from exc
