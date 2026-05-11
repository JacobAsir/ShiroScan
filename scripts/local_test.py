"""Quick local test: sends sample1.png to the running ShiroScan backend
and prints the key fields of the response so we can verify the pipeline works.

Usage:  python scripts/local_test.py
Requires the backend to be running on http://127.0.0.1:8080
"""
import json
import sys
import urllib.request
from pathlib import Path

BASE_URL = "http://127.0.0.1:8080"
SAMPLE_IMAGE = (
    Path(__file__).parent.parent
    / "artifacts" / "shiroscan" / "public" / "samples" / "sample1.png"
)

BOUNDARY = "ShiroScanLocalTestBoundary"


def build_multipart(image_path: Path) -> bytes:
    image_data = image_path.read_bytes()
    header = (
        f"--{BOUNDARY}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="{image_path.name}"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode()
    footer = f"\r\n--{BOUNDARY}--\r\n".encode()
    return header + image_data + footer


def safe(text: object, limit: int = 300) -> str:
    """Return a string safe to print in any terminal (escapes non-ASCII)."""
    return str(text)[:limit].encode("ascii", errors="backslashreplace").decode("ascii")


def main() -> None:
    # 1. Health check first
    print("=" * 60)
    print("ShiroScan Local Test")
    print("=" * 60)

    try:
        with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=5) as r:
            health = json.loads(r.read())
        print(f"[HEALTH]   {health}")
    except Exception as exc:
        print(f"[HEALTH]   FAILED — is the backend running? {exc}")
        sys.exit(1)

    # 2. Analyze sample image
    print(f"\n[SCAN]     Sending {SAMPLE_IMAGE.name} ({SAMPLE_IMAGE.stat().st_size // 1024} KB)...")
    body = build_multipart(SAMPLE_IMAGE)
    req = urllib.request.Request(
        f"{BASE_URL}/api/analyze",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={BOUNDARY}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        body_text = exc.read().decode(errors="replace")
        print(f"[ERROR]    HTTP {exc.code}: {body_text[:500]}")
        sys.exit(1)
    except Exception as exc:
        print(f"[ERROR]    {type(exc).__name__}: {exc}")
        sys.exit(1)

    # 3. Print results
    print("\n--- RESULT ---")
    print(f"  Status        : {safe(result.get('status'))}")
    print(f"  Product       : {safe(result.get('product_name'))}")
    print(f"  Mode          : {safe(result.get('processing_mode'))}")
    print(f"  Confidence    : {safe(result.get('confidence_score'))}")
    print(f"  Allergens     : {safe(result.get('matched_allergens'))}")
    print(f"  Diet conflicts: {safe(result.get('matched_diet_conflicts'))}")
    print(f"  Keywords      : {safe(result.get('extracted_keywords'))}")
    print(f"  Evidence items: {len(result.get('evidence', []))}")
    print(f"  Warnings      : {safe(result.get('warnings'))}")
    print(f"\n  Summary (EN)  : {safe(result.get('summary_en', ''), 300)}")
    print(f"  Summary (JA)  : {safe(result.get('summary_ja', ''), 300)}")

    if result.get("evidence"):
        print("\n--- EVIDENCE BREAKDOWN ---")
        for item in result["evidence"]:
            cat  = safe(item['category'], 10)
            text = safe(item['japanese_text'], 40)
            mean = safe(item['normalized_meaning'], 60)
            print(f"  [{cat:10s}] {text:40s} -> {mean}")

    print("\n[DONE] Pipeline working correctly." if result.get("status") else "\n[WARN] Got a result but status is missing.")


if __name__ == "__main__":
    main()
