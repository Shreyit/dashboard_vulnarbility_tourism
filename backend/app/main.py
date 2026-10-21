from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import chat, indices_router, insights_router, ml_router, stress_test_router, variables, zones

app = FastAPI(
    title="Nainital Tourism Vulnerability Dashboard API",
    description="Serves the Tourism Vulnerability Index, per-zone breakdowns, the "
    "peak-season stress-test simulator, and PahadiBot chat -- see workflow.md.",
    version="0.1.0",
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(zones.router)
app.include_router(indices_router.router)
app.include_router(insights_router.router)
app.include_router(variables.router)
app.include_router(stress_test_router.router)
app.include_router(chat.router)
app.include_router(ml_router.router)


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
