"""Loads the processed/*.csv tables once at startup and caches them in memory.

workflow.md SS0/SS7: the offline pipeline (notebook) already produced the cleaned
per-respondent tables; the API must never re-process the raw survey .xlsx files, it
only reads these small CSVs and derives/aggregates from them in memory.
"""
from __future__ import annotations

import pandas as pd

from .config import PROCESSED_DIR

_RAW: dict[str, pd.DataFrame] | None = None

# Z02 (29.390439, 79.455517) sits ~50m from Z01 (29.390786, 79.455892) -- a duplicate/erroneous
# site submission, not a distinct physical location (confirmed by the survey team: only 9 real
# sites were surveyed). Filtered here rather than hand-edited into the notebook's generated CSV,
# so the exclusion survives a re-run of processed/location_clean.csv from the raw exports.
EXCLUDED_ZONES = {"Z02"}


def load_raw_tables() -> dict[str, pd.DataFrame]:
    global _RAW
    if _RAW is not None:
        return _RAW
    location = pd.read_csv(PROCESSED_DIR / "location_clean.csv")
    location = location[~location["zone_id"].isin(EXCLUDED_ZONES)].reset_index(drop=True)
    _RAW = {
        "enterprise": pd.read_csv(PROCESSED_DIR / "enterprise_clean.csv"),
        "location": location,
        "tourist": pd.read_csv(PROCESSED_DIR / "tourist_clean.csv"),
        "residents": pd.read_csv(PROCESSED_DIR / "residents_clean.csv"),
        "workers": pd.read_csv(PROCESSED_DIR / "workers_clean.csv"),
    }
    return _RAW
