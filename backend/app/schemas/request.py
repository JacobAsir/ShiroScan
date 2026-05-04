"""Request schemas for the ShiroScan API."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

AllergenKey = Literal[
    "egg",
    "milk",
    "wheat",
    "shrimp",
    "crab",
    "peanuts",
    "buckwheat",
    "walnuts",
    "soy",
    "sesame",
]

DietaryKey = Literal["vegetarian", "halal", "no_pork", "lactose_free"]
UILanguage = Literal["en", "ja"]


class UserPreferences(BaseModel):
    """User-provided session-only preferences. Never persisted."""

    allergies: list[AllergenKey] = Field(default_factory=list)
    dietary: list[DietaryKey] = Field(default_factory=list)
    custom_allergies: list[str] = Field(
        default_factory=list,
        description="Free-text allergy terms (Japanese or English) beyond the preset list.",
    )
    custom_dietary: list[str] = Field(
        default_factory=list,
        description="Free-text dietary restriction terms beyond the preset list.",
    )
    language: UILanguage = "en"

    model_config = {"extra": "ignore"}
