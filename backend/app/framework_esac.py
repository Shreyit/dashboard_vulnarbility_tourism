"""A second, complementary vulnerability lens: Exposure / Sensitivity / Adaptive
Capacity (E-S-AC), the IPCC-style structure RESEARCH_BENCHMARKS.md SS4 (the Shimla-
district Himalayan tourism-vulnerability study) flagged as "a possible v2
restructuring... not adopted by default" -- now built alongside the OECD/JRC 6-pillar
TVI, not in place of it.

The formulas and weights below are transcribed exactly from
`Nainital_Tourism_Vulnerability_Derived_Variables.xlsx`'s README_Methodology/
Variable_Dictionary sheets. Several of that workbook's named sub-variables have no
isolated equivalent in this pipeline's `derive.py` and are substituted with the
nearest already-derived column instead -- each substitution is called out in the
docstring of the function that makes it, and again in
VARIABLES_AND_DATA_SOURCES.md SS4.2. This is a reimplementation using this project's
own available data, not a byte-identical port of the workbook.
"""
from __future__ import annotations

from functools import lru_cache

import pandas as pd

from . import indices
from .colfind import find_col
from .data_loader import load_raw_tables
from .mapping import yesno01

DISASTER_PREP_WEIGHTS = {"emergency_info": 0.45, "evac_info": 0.55}


@lru_cache
def _disaster_prep_by_zone() -> pd.Series:
    """1 - Z_Disaster_Information_Gap, per zone: 0.45 x (emergency-contact info
    displayed) + 0.55 x (evacuation info displayed), each row's weights renormalized
    over whichever of the two questions that zone actually answered."""
    df = load_raw_tables()["location"].set_index("zone_id")
    emergency = yesno01(df[find_col(df, "emergency contact information displayed")])
    evac = yesno01(df[find_col(df, "disaster/evacuation information displayed")])
    combined = pd.concat([emergency, evac], axis=1, keys=["emergency_info", "evac_info"])

    def weighted(row: pd.Series) -> float:
        vals = row.dropna()
        if vals.empty:
            return float("nan")
        w = sum(DISASTER_PREP_WEIGHTS[k] for k in vals.index)
        return float(sum(vals[k] * DISASTER_PREP_WEIGHTS[k] for k in vals.index) / w)

    return combined.apply(weighted, axis=1)


def _disaster_preparedness(zone_id: str | None) -> float | None:
    s = _disaster_prep_by_zone()
    v = s.mean(skipna=True) if zone_id is None else s.get(zone_id, float("nan"))
    return None if pd.isna(v) else float(v)


def _weighted(parts: list[tuple[float | None, float]]) -> float | None:
    """Weighted mean over whichever parts are present, weights renormalized to the
    available subset -- consistent with how every other composite in this project
    handles missing components (average over what's there, don't fabricate zeros)."""
    present = [(v, w) for v, w in parts if v is not None]
    if not present:
        return None
    total_w = sum(w for _, w in present)
    return sum(v * w for v, w in present) / total_w


def _mean_invert(vals: list[float | None]) -> float | None:
    present = [1 - v for v in vals if v is not None]
    return sum(present) / len(present) if present else None


def _peak_tourism_disruption(zone_id: str | None) -> float | None:
    """Substitutes for the workbook's Z_Peak_Tourism_Disruption (crowding, traffic,
    noise, prices, discomfort flags) with the same 4 residents.* components SCPI
    already uses -- same underlying concept, this project's own item bundle."""
    parts = ["crowding_avoidance", "travel_difficulty_peak", "price_inflation_perception", "noise_increase_perception"]
    vals = [indices.value_for("residents", col, zone_id)[0] for col in parts]
    vals = [v for v in vals if v is not None]
    return sum(vals) / len(vals) if vals else None


def _exposure(zone_id: str | None) -> float | None:
    seasonal, _ = indices.value_for("workers", "months_without_work_share", zone_id)
    # Substitutes for the workbook's ratio (tourism-linked earners / household size)
    # with this pipeline's binary tourism-primary-livelihood flag -- coarser (yes/no
    # vs. a continuous share) but the same underlying concept.
    tourism_dep, _ = indices.value_for("residents", "tourism_dependency", zone_id)
    disruption = _peak_tourism_disruption(zone_id)
    return _weighted([(seasonal, 0.35), (tourism_dep, 0.35), (disruption, 0.30)])


def _sensitivity(zone_id: str | None) -> float | None:
    water_operational, _ = indices.value_for("enterprise", "water_constraint_stress", zone_id)
    # Substitutes for the workbook's 3-tier municipal/spring/tanker water-source
    # scale with this pipeline's binary tanker-dependency flag -- narrower, same
    # underlying concept (reliance on tanker water as the least secure source).
    water_source, _ = indices.value_for("enterprise", "tanker_dependency", zone_id)
    resident_water, _ = indices.value_for("residents", "water_hours_deficit", zone_id)
    # Substitutes for the workbook's broader resident-sanitation-stress measure with
    # this pipeline's peak-season sewage-overflow flag.
    resident_sanitation, _ = indices.value_for("residents", "sewage_overflow_peak", zone_id)
    # Same 3-tier none/septic/municipal/treatment categories as the workbook's
    # Z_Sewage_Risk, but this pipeline's own 1/0.5/0 weighting rather than its 1/0.35/0.15/0.05.
    sewage_risk, _ = indices.value_for("enterprise", "poor_sewage_adequacy", zone_id)
    return _weighted(
        [
            (water_operational, 0.30),
            (water_source, 0.20),
            (resident_water, 0.20),
            (resident_sanitation, 0.15),
            (sewage_risk, 0.15),
        ]
    )


def _adaptive_capacity(zone_id: str | None) -> float | None:
    # Substitutes for the workbook's 4-component Z_Enterprise_Adaptation (renewable +
    # rainwater + reuse + government support) with this pipeline's 2 available
    # components (rainwater harvesting, off-season government support) -- narrower.
    no_rainwater_ent, _ = indices.value_for("enterprise", "no_rainwater_harvesting", zone_id)
    no_support, _ = indices.value_for("enterprise", "no_offseason_gov_support", zone_id)
    enterprise_adaptation = _mean_invert([no_rainwater_ent, no_support])
    # Substitutes for the workbook's Z_Resident_Adaptation with this pipeline's sole
    # available component (rainwater harvesting).
    no_rainwater_res, _ = indices.value_for("residents", "no_rainwater_harvesting", zone_id)
    resident_adaptation = None if no_rainwater_res is None else 1 - no_rainwater_res
    disaster_prep = _disaster_preparedness(zone_id)
    return _weighted([(enterprise_adaptation, 0.55), (resident_adaptation, 0.25), (disaster_prep, 0.20)])


def _band(composite: float) -> str:
    if composite <= 33.33:
        return "Lower"
    if composite <= 66.67:
        return "Moderate"
    return "Higher"


def compute_esac(zone_id: str | None = None) -> dict:
    exposure = _exposure(zone_id)
    sensitivity = _sensitivity(zone_id)
    adaptive_capacity = _adaptive_capacity(zone_id)

    composite = None
    if exposure is not None and sensitivity is not None and adaptive_capacity is not None:
        composite = round(100 * (exposure + sensitivity + (1 - adaptive_capacity)) / 3, 2)

    return {
        "exposure": round(exposure, 4) if exposure is not None else None,
        "sensitivity": round(sensitivity, 4) if sensitivity is not None else None,
        "adaptive_capacity": round(adaptive_capacity, 4) if adaptive_capacity is not None else None,
        "composite": composite,
        "band": _band(composite) if composite is not None else None,
    }


def compute_esac_zones() -> list[dict]:
    zones = []
    for z in indices.list_zones():
        result = compute_esac(z["zone_id"])
        zones.append({"zone_id": z["zone_id"], "composite": result["composite"], "band": result["band"]})
    return zones


def compute_esac_full() -> dict:
    town = compute_esac(None)
    town["zones"] = compute_esac_zones()
    return town
