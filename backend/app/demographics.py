"""Who was actually surveyed -- raw categorical breakdowns from the cleaned
respondent tables, not new derived indicators. Every number here is a plain
value_counts() on a real survey question, surfaced for the Overview tab's
"who we surveyed" charts rather than folded into any index.
"""
from __future__ import annotations

import pandas as pd

from .colfind import find_col
from .data_loader import load_raw_tables


def _pct_breakdown(series: pd.Series, top_n: int | None = None, shorten_parens: bool = False) -> list[dict]:
    cleaned = series.dropna().astype(str).str.strip()
    cleaned = cleaned[cleaned != ""]
    counts = cleaned.value_counts()
    total = int(counts.sum())
    if total == 0:
        return []
    if top_n is not None:
        counts = counts.head(top_n)

    def _label(raw: str) -> str:
        # some raw options carry a clarifying parenthetical the chart doesn't
        # need ("Hospitality (Hotels, Restaurants, Resorts etc)" -> "Hospitality")
        return raw.split("(")[0].strip() if shorten_parens else raw

    return [
        {"label": _label(label), "value": round(count / total * 100, 1), "count": int(count)}
        for label, count in counts.items()
    ]


def compute_demographics() -> dict:
    raw = load_raw_tables()
    tourist, enterprise, workers, residents, location = (
        raw["tourist"],
        raw["enterprise"],
        raw["workers"],
        raw["residents"],
        raw["location"],
    )

    people_counts = {
        "Tourists": len(tourist),
        "Residents": len(residents),
        "Workers": len(workers),
        "Enterprises": len(enterprise),
    }
    total_people = sum(people_counts.values())
    respondent_mix = [
        {"label": label, "value": round(count / total_people * 100, 1), "count": count}
        for label, count in people_counts.items()
    ]

    return {
        "respondent_mix": respondent_mix,
        "zones_surveyed": len(location),
        "tourist_age_group": _pct_breakdown(tourist[find_col(tourist, "what is your age group")]),
        "tourist_gender": _pct_breakdown(tourist[find_col(tourist, "gender of the respondent")]),
        "tourist_first_visit": _pct_breakdown(tourist[find_col(tourist, "is this your first visit to nainital")]),
        "tourist_accommodation": _pct_breakdown(
            tourist[find_col(tourist, "what type of accommodation are you staying in")], top_n=6
        ),
        "enterprise_type": _pct_breakdown(enterprise[find_col(enterprise, "type of enterprise")], top_n=6),
        "worker_sector": _pct_breakdown(
            workers[find_col(workers, "what sector do you work in")], top_n=6, shorten_parens=True
        ),
    }
