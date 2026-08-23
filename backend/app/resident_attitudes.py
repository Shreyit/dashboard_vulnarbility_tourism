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
from scipy import stats

from . import indices

SOCIAL_COMPONENTS = ["crowding_avoidance", "travel_difficulty_peak", "noise_increase_perception"]
MIN_GROUP_SIZE = 5


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


def _band(p_value: float) -> str:
    if p_value < 0.05:
        return "significant"
    if p_value < 0.10:
        return "marginal"
    return "not significant"


def _compare(values: pd.Series, group: pd.Series) -> dict | None:
    paired = pd.concat([values, group], axis=1, keys=["value", "group"]).dropna()
    dependent = paired.loc[paired["group"] == 1, "value"]
    non_dependent = paired.loc[paired["group"] == 0, "value"]
    if len(dependent) < MIN_GROUP_SIZE or len(non_dependent) < MIN_GROUP_SIZE:
        return None  # too few respondents in one group for a meaningful test

    u_stat, p_value = stats.mannwhitneyu(dependent, non_dependent, alternative="two-sided")
    n1, n2 = len(dependent), len(non_dependent)
    # Rank-biserial effect size (Kerby, 2014): r = 1 - 2U/(n1*n2), U with respect to
    # `dependent` as the first sample. The two medians below are the unambiguous way
    # to read direction, independent of this sign convention.
    rank_biserial = 1 - (2 * u_stat) / (n1 * n2)

    return {
        "n_dependent": n1,
        "n_non_dependent": n2,
        # Several of these pillars (economic, environmental) are single yes/no-derived
        # items, where the median often ties at 0 or 1 even when the test detects a
        # real rank-distribution difference -- the mean (equivalent to a proportion for
        # a 0/1 item) is the more readable "how much" number for a dashboard reader.
        "mean_dependent": round(float(dependent.mean()), 4),
        "mean_non_dependent": round(float(non_dependent.mean()), 4),
        "median_dependent": round(float(dependent.median()), 4),
        "median_non_dependent": round(float(non_dependent.median()), 4),
        "p_value": round(float(p_value), 4),
        "rank_biserial": round(float(rank_biserial), 4),
        "band": _band(p_value),
    }


def compute_resident_attitudes() -> dict:
    scores = _pillar_scores()
    group = scores["group"]

    pillars = {
        "economic": _compare(scores["economic"], group),
        "social": _compare(scores["social"], group),
        "environmental": _compare(scores["environmental"], group),
    }
    aggregate = _compare(scores["rii"], group)

    return {
        "group_sizes": {
            "dependent": int((group == 1).sum()),
            "non_dependent": int((group == 0).sum()),
        },
        "aggregate": aggregate,
        "pillars": pillars,
    }
