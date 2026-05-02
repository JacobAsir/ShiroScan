"""Demo / sample endpoints — list built-in sample labels users can try
without uploading an image."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.response import DemoSample
from app.services.samples import SAMPLE_FIXTURES

router = APIRouter(tags=["demo"])


@router.get("/demo-samples", response_model=list[DemoSample])
async def list_demo_samples() -> list[DemoSample]:
    return [
        DemoSample(
            id=s.id,
            product_name=s.product_name,
            description_en=s.description_en,
            description_ja=s.description_ja,
            preview_text=s.preview_text,
        )
        for s in SAMPLE_FIXTURES
    ]
