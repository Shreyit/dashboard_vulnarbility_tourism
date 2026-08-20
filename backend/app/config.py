from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
PROCESSED_DIR = REPO_ROOT / "processed"
WEIGHTS_PATH = BACKEND_DIR / "app" / "weights.json"


class Settings(BaseSettings):
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"

    model_config = {"env_prefix": "DASHBOARD_", "env_file": str(REPO_ROOT / ".env")}


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_weights_config() -> dict:
    with open(WEIGHTS_PATH) as f:
        return json.load(f)


# Peak-season road-capacity anchor (RESEARCH_BENCHMARKS.md SS1.1): road capacity ~3,000
# vehicles; actual peak-season inflow 3,000-4,000/day (~1.0-1.3x); peak summer weekends
# up to ~50,000 vehicles (~16.7x). Shown to the frontend so the stress-test slider reads
# against a real anchor instead of an arbitrary 0-100% scale.
FOOTFALL_ANCHORS = {
    "road_capacity_vehicles": 3000,
    "baseline_peak_vehicles_low": 3000,
    "baseline_peak_vehicles_high": 4000,
    "extreme_weekend_vehicles": 50000,
    "presets": [
        {"label": "Current peak", "multiplier": 1.0},
        {"label": "+25%", "multiplier": 1.25},
        {"label": "+50%", "multiplier": 1.5},
        {"label": "Extreme weekend (~16.7x)", "multiplier": 16.7},
    ],
}

SPHERE_MAX_USERS_PER_TOILET = 20
