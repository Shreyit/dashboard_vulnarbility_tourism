"""Resident Attitudes & Social Exchange Theory: does tourism dependence correlate
with less "irritation" at tourism's pressure, per Social Exchange Theory (SET --
RESEARCH_BENCHMARKS.md SS2.6)? Reuses the exact per-respondent columns SCPI's
town-wide score already averages (derive_residents' residents.* outputs), just
partitioned into 3 pillars and tested per-respondent instead of averaged town-wide.

Every number here is computed fresh from processed/residents_clean.csv in this
session, with this project's own pillar definitions -- not a reproduction of any
externally reported figure.
"""
from __future__ import annotations

import pandas as pd

from . import indices
from .dependency_compare import compare_groups

SOCIAL_COMPONENTS = ["crowding_avoidance", "travel_difficulty_peak", "noise_increase_perception"]


def _pillar_scores() -> pd.DataFrame:
    df = indices.derived_table("residents")
    economic = df["tourism_no_net_benefit"]
    social = df[SOCIAL_COMPONENTS].mean(axis=1, skipna=True)
    environmental = df["environment_trend_worsened"]
    rii = pd.concat([economic, social, environmental], axis=1).mean(axis=1, skipna=True)
    return pd.DataFrame(
        {
            "group": df["tourism_dependency"],
            "economic": economic,
            "social": social,
            "environmental": environmental,
            "rii": rii,
        }
    )


def compute_resident_attitudes() -> dict:
    scores = _pillar_scores()
    group = scores["group"]

    pillars = {
        "economic": compare_groups(scores["economic"], group),
        "social": compare_groups(scores["social"], group),
        "environmental": compare_groups(scores["environmental"], group),
    }
    aggregate = compare_groups(scores["rii"], group)

    return {
        "group_sizes": {
            "dependent": int((group == 1).sum()),
            "non_dependent": int((group == 0).sum()),
        },
        "aggregate": aggregate,
        "pillars": pillars,
    }
