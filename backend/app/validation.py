"""A data-quality gate for the processed/*.csv tables data_loader.py reads at
startup. Plain pandas/python checks, not a new dependency (pandera would cover
the same ground but adds a runtime dependency for a dataset this small) --
catches a malformed processed CSV (wrong survey team export, a column rename
upstream, a corrupted re-run of the cleaning notebook) at load time with a
specific message, instead of a `KeyError` three call-frames deep inside
`derive.py` the first time someone happens to touch that column.
"""
from __future__ import annotations

import pandas as pd

# Nainital town + surrounding surveyed area, generous margin around the 9 real
# zone coordinates (29.374-29.394 N, 79.451-79.465 E) -- wide enough to allow
# for GPS noise, tight enough to catch a genuinely wrong coordinate (a
# transposed lat/lon, a stray 0,0, a different town entirely).
LAT_RANGE = (29.30, 29.45)
LON_RANGE = (79.40, 79.55)

# The 10 raw zone codes surveyed (Z02 is a known duplicate site, excluded later
# in data_loader.py -- still a *valid* code here, just filtered downstream).
KNOWN_ZONES = {f"Z{i:02d}" for i in range(1, 11)}


class DataValidationError(ValueError):
    """A processed CSV failed a structural or range check at load time."""


def _require_columns(df: pd.DataFrame, columns: list[str], table: str) -> None:
    missing = [c for c in columns if c not in df.columns]
    if missing:
        raise DataValidationError(f"{table}: missing required column(s) {missing}")


def _require_nonempty(df: pd.DataFrame, table: str) -> None:
    if len(df) == 0:
        raise DataValidationError(f"{table}: loaded 0 rows -- expected a non-empty survey table")


def _check_coords(df: pd.DataFrame, table: str) -> None:
    lat, lon = df["latitude"].dropna(), df["longitude"].dropna()
    bad_lat = ~lat.between(*LAT_RANGE)
    bad_lon = ~lon.between(*LON_RANGE)
    if bad_lat.any():
        raise DataValidationError(
            f"{table}: {int(bad_lat.sum())} latitude value(s) outside the expected "
            f"Nainital range {LAT_RANGE}, e.g. {lat[bad_lat].iloc[0]}"
        )
    if bad_lon.any():
        raise DataValidationError(
            f"{table}: {int(bad_lon.sum())} longitude value(s) outside the expected "
            f"Nainital range {LON_RANGE}, e.g. {lon[bad_lon].iloc[0]}"
        )


def _check_zone_ids(df: pd.DataFrame, table: str) -> None:
    zone_ids = set(df["zone_id"].dropna().unique())
    unknown = zone_ids - KNOWN_ZONES
    if unknown:
        raise DataValidationError(f"{table}: unknown zone_id value(s) {sorted(unknown)}, expected a subset of {sorted(KNOWN_ZONES)}")


def validate_location(df: pd.DataFrame) -> None:
    _require_nonempty(df, "location")
    _require_columns(df, ["zone_id", "latitude", "longitude"], "location")
    _check_zone_ids(df, "location")
    _check_coords(df, "location")


def validate_residents(df: pd.DataFrame) -> None:
    _require_nonempty(df, "residents")
    _require_columns(df, ["zone_id", "latitude", "longitude"], "residents")
    _check_zone_ids(df, "residents")
    _check_coords(df, "residents")


def validate_enterprise(df: pd.DataFrame) -> None:
    _require_nonempty(df, "enterprise")
    _require_columns(df, ["zone_id", "latitude", "longitude"], "enterprise")
    _check_zone_ids(df, "enterprise")
    _check_coords(df, "enterprise")


def validate_tourist(df: pd.DataFrame) -> None:
    _require_nonempty(df, "tourist")


def validate_workers(df: pd.DataFrame) -> None:
    _require_nonempty(df, "workers")
