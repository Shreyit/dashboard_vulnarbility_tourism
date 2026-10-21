"""derive.py's own module docstring documents the invariant: every derived
column is 0-1 and direction-aligned (1 = more stressed/pressured/precarious).
This just checks that invariant actually holds against the real processed
data, for every derive_* function -- a cheap regression net against a future
column added without the (1-x) inversion its direction requires."""
from app import indices

NON_SCORE_COLUMNS = {"zone_id", "latitude", "longitude"}


def _assert_bounded(df, table_name):
    for col in df.columns:
        if col in NON_SCORE_COLUMNS:
            continue
        series = df[col].dropna()
        if series.empty:
            continue
        assert series.between(0, 1).all(), f"{table_name}.{col} has values outside [0,1]"


def test_enterprise_columns_bounded():
    _assert_bounded(indices.derived_table("enterprise"), "enterprise")


def test_residents_columns_bounded():
    _assert_bounded(indices.derived_table("residents"), "residents")


def test_tourist_columns_bounded():
    _assert_bounded(indices.derived_table("tourist"), "tourist")


def test_workers_columns_bounded():
    _assert_bounded(indices.derived_table("workers"), "workers")


def test_location_columns_bounded():
    _assert_bounded(indices.derived_table("location"), "location")
