"""Sub-index + TVI computation (VARIABLES_AND_DATA_SOURCES.md SS4, workflow.md SS5).

Builds the derived tables once (module-level cache) and exposes:
- `compute_subindex(theme, zone_id=None)` -> (0-1 score, per-component detail list)
- `compute_tvi(zone_id=None)` -> full IndexBundle-shaped dict
- `list_zones()` -> the 10 Location zones with coordinates

All sub-indices are stored/returned in their natural direction from
VARIABLES_AND_DATA_SOURCES.md SS4 (WSI/WSPI/EDPI/SCPI: higher = worse; IAI/VEI: higher
= better). Only the final TVI combination inverts IAI/VEI.
"""
from __future__ import annotations

from functools import lru_cache

import pandas as pd

from .config import get_weights_config
from .data_loader import load_raw_tables
from .derive import derive_enterprise, derive_location, derive_residents, derive_tourist, derive_workers

# (component_name, survey, column) -- survey/column must exist in the matching derive_* output.
THEME_COMPONENTS: dict[str, list[tuple[str, str, str]]] = {
    "wsi": [
        ("enterprise_water_constraint_stress", "enterprise", "water_constraint_stress"),
        ("enterprise_tanker_dependency", "enterprise", "tanker_dependency"),
        ("enterprise_no_rainwater_harvesting", "enterprise", "no_rainwater_harvesting"),
        ("enterprise_peak_offpeak_cost_pressure", "enterprise", "peak_offpeak_cost_pressure"),
        ("residents_water_hours_deficit", "residents", "water_hours_deficit"),
        ("residents_tanker_dependency", "residents", "tanker_dependency"),
        ("residents_bought_tanker_water", "residents", "bought_tanker_water"),
        ("residents_water_deprioritized_vs_hotels", "residents", "water_deprioritized_vs_hotels"),
        ("residents_water_trend_worsened", "residents", "water_trend_worsened"),
        ("residents_no_rainwater_harvesting", "residents", "no_rainwater_harvesting"),
    ],
    "wspi": [
        ("enterprise_poor_waste_practice", "enterprise", "poor_waste_practice"),
        ("enterprise_poor_sewage_adequacy", "enterprise", "poor_sewage_adequacy"),
        ("residents_poor_sewage_adequacy", "residents", "poor_sewage_adequacy"),
        ("residents_sewage_overflow_peak", "residents", "sewage_overflow_peak"),
        ("location_low_dustbin_density", "location", "zone_dustbin_density_inv"),
        ("location_low_toilet_per_capita", "location", "zone_toilet_per_capita_inv"),
        ("tourist_dustbin_inadequacy_perception", "tourist", "dustbin_inadequacy_perception"),
        ("tourist_low_cleanliness_rating", "tourist", "cleanliness_rating_inv"),
    ],
    "iai": [
        ("location_infra_adequacy", "location", "infra_adequacy"),
        ("location_parking_supply", "location", "parking_supply"),
        ("location_street_light_density", "location", "street_light_density"),
        ("location_toilet_provision", "location", "toilet_provision"),
        ("location_soap_water_available", "location", "soap_water_available"),
        ("location_emergency_response_speed", "location", "emergency_response_speed"),
        ("tourist_ease_of_navigation", "tourist", "ease_of_navigation"),
        ("tourist_signage_sufficiency", "tourist", "signage_sufficiency"),
    ],
    "edpi": [
        ("workers_tourism_income_dependency", "workers", "tourism_income_dependency"),
        ("workers_months_without_work_share", "workers", "months_without_work_share"),
        ("workers_no_insurance", "workers", "no_insurance"),
        ("residents_tourism_dependency", "residents", "tourism_dependency"),
        ("residents_no_other_income_source", "residents", "no_other_income_source"),
        ("enterprise_non_local_employment_share", "enterprise", "non_local_employment_share"),
        ("enterprise_no_offseason_gov_support", "enterprise", "no_offseason_gov_support"),
    ],
    "scpi": [
        ("residents_crowding_avoidance", "residents", "crowding_avoidance"),
        ("residents_travel_difficulty_peak", "residents", "travel_difficulty_peak"),
        ("residents_price_inflation_perception", "residents", "price_inflation_perception"),
        ("residents_noise_increase_perception", "residents", "noise_increase_perception"),
        ("residents_environment_trend_worsened", "residents", "environment_trend_worsened"),
        ("residents_tourism_no_net_benefit", "residents", "tourism_no_net_benefit"),
        ("enterprise_child_labour_observed", "enterprise", "child_labour_observed"),
    ],
    "vei": [
        ("tourist_overall_satisfaction", "tourist", "overall_satisfaction"),
        ("tourist_cleanliness_rating", "tourist", "cleanliness_rating"),
        ("tourist_ease_of_navigation", "tourist", "ease_of_navigation"),
        ("tourist_signage_sufficiency", "tourist", "signage_sufficiency"),
    ],
}

# Sub-indices that are "higher = better" in their natural form and get inverted (1-x)
# only when combined into the TVI (VARIABLES_AND_DATA_SOURCES.md SS4).
INVERT_FOR_TVI = {"iai", "vei"}

THEME_LABELS = {
    "wsi": "Water Stress Index",
    "wspi": "Waste & Sanitation Pressure Index",
    "iai": "Infrastructure Adequacy Index",
    "edpi": "Economic Dependency & Precarity Index",
    "scpi": "Socio-Cultural Pressure Index",
    "vei": "Visitor Experience Index",
}


@lru_cache
def _derived_tables() -> dict[str, pd.DataFrame]:
    raw = load_raw_tables()
    location = derive_location(raw["location"]).set_index("zone_id", drop=False)
    # zone-level "lower is worse" components, pre-inverted so every THEME_COMPONENTS
    # entry can stay in the shared "1 = pressure" convention.
    location["zone_dustbin_density_inv"] = 1 - location["zone_dustbin_density"]
    location["zone_toilet_per_capita_inv"] = 1 - location["zone_toilet_per_capita"]

    tourist = derive_tourist(raw["tourist"])
    tourist["cleanliness_rating_inv"] = 1 - tourist["cleanliness_rating"]

    return {
        "enterprise": derive_enterprise(raw["enterprise"]),
        "location": location,
        "residents": derive_residents(raw["residents"]),
        "tourist": tourist,
        "workers": derive_workers(raw["workers"]),
    }


def derived_table(survey: str) -> pd.DataFrame:
    """The full per-respondent (or per-zone, for `location`) derived table for one
    survey. Public: resident_attitudes.py needs per-respondent rows, not just the
    town/zone means `town_value`/`zone_value` give."""
    return _derived_tables()[survey]


def list_zones() -> list[dict]:
    loc = _derived_tables()["location"]
    return [
        {"zone_id": zid, "latitude": row["latitude"], "longitude": row["longitude"]}
        for zid, row in loc.iterrows()
    ]


def town_value(survey: str, col: str) -> float | None:
    """Town-wide mean of one derived column. Public: also used by insights.py to
    build the stakeholder pressure matrix and the seasonality/host-visitor indicators."""
    s = _derived_tables()[survey][col]
    v = s.mean(skipna=True)
    return None if pd.isna(v) else float(v)


def zone_value(survey: str, col: str, zone_id: str) -> float | None:
    """Zone-level mean of one derived column, or None if this survey has no tie
    to that zone (Tourist/Workers aren't GPS-tagged at all; Location/Enterprise/
    Residents fall back to None if that specific zone has no matching rows)."""
    df = _derived_tables()[survey]
    if survey == "location":
        if zone_id not in df.index:
            return None
        v = df.loc[zone_id, col]
        return None if pd.isna(v) else float(v)
    if "zone_id" not in df.columns or df["zone_id"].isna().all():
        return None  # survey isn't GPS-tagged (Tourist/Workers) -- no zone tie at all
    sub = df.loc[df["zone_id"] == zone_id, col]
    if sub.notna().sum() == 0:
        return None
    return float(sub.mean(skipna=True))


def value_for(survey: str, col: str, zone_id: str | None = None) -> tuple[float | None, bool]:
    """`(value, is_town_wide_proxy)` for one derived column -- the shared zone-or-
    town-wide-fallback lookup every composite (TVI, insights, E-S-AC framework)
    uses. Public: also used by framework_esac.py."""
    town_val = town_value(survey, col)
    if zone_id is None:
        return town_val, False
    zv = zone_value(survey, col, zone_id)
    if zv is not None:
        return zv, False
    return town_val, True  # fall back to town-wide (no zone tie / no data)


def compute_subindex(theme: str, zone_id: str | None = None) -> tuple[float | None, list[dict]]:
    detail = []
    values = []
    for name, survey, col in THEME_COMPONENTS[theme]:
        val, is_proxy = value_for(survey, col, zone_id)
        if val is not None:
            values.append(val)
            detail.append({"component": name, "value": round(val, 4), "town_wide_proxy": is_proxy})
    score = sum(values) / len(values) if values else None
    return score, detail


def compute_tvi(zone_id: str | None = None) -> dict:
    weights_cfg = get_weights_config()["tvi_weights"]
    sub_scores: dict[str, float | None] = {}
    details: dict[str, list[dict]] = {}
    for theme in THEME_COMPONENTS:
        score, detail = compute_subindex(theme, zone_id)
        sub_scores[theme] = score
        details[theme] = detail

    weighted_sum = 0.0
    weight_total = 0.0
    for theme, score in sub_scores.items():
        if score is None:
            continue
        w = weights_cfg.get(theme, 1.0)
        value = (1 - score) if theme in INVERT_FOR_TVI else score
        weighted_sum += w * value
        weight_total += w
    tvi = round((weighted_sum / weight_total) * 100, 2) if weight_total > 0 else None

    return {
        "zone_id": zone_id,
        "tvi": tvi,
        "sub_indices": {k: (round(v, 4) if v is not None else None) for k, v in sub_scores.items()},
        "details": details,
    }
