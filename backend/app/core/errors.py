"""Domain-specific error classes that map cleanly to HTTP responses."""
from __future__ import annotations


class ShiroScanError(Exception):
    """Base error for all ShiroScan service errors."""

    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        if code:
            self.code = code


class InvalidImageError(ShiroScanError):
    status_code = 400
    code = "invalid_image"


class UploadTooLargeError(ShiroScanError):
    status_code = 413
    code = "upload_too_large"


class OCRProviderError(ShiroScanError):
    status_code = 502
    code = "ocr_provider_error"


class LLMProviderError(ShiroScanError):
    status_code = 502
    code = "llm_provider_error"


class SampleNotFoundError(ShiroScanError):
    status_code = 404
    code = "sample_not_found"


class InvalidPreferencesError(ShiroScanError):
    status_code = 400
    code = "invalid_preferences"
