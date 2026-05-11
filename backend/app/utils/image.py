"""Image validation and temp-file utilities. No persistence."""
from __future__ import annotations

import io
from contextlib import contextmanager
from typing import Iterator

from PIL import Image, UnidentifiedImageError

from app.core.errors import InvalidImageError, UploadTooLargeError

# Max dimension for images sent to Gemini Vision. Larger images are resized
# proportionally. 1024px is plenty for reading text on a food label and
# dramatically reduces base64 payload size (and thus API latency).
MAX_OCR_DIMENSION = 1024


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


def compress_for_ocr(data: bytes) -> tuple[bytes, str]:
    """Resize and compress image for OCR. Returns (jpeg_bytes, 'image/jpeg').

    - Resizes to max 1024px on longest side (preserving aspect ratio)
    - Converts to JPEG at quality 85
    - Typical 700KB PNG → ~80-120KB JPEG = 5-8x smaller base64 payload
    """
    img = Image.open(io.BytesIO(data))
    # Convert RGBA/P to RGB for JPEG
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Resize if larger than MAX_OCR_DIMENSION
    w, h = img.size
    if max(w, h) > MAX_OCR_DIMENSION:
        ratio = MAX_OCR_DIMENSION / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    # Compress to JPEG
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    buf.seek(0)
    return buf.read(), "image/jpeg"


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
