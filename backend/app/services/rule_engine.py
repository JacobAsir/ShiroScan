"""Deterministic rule engine: scans normalized Japanese OCR text for known
allergen keywords, caution phrases, dietary conflict indicators, and
user-defined custom terms.

This runs BEFORE the LLM. The LLM only explains what this engine has already
found; it cannot override a decision.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.models.analysis import RuleEngineResult
from app.schemas.request import AllergenKey, DietaryKey, UserPreferences
from app.schemas.response import EvidenceItem


@dataclass(frozen=True)
class AllergenRule:
    key: AllergenKey
    keywords: tuple[str, ...]
    en_label: str


# 10 Japanese allergens covered by the brief (egg, milk, wheat, shrimp, crab,
# peanuts, buckwheat, walnuts, soy, sesame) — i.e. the 8 statutory "specified
# raw materials" (特定原材料) plus soy and sesame from the recommended list,
# matching the user's spec. "milk" intentionally matches both 乳 and 乳成分.
ALLERGEN_RULES: tuple[AllergenRule, ...] = (
    AllergenRule("egg", ("卵", "鶏卵", "玉子"), "egg"),
    AllergenRule("milk", ("乳成分", "乳"), "milk"),
    AllergenRule("wheat", ("小麦",), "wheat"),
    AllergenRule("shrimp", ("えび", "海老", "エビ"), "shrimp"),
    AllergenRule("crab", ("かに", "蟹", "カニ"), "crab"),
    AllergenRule("peanuts", ("落花生", "ピーナッツ"), "peanuts"),
    AllergenRule("buckwheat", ("そば", "蕎麦"), "buckwheat"),
    AllergenRule("walnuts", ("くるみ", "クルミ", "胡桃"), "walnuts"),
    AllergenRule("soy", ("大豆",), "soy"),
    AllergenRule("sesame", ("ごま", "ゴマ", "胡麻"), "sesame"),
)


# "を含む" patterns — these flag presence even when buried in a sentence.
CAUTION_PATTERNS: tuple[tuple[str, str], ...] = (
    (r"一部に[^。\n]{0,40}?を含む", "Contains: notice within ingredients"),
    (r"同一工場で[^。\n]{0,40}?を含む製品を製造", "Cross-contamination notice (same factory)"),
    (r"本品製造工場では[^。\n]{0,40}?を含む製品を生産", "Cross-contamination notice (same facility)"),
    (r"[^。\n]{1,20}を含む", "Contains: explicit declaration"),
)

# Dietary conflict rules.
PORK_KEYWORDS = ("豚", "ポーク", "ラード", "豚肉", "豚脂", "ベーコン", "ハム", "ソーセージ")
MEAT_KEYWORDS = (
    "豚", "牛", "鶏", "肉", "ベーコン", "ハム", "ソーセージ", "ゼラチン",
    "鶏ガラ", "ポーク", "ビーフ", "チキン", "魚", "鰹", "鯖", "魚介",
)
DAIRY_KEYWORDS = ("乳", "乳成分", "バター", "チーズ", "ヨーグルト", "クリーム", "脱脂粉乳", "練乳")
ALCOHOL_KEYWORDS = ("酒精", "アルコール", "ワイン", "みりん", "料理酒")


def _find_first(text: str, needles: tuple[str, ...]) -> str | None:
    for n in needles:
        if n in text:
            return n
    return None


def _excerpt(text: str, needle: str, span: int = 18) -> str:
    idx = text.find(needle)
    if idx < 0:
        return needle
    start = max(0, idx - span)
    end = min(len(text), idx + len(needle) + span)
    snippet = text[start:end].replace("\n", " ").strip()
    return snippet


def run_rule_engine(text: str, preferences: UserPreferences) -> RuleEngineResult:
    """Scan normalized OCR text. Returns matched allergens, dietary conflicts,
    extracted keywords, and per-finding evidence items."""
    result = RuleEngineResult()

    if not text:
        return result

    user_allergens: set[AllergenKey] = set(preferences.allergies)
    user_diet: set[DietaryKey] = set(preferences.dietary)

    # 1. Caution patterns — flag cross-contamination / "contains" notices.
    for pattern, meaning in CAUTION_PATTERNS:
        for match in re.finditer(pattern, text):
            phrase = match.group(0).strip()
            if phrase and phrase not in result.caution_phrases_found:
                result.caution_phrases_found.append(phrase)
                result.evidence.append(
                    EvidenceItem(
                        japanese_text=phrase,
                        normalized_meaning=meaning,
                        category="caution",
                    )
                )

    # 2. Allergen keyword scan — record EVERY allergen found in the label
    # (so the user sees all detected allergens, not just ones they flagged),
    # but matched_allergens only contains those that intersect user prefs.
    for rule in ALLERGEN_RULES:
        hit = _find_first(text, rule.keywords)
        if not hit:
            continue
        if hit not in result.extracted_keywords:
            result.extracted_keywords.append(hit)
        is_match = rule.key in user_allergens
        if is_match and rule.key not in result.matched_allergens:
            result.matched_allergens.append(rule.key)
        result.evidence.append(
            EvidenceItem(
                japanese_text=_excerpt(text, hit),
                normalized_meaning=rule.en_label,
                category="allergen" if is_match else "ingredient",
            )
        )

    # 3. Custom allergy term matching — substring search against OCR text.
    for custom_term in preferences.custom_allergies:
        term = custom_term.strip()
        if not term:
            continue
        # Try exact substring match (works for Japanese terms)
        if term in text:
            key = f"custom:{term}"
            if key not in result.matched_allergens:
                result.matched_allergens.append(key)
            result.evidence.append(
                EvidenceItem(
                    japanese_text=_excerpt(text, term),
                    normalized_meaning=f"Custom allergy: {term}",
                    category="allergen",
                )
            )
        # Also try case-insensitive match for English terms
        elif term.lower() in text.lower():
            key = f"custom:{term}"
            if key not in result.matched_allergens:
                result.matched_allergens.append(key)
            result.evidence.append(
                EvidenceItem(
                    japanese_text=_excerpt(text.lower(), term.lower()),
                    normalized_meaning=f"Custom allergy: {term}",
                    category="allergen",
                )
            )

    # 4. Dietary conflicts.
    if "vegetarian" in user_diet:
        meat = _find_first(text, MEAT_KEYWORDS)
        if meat:
            if "vegetarian" not in result.matched_diet_conflicts:
                result.matched_diet_conflicts.append("vegetarian")
            result.evidence.append(
                EvidenceItem(
                    japanese_text=_excerpt(text, meat),
                    normalized_meaning=f"Animal-derived ingredient ({meat})",
                    category="diet_conflict",
                )
            )

    if "no_pork" in user_diet or "halal" in user_diet:
        pork = _find_first(text, PORK_KEYWORDS)
        if pork:
            for diet in ("no_pork", "halal"):
                if diet in user_diet and diet not in result.matched_diet_conflicts:
                    result.matched_diet_conflicts.append(diet)
            result.evidence.append(
                EvidenceItem(
                    japanese_text=_excerpt(text, pork),
                    normalized_meaning=f"Pork-derived ingredient ({pork})",
                    category="diet_conflict",
                )
            )

    if "halal" in user_diet:
        alc = _find_first(text, ALCOHOL_KEYWORDS)
        if alc:
            if "halal" not in result.matched_diet_conflicts:
                result.matched_diet_conflicts.append("halal")
            result.evidence.append(
                EvidenceItem(
                    japanese_text=_excerpt(text, alc),
                    normalized_meaning=f"Alcohol-derived ingredient ({alc})",
                    category="diet_conflict",
                )
            )

    if "lactose_free" in user_diet:
        dairy = _find_first(text, DAIRY_KEYWORDS)
        if dairy:
            if "lactose_free" not in result.matched_diet_conflicts:
                result.matched_diet_conflicts.append("lactose_free")
            result.evidence.append(
                EvidenceItem(
                    japanese_text=_excerpt(text, dairy),
                    normalized_meaning=f"Dairy-derived ingredient ({dairy})",
                    category="diet_conflict",
                )
            )

    # 5. Custom dietary term matching.
    for custom_term in preferences.custom_dietary:
        term = custom_term.strip()
        if not term:
            continue
        if term in text:
            key = f"custom:{term}"
            if key not in result.matched_diet_conflicts:
                result.matched_diet_conflicts.append(key)
            result.evidence.append(
                EvidenceItem(
                    japanese_text=_excerpt(text, term),
                    normalized_meaning=f"Custom dietary conflict: {term}",
                    category="diet_conflict",
                )
            )
        elif term.lower() in text.lower():
            key = f"custom:{term}"
            if key not in result.matched_diet_conflicts:
                result.matched_diet_conflicts.append(key)
            result.evidence.append(
                EvidenceItem(
                    japanese_text=_excerpt(text.lower(), term.lower()),
                    normalized_meaning=f"Custom dietary conflict: {term}",
                    category="diet_conflict",
                )
            )

    # 6. Detect whether we saw a recognizable ingredient panel at all.
    if "原材料" in text or "成分" in text or result.extracted_keywords:
        result.has_ingredient_panel = True

    return result
