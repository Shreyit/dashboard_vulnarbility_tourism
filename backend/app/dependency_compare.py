"""Shared Mann-Whitney U group-comparison helper: is a 0/1-split group (tourism-
dependent vs. not) associated with a different pillar score? Extracted from
resident_attitudes.py so the same Social Exchange Theory-style test (RESEARCH_
BENCHMARKS.md SS2.6) can run for any respondent group with a binary dependency
flag and per-respondent pillar scores, not just Residents.
"""
from __future__ import annotations

import pandas as pd
from scipy import stats

MIN_GROUP_SIZE = 5


def band(p_value: float) -> str:
    if p_value < 0.05:
        return "significant"
    if p_value < 0.10:
        return "marginal"
    return "not significant"


def compare_groups(values: pd.Series, group: pd.Series) -> dict | None:
    """`group` is a 0/1 series (1 = tourism-dependent); `values` is a 0-1 pillar
    score aligned to the same index. Returns None if either side has too few
    respondents for a meaningful test."""
    paired = pd.concat([values, group], axis=1, keys=["value", "group"]).dropna()
    dependent = paired.loc[paired["group"] == 1, "value"]
    non_dependent = paired.loc[paired["group"] == 0, "value"]
    if len(dependent) < MIN_GROUP_SIZE or len(non_dependent) < MIN_GROUP_SIZE:
        return None

    u_stat, p_value = stats.mannwhitneyu(dependent, non_dependent, alternative="two-sided")
    n1, n2 = len(dependent), len(non_dependent)
    # Rank-biserial effect size (Kerby, 2014): r = 1 - 2U/(n1*n2), U with respect to
    # `dependent` as the first sample. The two medians below are the unambiguous way
    # to read direction, independent of this sign convention.
    rank_biserial = 1 - (2 * u_stat) / (n1 * n2)

    return {
        "n_dependent": n1,
        "n_non_dependent": n2,
        # Several source pillars are single yes/no-derived items, where the median
        # often ties at 0 or 1 even when the test detects a real rank-distribution
        # difference -- the mean (equivalent to a proportion for a 0/1 item) is the
        # more readable "how much" number for a dashboard reader.
        "mean_dependent": round(float(dependent.mean()), 4),
        "mean_non_dependent": round(float(non_dependent.mean()), 4),
        "median_dependent": round(float(dependent.median()), 4),
        "median_non_dependent": round(float(non_dependent.median()), 4),
        "p_value": round(float(p_value), 4),
        "rank_biserial": round(float(rank_biserial), 4),
        "band": band(p_value),
    }
