"""Mock OCR provider — returns a deterministic fixture so the app is fully demoable
without any API keys. Selection is biased by image size so different uploads can
produce different fixtures, but real demo flow uses /analyze-demo with a sample id.
"""
from __future__ import annotations

import hashlib

from app.models.analysis import OCRResult
from app.services.ocr.base import OCRProvider
from app.services.samples import SAMPLE_FIXTURES


class MockOCRProvider(OCRProvider):
    name = "mock"

    async def extract(self, image_bytes: bytes, *, content_type: str | None) -> OCRResult:
        # Pick a fixture deterministically from the image bytes so identical uploads
        # return identical results — useful for testing.
        digest = hashlib.sha256(image_bytes).hexdigest()
        idx = int(digest, 16) % len(SAMPLE_FIXTURES)
        sample = SAMPLE_FIXTURES[idx]
        return OCRResult(
            raw_text=sample.ocr_text,
            confidence=0.78,
            provider=self.name,
            product_name_hint=sample.product_name,
        )
