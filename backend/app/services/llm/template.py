"""Deterministic template-based summarizer — safety-net fallback.

Used as the emergency fallback when the Groq LLM summarizer fails.
Cites only evidence the rule engine actually found — never invents claims.
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

        if status == "info":
            # Informational mode — no preferences set, list everything found
            en_parts = ["Here's what we found in this product."]
            ja_parts = ["この商品に含まれるものを以下に示します。"]

            # List all detected allergen-category ingredients
            ingredient_names_en = []
            ingredient_names_ja = []
            for item in rules.evidence:
                if item.category in ("allergen", "ingredient"):
                    meaning = item.normalized_meaning
                    en_name = _ALLERGEN_LABELS_EN.get(meaning, meaning)
                    ja_name = _ALLERGEN_LABELS_JA.get(meaning, item.japanese_text)
                    if en_name not in ingredient_names_en:
                        ingredient_names_en.append(en_name)
                    if ja_name not in ingredient_names_ja:
                        ingredient_names_ja.append(ja_name)

            if ingredient_names_en:
                en_parts.append(
                    f"Detected allergen-related ingredients: {', '.join(ingredient_names_en)}."
                )
                ja_parts.append(
                    f"検出されたアレルゲン関連成分：{'、'.join(ingredient_names_ja)}。"
                )

            if rules.caution_phrases_found:
                en_parts.append(
                    "A cross-contamination or trace-amount notice was found on the label."
                )
                ja_parts.append("ラベルに混入注意の表記があります。")

            en_parts.append(
                "Set your allergy and dietary preferences for a personalized safety check."
            )
            ja_parts.append(
                "アレルギーや食事制限を設定すると、パーソナライズされた安全チェックができます。"
            )
            return Summary(
                summary_en=" ".join(en_parts).strip(),
                summary_ja="".join(ja_parts).strip(),
            )

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

        return Summary(
            summary_en=" ".join(en_parts).strip(),
            summary_ja="".join(ja_parts).strip(),
        )
