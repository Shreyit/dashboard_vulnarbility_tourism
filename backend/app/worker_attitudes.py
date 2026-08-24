"""Worker Attitudes: the same tourism-dependence-vs-pillar-pressure test as
resident_attitudes.py (Social Exchange Theory, RESEARCH_BENCHMARKS.md SS2.6),
run for Workers instead of Residents. Reuses derive.py's `tourism_income_dependency`
(binarized at >=0.5: majority-or-more of annual income from tourism-linked work)
as the group split, and Workers' own already-derived pillar-adjacent columns.

Workers have no derived Environmental column anywhere in this project (see
insights.py/framework_esac.py's "NOT MEASURED" convention for the same gap) --
that pillar is omitted here rather than fabricated.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import indices
from .dependency_compare import compare_groups

DEPENDENCY_THRESHOLD = 0.5
SOCIAL_COMPONENTS = ["no_insurance", "seasonal_employment_insecurity"]


def _pillar_scores() -> pd.DataFrame:
    df = indices.derived_table("workers")
    dependency = df["tourism_income_dependency"]
    # Missing respondents must stay missing (not silently fold into "non-dependent") --
    # np.where alone would turn NaN >= threshold into False.
    group = pd.Series(np.where(dependency >= DEPENDENCY_THRESHOLD, 1.0, 0.0), index=df.index)
    group = group.where(dependency.notna())

    economic = df["months_without_work_share"]
    social = df[SOCIAL_COMPONENTS].mean(axis=1, skipna=True)
    rii = pd.concat([economic, social], axis=1).mean(axis=1, skipna=True)
    return pd.DataFrame({"group": group, "economic": economic, "social": social, "rii": rii})


def compute_worker_attitudes() -> dict:
    scores = _pillar_scores()
    group = scores["group"]

    pillars = {
        "economic": compare_groups(scores["economic"], group),
        "social": compare_groups(scores["social"], group),
        "environmental": None,
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
