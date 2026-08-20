"""Loads the processed/*.csv tables once at startup and caches them in memory.

workflow.md SS0/SS7: the offline pipeline (notebook) already produced the cleaned
per-respondent tables; the API must never re-process the raw survey .xlsx files, it
only reads these small CSVs and derives/aggregates from them in memory.
"""
from __future__ import annotations

import pandas as pd

from .config import PROCESSED_DIR

_RAW: dict[str, pd.DataFrame] | None = None


def load_raw_tables() -> dict[str, pd.DataFrame]:
    global _RAW
    if _RAW is not None:
        return _RAW
    _RAW = {
        "enterprise": pd.read_csv(PROCESSED_DIR / "enterprise_clean.csv"),
        "location": pd.read_csv(PROCESSED_DIR / "location_clean.csv"),
        "tourist": pd.read_csv(PROCESSED_DIR / "tourist_clean.csv"),
        "residents": pd.read_csv(PROCESSED_DIR / "residents_clean.csv"),
        "workers": pd.read_csv(PROCESSED_DIR / "workers_clean.csv"),
    }
    return _RAW
