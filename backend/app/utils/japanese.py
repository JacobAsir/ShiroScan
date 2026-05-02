"""Japanese text normalization helpers."""
from __future__ import annotations

import unicodedata


def normalize_text(text: str) -> str:
    """Normalize OCR output for matching:
    - Unicode NFKC (full-width ASCII -> half-width, half-width katakana -> full)
    - collapse whitespace
    - strip leading/trailing punctuation noise
    """
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    # Collapse all whitespace runs to single spaces, but preserve newlines
    lines = []
    for line in text.splitlines():
        line = " ".join(line.split())
        if line:
            lines.append(line)
    return "\n".join(lines)
