# ShiroScan Backend

FastAPI service that powers the ShiroScan label-analysis pipeline.

## Run locally

```bash
pip install -r requirements.txt
PORT=8080 uvicorn app.main:app --host 0.0.0.0 --port 8080
```

Health: `GET /api/health` — returns active OCR + LLM provider names.

## Endpoints

| Method | Path                | Purpose                                  |
| ------ | ------------------- | ---------------------------------------- |
| GET    | `/api/health`       | Service + provider status                |
| GET    | `/api/demo-samples` | Built-in sample labels for demo mode     |
| POST   | `/api/analyze`      | Analyze an uploaded image (multipart)    |
| POST   | `/api/analyze-demo` | Run analysis against a built-in sample   |

## Pipeline order (deterministic-first)

`image -> validate -> OCR (Gemini | Mock) -> normalize -> rule engine -> decision -> LLM summary (Groq | template)`

The rule engine runs BEFORE the LLM. The LLM only explains what the rules
already found; it cannot override the decision.

## Environment

See `.env.example`. **No keys are required** — the service runs in mock mode
out of the box and is fully demoable with the built-in samples.

## Tests

```bash
pytest -q
```
