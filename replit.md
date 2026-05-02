# ShiroScan

A stateless full-stack web app for scanning Japanese packaged-food labels and returning Safe / Caution / Avoid verdicts with bilingual EN/JA explanations and Japanese-source evidence on every result.

## Stack

- **Frontend (`artifacts/shiroscan`)** — React 18 + Vite + TypeScript + Tailwind + shadcn/ui + wouter, mobile-first.
- **Backend (`backend/`)** — FastAPI + Pydantic v2 + Pillow + httpx (Python 3.11). Mounted at `/api` via the existing `artifacts/api-server` artifact slot — its `artifact.toml` runs `uvicorn app.main:app --app-dir ../../backend`.
- **OCR providers** — Gemini Vision OR deterministic mock (built-in samples). Provider abstraction in `backend/app/services/ocr/`.
- **LLM providers** — Groq Cloud OR deterministic template summarizer. Provider abstraction in `backend/app/services/llm/`.
- **No persistence** — no DB, no auth, no image storage.

## Pipeline

`image → validate → OCR (Gemini | Mock) → normalize JP text → rule engine → decision engine → LLM summary (Groq | template) → response`

Decisions are deterministic. The LLM only explains what the rule engine already found; it cannot override the verdict.

## Endpoints (all under `/api`)

- `GET /api/health` — service + provider status
- `GET /api/demo-samples` — list 5 built-in sample labels
- `POST /api/analyze` — multipart: `image=<file>`, `preferences=<json>`
- `POST /api/analyze-demo` — multipart: `sample_id=<id>`, `preferences=<json>`

## Frontend pages (wouter)

- `/` Landing (3-step explainer + CTA)
- `/scan` Preferences + upload + demo picker
- `/result` Status badge, evidence, bilingual summaries, raw OCR
- `/about` How it works + privacy

## Configuration (all optional)

`GEMINI_API_KEY`, `GROQ_API_KEY`, `OCR_PROVIDER`, `LLM_PROVIDER`, `MAX_UPLOAD_MB`, `CORS_ALLOWED_ORIGINS`. With no keys set, mock mode runs end-to-end and the app is fully demoable.

## Workflows

- `artifacts/api-server: ShiroScan API` — runs uvicorn on port 8080
- `artifacts/shiroscan: web` — Vite dev server on port 19278
- `artifacts/mockup-sandbox: Component Preview Server` — unrelated, retained from template

## Tests

```bash
cd backend && pytest -q
```

## Recent changes

- 2026-05-02: Initial build. FastAPI backend with rule engine + decision engine + Gemini/Groq providers + 18 unit tests passing. React frontend built by design subagent (paper/ink/vermilion palette, bilingual). API artifact repurposed from Express scaffold to uvicorn. Docker + docker-compose for local. No DB.
