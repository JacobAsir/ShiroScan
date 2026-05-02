"""Regression: every supported allergen key must drive the pipeline to AVOID
when the user has it selected and the label contains a matching keyword.
This guards against silent allergen-coverage drift between
ALLERGEN_RULES, the schema literal, and the frontend constants.
"""
from __future__ import annotations

from typing import get_args

import pytest

from app.models.analysis import OCRResult
from app.schemas.request import AllergenKey, UserPreferences
from app.services.decision_engine import decide
from app.services.rule_engine import ALLERGEN_RULES, run_rule_engine
from app.utils.japanese import normalize_text


ALL_ALLERGEN_KEYS: list[str] = list(get_args(AllergenKey))


def test_rule_engine_covers_every_schema_allergen() -> None:
    rule_keys = {r.key for r in ALLERGEN_RULES}
    schema_keys = set(ALL_ALLERGEN_KEYS)
    assert rule_keys == schema_keys, (
        f"Allergen schema/rule drift. Schema-only={schema_keys - rule_keys}, "
        f"Rule-only={rule_keys - schema_keys}"
    )


@pytest.mark.parametrize("rule", ALLERGEN_RULES, ids=[r.key for r in ALLERGEN_RULES])
def test_each_allergen_drives_avoid_when_selected(rule) -> None:
    label = f"原材料名：水、{rule.keywords[0]}、食塩\nアレルギー物質：{rule.keywords[0]}"
    text = normalize_text(label)
    prefs = UserPreferences(allergies=[rule.key])

    rules = run_rule_engine(text, prefs)
    assert rule.key in rules.matched_allergens, (
        f"{rule.key} not detected from keyword {rule.keywords[0]!r}"
    )

    decision = decide(
        OCRResult(raw_text=label, confidence=0.85, provider="mock"), rules
    )
    assert decision.status == "avoid", (
        f"Expected AVOID for {rule.key}, got {decision.status}"
    )
