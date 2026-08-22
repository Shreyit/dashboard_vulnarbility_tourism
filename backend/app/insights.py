"""Cross-cutting composites built on top of the 6 pillar sub-indices in `indices.py`.

Every function here is town-wide only (no zone breakdown -- Workers/Tourist aren't
GPS-tagged, so a zone-level version would be inconsistent across pillars) and reuses
already-computed, already direction-aligned values -- no new raw aggregation beyond
what `indices.py`'s `THEME_COMPONENTS`/`derive_*` already produce. Formulas, citations,
and normalization are documented in VARIABLES_AND_DATA_SOURCES.md's "Dashboard insights"
section and RESEARCH_BENCHMARKS.md SS2.3/SS2.6 -- keep this module and those docs in sync.
"""
from __future__ import annotations

from . import indices

STAKEHOLDER_SURVEYS = ["enterprise", "residents", "workers", "tourist"]

# ---------------------------------------------------------------------------
# Sustainability triad (Coxcomb): the 6 pillars regrouped into the standard
# Triple Bottom Line (Elkington, 1997 -- RESEARCH_BENCHMARKS.md SS2.6), unified
# to one "higher = more stressed" direction, 0-100 like the TVI itself.
# ---------------------------------------------------------------------------


def _town_subindex_scores() -> dict[str, float | None]:
    return {theme: indices.compute_subindex(theme, None)[0] for theme in indices.THEME_COMPONENTS}


def compute_sustainability_triad() -> dict[str, float | None]:
    scores = _town_subindex_scores()

    def inv(v: float | None) -> float | None:
        return None if v is None else 1 - v

    groups: dict[str, list[float | None]] = {
        "economic": [scores.get("edpi")],
        "environmental": [scores.get("wsi"), scores.get("wspi"), inv(scores.get("iai"))],
        "social": [scores.get("scpi"), inv(scores.get("vei"))],
    }
    out: dict[str, float | None] = {}
    for key, vals in groups.items():
        present = [v for v in vals if v is not None]
        out[key] = round(sum(present) / len(present) * 100, 2) if present else None
    return out


# ---------------------------------------------------------------------------
# Stakeholder Pressure Matrix: which respondent group feels the most pressure
# on which pillar. Falls out of THEME_COMPONENTS for free -- each component is
# already tagged with its source survey; this just groups by survey instead of
# collapsing straight to the theme average. Location is excluded: it's a site
# audit, not a stakeholder group.
# ---------------------------------------------------------------------------


def compute_stakeholder_matrix() -> dict:
    """Every cell reads "higher = more pressure felt by that group", same convention
    as the raw derived columns (derive.py's docstring). IAI/VEI components are stored
    in their own "higher = better" natural direction (indices.py's INVERT_FOR_TVI), so
    they're inverted here too -- otherwise a "good infrastructure" score would misread
    as "high stress" sitting next to the other four theme columns."""
    themes = list(indices.THEME_COMPONENTS.keys())
    matrix: dict[str, dict[str, float | None]] = {s: {} for s in STAKEHOLDER_SURVEYS}

    for theme, components in indices.THEME_COMPONENTS.items():
        invert = theme in indices.INVERT_FOR_TVI
        by_survey: dict[str, list[float]] = {s: [] for s in STAKEHOLDER_SURVEYS}
        for _name, survey, col in components:
            if survey not in by_survey:
                continue
            v = indices.town_value(survey, col)
            if v is not None:
                by_survey[survey].append(1 - v if invert else v)
        for s in STAKEHOLDER_SURVEYS:
            vals = by_survey[s]
            matrix[s][theme] = round(sum(vals) / len(vals), 4) if vals else None

    return {"surveys": STAKEHOLDER_SURVEYS, "themes": themes, "matrix": matrix}


# ---------------------------------------------------------------------------
# Seasonality Amplification Index (SAI): an *empirical* peak-season signal --
# how much worse respondents say things already get in peak season, distinct
# from the Stress Test's hypothetical footfall-multiplier scenario.
# ---------------------------------------------------------------------------

SAI_COMPONENTS: list[tuple[str, str]] = [
    ("enterprise", "water_constraint_stress"),
    ("enterprise", "peak_offpeak_cost_pressure"),
    ("residents", "travel_difficulty_peak"),
    ("residents", "sewage_overflow_peak"),
    ("workers", "months_without_work_share"),
]


def compute_seasonality_index() -> dict:
    detail = []
    values = []
    for survey, col in SAI_COMPONENTS:
        v = indices.town_value(survey, col)
        if v is not None:
            values.append(v)
            detail.append({"component": f"{survey}_{col}", "value": round(v, 4), "town_wide_proxy": False})
    score = round(sum(values) / len(values) * 100, 2) if values else None
    return {"value": score, "components": detail}


# ---------------------------------------------------------------------------
# Host-Visitor Perception Gap (HVG): implements the Doxey's Irridex banding
# RESEARCH_BENCHMARKS.md SS2.3 already describes but never actually computed.
# Reuses two already-computed values -- no new raw aggregation.
# ---------------------------------------------------------------------------

DOXEY_BANDS: list[tuple[float, str]] = [
    (0.75, "Euphoria"),
    (0.5, "Apathy"),
    (0.25, "Irritation"),
    (0.0, "Antagonism"),
]


def _doxey_stage(host_sentiment: float) -> str:
    for threshold, label in DOXEY_BANDS:
        if host_sentiment >= threshold:
            return label
    return "Antagonism"


def compute_host_visitor_gap() -> dict:
    visitor = indices.town_value("tourist", "overall_satisfaction")
    scpi_score, _ = indices.compute_subindex("scpi", None)
    host = None if scpi_score is None else 1 - scpi_score
    gap = None if (visitor is None or host is None) else round(visitor - host, 4)
    return {
        "visitor_satisfaction": None if visitor is None else round(visitor, 4),
        "host_sentiment": None if host is None else round(host, 4),
        "gap": gap,
        "doxey_stage": _doxey_stage(host) if host is not None else None,
    }


def compute_insights() -> dict:
    return {
        "sustainability": compute_sustainability_triad(),
        "stakeholder_matrix": compute_stakeholder_matrix(),
        "seasonality": compute_seasonality_index(),
        "host_visitor_gap": compute_host_visitor_gap(),
    }
