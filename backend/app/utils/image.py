"""Image validation and temp-file utilities. No persistence."""
from __future__ import annotations

import io
from contextlib import contextmanager
from typing import Iterator

from PIL import Image, UnidentifiedImageError

from app.core.errors import InvalidImageError, UploadTooLargeError


def validate_image_bytes(
    data: bytes,
    *,
    content_type: str | None,
    max_bytes: int,
    allowed_types: list[str],
) -> None:
    if not data:
        raise InvalidImageError("No image data received.")
    if len(data) > max_bytes:
        raise UploadTooLargeError(
            f"Image exceeds the maximum size of {max_bytes // (1024 * 1024)} MB."
        )
    if content_type and content_type.lower() not in {t.lower() for t in allowed_types}:
        raise InvalidImageError(
            f"Unsupported image type '{content_type}'. Allowed: {', '.join(allowed_types)}."
        )
    # Verify the bytes actually decode as an image. Pillow handles JPEG/PNG/WebP.
    # HEIC needs an extra plugin; if it fails to decode here, surface a clear error.
    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidImageError(
            "The uploaded file does not appear to be a readable image."
        ) from exc


@contextmanager
def open_image_for_processing(data: bytes) -> Iterator[Image.Image]:
    """Open the image in-memory for downstream OCR providers. Closes on exit."""
    img = Image.open(io.BytesIO(data))
    try:
        # Force load so the underlying buffer is realized while the bytes live
        img.load()
        yield img
    finally:
        img.close()


def estimate_quality_score(img: Image.Image) -> float:
    """Very lightweight image-quality heuristic. Returns 0.0-1.0."""
    try:
        w, h = img.size
    except Exception:
        return 0.5
    if w < 200 or h < 200:
        return 0.3
    if w < 600 or h < 600:
        return 0.7
    return 0.9
