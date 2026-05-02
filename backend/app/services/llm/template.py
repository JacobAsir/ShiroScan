"""Deterministic template-based summarizer. Always works, no API key required.

Used as the default mock summarizer AND as the safety-net fallback when
the Groq summarizer fails. Cites only evidence the rule engine actually found —
never invents claims.
"""
from __future__ import annotations

from app.models.analysis import OCRResult, RuleEngineResult
from app.schemas.request import UserPreferences
from app.schemas.response import AnalysisStatus
from app.services.llm.base import LLMSummarizer, Summary

_ALLERGEN_LABELS_EN = {
    "egg": "egg",
    "milk": "milk",
    "wheat": "wheat",
    "shrimp": "shrimp",
    "crab": "crab",
    "peanuts": "peanuts",
    "buckwheat": "buckwheat",
    "walnuts": "walnuts",
    "soy": "soy",
    "sesame": "sesame",
}
_ALLERGEN_LABELS_JA = {
    "egg": "卵",
    "milk": "乳",
    "wheat": "小麦",
    "shrimp": "えび",
    "crab": "かに",
    "peanuts": "落花生",
    "buckwheat": "そば",
    "walnuts": "くるみ",
    "soy": "大豆",
    "sesame": "ごま",
}
_DIET_LABELS_EN = {
    "vegetarian": "vegetarian preference",
    "halal": "halal preference",
    "no_pork": "no-pork preference",
    "lactose_free": "lactose-free preference",
}
_DIET_LABELS_JA = {
    "vegetarian": "ベジタリアンの希望",
    "halal": "ハラルの希望",
    "no_pork": "豚肉なしの希望",
    "lactose_free": "乳糖なしの希望",
}


class TemplateSummarizer(LLMSummarizer):
    name = "template"

    async def summarize(
        self,
        *,
        ocr: OCRResult,
        rules: RuleEngineResult,
        status: AnalysisStatus,
        preferences: UserPreferences,
    ) -> Summary:
        allergens_en = [
            _ALLERGEN_LABELS_EN.get(a, a) for a in rules.matched_allergens
        ]
        allergens_ja = [
            _ALLERGEN_LABELS_JA.get(a, a) for a in rules.matched_allergens
        ]
        diets_en = [_DIET_LABELS_EN.get(d, d) for d in rules.matched_diet_conflicts]
        diets_ja = [_DIET_LABELS_JA.get(d, d) for d in rules.matched_diet_conflicts]

        if status == "avoid":
            en_parts = ["This product is not safe for you."]
            ja_parts = ["この商品はあなたには適していません。"]
            if allergens_en:
                en_parts.append(
                    f"It contains your flagged allergen(s): {', '.join(allergens_en)}."
                )
                ja_parts.append(
                    f"設定したアレルゲンが含まれています：{'、'.join(allergens_ja)}。"
                )
            if diets_en:
                en_parts.append(
                    f"It also conflicts with your {', '.join(diets_en)}."
                )
                ja_parts.append(
                    f"また、{('、'.join(diets_ja))}にも合いません。"
                )
        elif status == "caution":
            en_parts = ["Proceed with caution."]
            ja_parts = ["注意してください。"]
            if rules.caution_phrases_found:
                en_parts.append(
                    "The label contains a cross-contamination or trace-amount notice."
                )
                ja_parts.append("ラベルに混入注意の表記があります。")
            if ocr.confidence < 0.6:
                en_parts.append("The label was hard to read clearly.")
                ja_parts.append("ラベルが読みづらかったため、結果に注意が必要です。")
            if allergens_en:
                en_parts.append(
                    f"Possible match for: {', '.join(allergens_en)}."
                )
                ja_parts.append(
                    f"一致の可能性：{'、'.join(allergens_ja)}。"
                )
        else:
            en_parts = ["No matches found against your selected allergies or diet preferences."]
            ja_parts = [
                "選択したアレルギーや食事制限に該当する成分は見つかりませんでした。"
            ]
            en_parts.append("Always confirm with the printed label before consuming.")
            ja_parts.append("実物のラベルでも必ず最終確認してください。")

        if not preferences.allergies and not preferences.dietary:
            en_parts.append(
                "No personal preferences were set, so this is a general scan only."
            )
            ja_parts.append(
                "個人設定が未指定のため、一般的なスキャン結果のみを表示しています。"
            )

        return Summary(
            summary_en=" ".join(en_parts).strip(),
            summary_ja="".join(ja_parts).strip(),
        )
