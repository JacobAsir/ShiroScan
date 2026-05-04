"""Analyze endpoint — image upload produces an analysis response."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import ValidationError

from app.api.deps import get_pipeline
from app.core.config import Settings, get_settings
from app.core.errors import InvalidPreferencesError
from app.core.logging import get_logger
from app.schemas.request import UserPreferences
from app.schemas.response import AnalysisResponse
from app.services.pipeline import AnalysisPipeline
from app.utils.image import validate_image_bytes

logger = get_logger(__name__)

router = APIRouter(tags=["analyze"])


def _parse_preferences(raw: str | None) -> UserPreferences:
    if not raw:
        return UserPreferences()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InvalidPreferencesError(
            "preferences must be a JSON object."
        ) from exc
    try:
        return UserPreferences.model_validate(data)
    except ValidationError as exc:
        raise InvalidPreferencesError(
            f"preferences failed validation: {exc.errors()}"
        ) from exc


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    image: UploadFile = File(...),
    preferences: str | None = Form(default=None),
    pipeline: AnalysisPipeline = Depends(get_pipeline),
    settings: Settings = Depends(get_settings),
) -> AnalysisResponse:
    prefs = _parse_preferences(preferences)
    image_bytes = await image.read()
    validate_image_bytes(
        image_bytes,
        content_type=image.content_type,
        max_bytes=settings.max_upload_bytes,
        allowed_types=settings.allowed_image_types,
    )
    logger.info(
        "analyze request: bytes=%d type=%s allergies=%d dietary=%d",
        len(image_bytes),
        image.content_type,
        len(prefs.allergies),
        len(prefs.dietary),
    )
    return await pipeline.run(
        image_bytes,
        content_type=image.content_type,
        preferences=prefs,
    )
