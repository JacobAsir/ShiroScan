"""Unit tests for the deterministic rule engine."""
from __future__ import annotations

from app.schemas.request import UserPreferences
from app.services.rule_engine import run_rule_engine
from app.utils.japanese import normalize_text


def _norm(text: str) -> str:
    return normalize_text(text)


def test_detects_egg_when_user_has_egg_allergy() -> None:
    text = _norm(
        "原材料名：小麦粉、砂糖、鶏卵\nアレルギー物質：一部に卵・小麦を含む"
    )
    prefs = UserPreferences(allergies=["egg"])
    result = run_rule_engine(text, prefs)
    assert "egg" in result.matched_allergens
    assert any(e.category == "allergen" for e in result.evidence)
    assert result.has_ingredient_panel


def test_does_not_match_when_user_has_no_relevant_allergy() -> None:
    text = _norm("原材料名：小麦粉、砂糖、鶏卵")
    prefs = UserPreferences(allergies=["peanuts"])
    result = run_rule_engine(text, prefs)
    assert "egg" not in result.matched_allergens
    # But the keyword should still be extracted as ingredient evidence
    assert "卵" in result.extracted_keywords


def test_caution_phrase_cross_contamination() -> None:
    text = _norm(
        "原材料名：米、砂糖\n本品製造工場では落花生を含む製品を生産しています。"
    )
    prefs = UserPreferences()
    result = run_rule_engine(text, prefs)
    assert result.caution_phrases_found
    assert any(e.category == "caution" for e in result.evidence)


def test_pork_keyword_triggers_no_pork_and_halal() -> None:
    text = _norm("原材料名：ラード（豚由来）、小麦粉、食塩")
    prefs = UserPreferences(dietary=["no_pork", "halal"])
    result = run_rule_engine(text, prefs)
    assert "no_pork" in result.matched_diet_conflicts
    assert "halal" in result.matched_diet_conflicts


def test_alcohol_only_triggers_halal() -> None:
    text = _norm("原材料名：大豆、米、食塩、酒精")
    prefs = UserPreferences(dietary=["halal"])
    result = run_rule_engine(text, prefs)
    assert "halal" in result.matched_diet_conflicts


def test_vegetarian_flagged_by_meat_keyword() -> None:
    text = _norm("原材料名：ポークエキス、玉ねぎ、香辛料")
    prefs = UserPreferences(dietary=["vegetarian"])
    result = run_rule_engine(text, prefs)
    assert "vegetarian" in result.matched_diet_conflicts


def test_milk_matches_both_乳_and_乳成分() -> None:
    text = _norm("アレルギー物質：一部に乳成分を含む")
    prefs = UserPreferences(allergies=["milk"])
    result = run_rule_engine(text, prefs)
    assert "milk" in result.matched_allergens


def test_empty_text_returns_empty_result() -> None:
    result = run_rule_engine("", UserPreferences(allergies=["egg"]))
    assert result.matched_allergens == []
    assert result.evidence == []
    assert result.has_ingredient_panel is False
