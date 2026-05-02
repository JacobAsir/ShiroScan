# ShiroScan

A stateless full-stack web app that scans Japanese packaged-food labels and tells you whether they're **Safe**, **Caution**, or **Avoid** for your allergies and dietary preferences — with bilingual EN/JA explanations and the original Japanese evidence highlighted on every result.

> Mock-mode by default. Drop in a Gemini and/or Groq key to enable real OCR and natural-language explanations.

## Stack

- **Frontend** — React 18 + Vite + TypeScript + Tailwind + shadcn/ui + wouter (mobile-first)
- **Backend** — FastAPI + Pydantic v2 + Pillow + httpx (Python 3.11)
- **OCR providers** — Gemini Vision OR a deterministic mock (built-in samples)
- **LLM providers** — Groq Cloud OR a deterministic template summarizer
- **Persistence** — none (no DB, no auth, no image storage)

## Run with Replit workflows

The two artifacts that ship the app:

- `artifacts/api-server` — runs `uvicorn app.main:app` against `backend/` on port 8080, mounted at `/api`.
- `artifacts/shiroscan` — Vite dev server for the frontend, mounted at `/`.

Both are wired into Replit workflows. Hit the preview pane and go.

## Run locally with Docker

```bash
docker compose up --build
# → frontend on http://localhost:5173
# → api      on http://localhost:8080/api/health
```

## Configuration

Optional. With no keys set, ShiroScan runs in mock mode and is fully demoable.

| Env var           | Default | Purpose                                          |
| ----------------- | ------- | ------------------------------------------------ |
| `GEMINI_API_KEY`  | —       | Enables real OCR via Gemini Vision               |
| `GROQ_API_KEY`    | —       | Enables natural-language summaries via Groq      |
| `OCR_PROVIDER`    | `auto`  | `auto` \| `gemini` \| `mock`                     |
| `LLM_PROVIDER`    | `auto`  | `auto` \| `groq` \| `template`                   |
| `MAX_UPLOAD_MB`   | `10`    | Reject uploads larger than this                  |
| `CORS_ALLOWED_ORIGINS` | `*` | Comma-separated list                          |

`auto` uses a real provider when its key is set, falling back to mock/template otherwise. Provider failures at request time also fall back gracefully.

## Pipeline

```
image → validate → OCR → normalize JP text → rule engine → decision engine → LLM summary → response
```

Decisions are made by deterministic rules (allergen keyword scan, "を含む" caution patterns, dietary-conflict scan). The LLM only **explains** what the rule engine already found — it cannot change the verdict. Every result carries the Japanese source text it was based on.

## API

| Method | Path                | Body                                       |
| ------ | ------------------- | ------------------------------------------ |
| GET    | `/api/health`       | —                                          |
| GET    | `/api/demo-samples` | —                                          |
| POST   | `/api/analyze`      | multipart: `image=<file>`, `preferences=<json>` |
| POST   | `/api/analyze-demo` | multipart: `sample_id=<id>`, `preferences=<json>` |

`preferences` JSON shape:

```json
{
  "allergies": ["egg", "milk", "wheat", "shrimp", "crab", "peanuts", "buckwheat", "walnuts", "soy", "sesame"],
  "dietary":   ["vegetarian", "halal", "no_pork", "lactose_free"],
  "language":  "en"
}
```

## Tests

```bash
cd backend && pytest -q
```

## Disclaimer

Assistive information only. Not medical advice. Always confirm with the printed label before consuming.
