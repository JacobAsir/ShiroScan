"""FastAPI entry point for the ShiroScan backend.

Mounted at /api by the Replit reverse proxy. Internally we ALSO
prefix all routes with /api so direct access (uvicorn standalone)
keeps the same URLs.
"""
from __future__ import annotations

import os
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import analyze, demo, health
from app.core.config import get_settings
from app.core.errors import ShiroScanError
from app.core.logging import configure_logging, get_logger

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger("shiroscan")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info(
        "ShiroScan starting (env=%s, version=%s, max_upload_mb=%d)",
        settings.app_env,
        settings.version,
        settings.max_upload_mb,
    )
    yield
    logger.info("ShiroScan shutting down")


app = FastAPI(
    title="ShiroScan API",
    version=settings.version,
    description="Stateless Japanese food-label analysis service.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    request.state.request_id = rid
    response = await call_next(request)
    response.headers["x-request-id"] = rid
    return response


@app.exception_handler(ShiroScanError)
async def shiroscan_error_handler(request: Request, exc: ShiroScanError) -> JSONResponse:
    rid = getattr(request.state, "request_id", None)
    logger.warning(
        "ShiroScanError on %s: %s (code=%s, request_id=%s)",
        request.url.path,
        str(exc),
        exc.code,
        rid,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc), "code": exc.code, "request_id": rid},
    )


# All routes are mounted under /api so the Replit proxy path matches the
# in-app URLs (no path rewriting).
app.include_router(health.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    """Liveness root — useful when running uvicorn standalone."""
    return {"service": "shiroscan-api", "docs": "/docs", "health": "/api/health"}


def main() -> None:
    import uvicorn

    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_config=None,
        access_log=False,
    )


if __name__ == "__main__":
    main()
