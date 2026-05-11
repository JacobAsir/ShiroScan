"""Gemini-based OCR provider. Sends the image to Gemini Vision and returns the
raw extracted Japanese text. Raises OCRProviderError on failures so the
caller can handle the error appropriately.
"""
from __future__ import annotations

import base64
from typing import Any

import httpx

from app.core.errors import OCRProviderError
from app.core.logging import get_logger
from app.models.analysis import OCRResult
from app.services.ocr.base import OCRProvider

logger = get_logger(__name__)

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

OCR_PROMPT = (
    "You are reading a Japanese packaged-food label. Extract ALL visible text "
    "from the image, in Japanese, exactly as printed. Preserve line breaks. "
    "Do not translate. Do not add commentary. If you also see a product name "
    "in larger type, put it on the very first line. Return ONLY the extracted text."
)


class GeminiOCRProvider(OCRProvider):
    name = "gemini"

    def __init__(self, api_key: str, *, timeout_seconds: float = 20.0) -> None:
        self._api_key = api_key
        self._timeout = timeout_seconds

    async def extract(self, image_bytes: bytes, *, content_type: str | None) -> OCRResult:
        mime = content_type or "image/jpeg"
        body: dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": OCR_PROMPT},
                        {
                            "inline_data": {
                                "mime_type": mime,
                                "data": base64.b64encode(image_bytes).decode("ascii"),
                            }
                        },
                    ],
                }
            ],
            "generationConfig": {"temperature": 0.0, "maxOutputTokens": 2048},
        }
        params = {"key": self._api_key}
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(GEMINI_ENDPOINT, params=params, json=body)
            if resp.status_code >= 400:
                logger.warning(
                    "Gemini OCR returned %s: %s", resp.status_code, resp.text[:200]
                )
                raise OCRProviderError(f"Gemini OCR failed: HTTP {resp.status_code}")
            payload = resp.json()
        except httpx.HTTPError as exc:
            logger.warning("Gemini OCR request error: %s", exc)
            raise OCRProviderError(f"Gemini OCR transport error: {exc}") from exc

        try:
            text = payload["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            logger.warning("Gemini OCR returned unexpected payload shape")
            raise OCRProviderError("Gemini OCR returned an unexpected payload.") from exc

        text = (text or "").strip()
        first_line = text.split("\n", 1)[0].strip() if text else None
        return OCRResult(
            raw_text=text,
            confidence=0.85 if text else 0.1,
            provider=self.name,
            product_name_hint=first_line if first_line and len(first_line) <= 60 else None,
        )
