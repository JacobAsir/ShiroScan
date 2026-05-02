"""OCR provider abstraction."""
from __future__ import annotations

import abc

from app.models.analysis import OCRResult


class OCRProvider(abc.ABC):
    """Abstract base for any OCR backend."""

    name: str = "base"

    @abc.abstractmethod
    async def extract(self, image_bytes: bytes, *, content_type: str | None) -> OCRResult:
        """Extract text from an image. Must be safe to call concurrently."""
        raise NotImplementedError
