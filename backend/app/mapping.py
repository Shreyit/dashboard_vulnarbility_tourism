"""Value-mapping helpers: raw survey answers -> 0-1 scores.

Every mapper here is direction-aligned so that, unless noted, 1 = more stressed /
more pressure / worse outcome and 0 = the opposite (workflow.md SS5 step 3). Composite
code inverts where a raw field is "higher = better" (e.g. satisfaction) before mixing
it into a "higher = worse" sub-index.
"""
from __future__ import annotations

import re

import numpy as np
import pandas as pd

YES_WORDS = {"yes", "true"}
NO_WORDS = {"no", "false"}


def yesno01(series: pd.Series) -> pd.Series:
    """Map a free-text Yes/No column to Yes=1.0/No=0.0 (no direction flip -- callers
    invert explicitly with `1 - yesno01(...)` where "Yes" is the good/low-stress answer,
    so the direction choice is visible at the call site, not hidden in this helper)."""
    s = series.astype(str).str.strip().str.lower()
    return s.map(lambda v: 1.0 if v in YES_WORDS else (0.0 if v in NO_WORDS else np.nan))


def clean_binary(series: pd.Series) -> pd.Series:
    """A select_multiple boolean sub-column (0/1 float) with occasional garbage values."""
    s = pd.to_numeric(series, errors="coerce")
    return s.where(s.isin([0.0, 1.0]))


def contains_flag(series: pd.Series, needle: str) -> pd.Series:
    """1 if the text answer contains `needle` (case-insensitive), 0 if a valid non-null
    answer that doesn't, NaN if missing/unparseable."""
    s = series.astype(str).str.strip().str.lower()
    valid = series.notna() & (s != "nan")
    out = pd.Series(np.where(s.str.contains(needle.lower()), 1.0, 0.0), index=series.index)
    return out.where(valid)


def ordinal_1to5(series: pd.Series) -> pd.Series:
    """Parse a 1-5 Likert answer (numeric or 'N (label)' text) to 0-1, higher input = higher output."""

    def parse(v):
        if pd.isna(v):
            return np.nan
        m = re.match(r"\s*(\d+)", str(v))
        if m:
            x = float(m.group(1))
            if 1 <= x <= 5:
                return (x - 1) / 4
        return np.nan

    return series.map(parse)


def category_score(series: pd.Series, mapping: dict[str, float]) -> pd.Series:
    s = series.astype(str).str.strip().str.lower()
    lut = {k.lower(): v for k, v in mapping.items()}
    return s.map(lut)


def combined_ordinal_and_category(series: pd.Series, mapping: dict[str, float]) -> pd.Series:
    """Some coalesced columns mix a numeric 1-5 scale with free-text category labels
    (e.g. noise_rating_1to5). Try the numeric parse first, fall back to the category map."""
    numeric = ordinal_1to5(series)
    cat = category_score(series, mapping)
    return numeric.fillna(cat)


def minmax(series: pd.Series, lo_q: float = 0.01, hi_q: float = 0.99) -> pd.Series:
    """Min-max normalize to 0-1, clipping at the 1st/99th percentile first (OECD/JRC
    composite-indicator handbook method, workflow.md SS5 step 2)."""
    s = pd.to_numeric(series, errors="coerce")
    if s.notna().sum() == 0:
        return s
    lo, hi = s.quantile(lo_q), s.quantile(hi_q)
    if hi <= lo:
        lo, hi = s.min(), s.max()
    if hi <= lo:
        return s.where(s.isna(), 0.5)
    return ((s.clip(lo, hi) - lo) / (hi - lo)).clip(0, 1)


NOISE_CATEGORY_MAP = {
    "much quieter": 0.0,
    "about the same": 0.5,
    "somewhat louder": 0.75,
    "much louder — it disrupts my daily routine": 1.0,
    "much louder - it disrupts my daily routine": 1.0,
}

WATER_TREND_MAP = {
    "improved": 0.0,
    "no change": 0.5,
    "worsened": 1.0,
    # "Yes"/"No" values come from a differently-scaled coalesced duplicate column
    # (workflow.md SS2) and can't be direction-mapped reliably — left unmapped (NaN).
}

ENV_TREND_MAP = {
    "significantly improved": 0.0,
    "slightly improved": 0.25,
    "stayed the same": 0.5,
    "slightly worsened": 0.75,
    "significantly worsened": 1.0,
}

PRICE_INFLATION_MAP = {
    "no change": 0.0,
    "slightly higher": 0.5,
    "much higher": 1.0,
}

WATER_CONSTRAINT_MAP = {
    "not at all": 0.0,
    "minor adjustments": 0.33,
    "significant reduction": 0.67,
    "had to refuse guests": 1.0,
}

SEWAGE_ADEQUACY_MAP = {
    # 1 = adequate system (municipal/own STP) -> 0 pressure; 0.5 septic; 0 none/other.
    "sewage connection": 1.0,
    "municipal": 1.0,
    "septic tank": 0.5,
    "others": 0.0,
    "no system in place": 0.0,
}

INCOME_SHARE_BUCKET_MAP = {
    "less than 25%": 0.125,
    "25-50%": 0.375,
    "51-75%": 0.63,
    "more than 75%": 0.875,
    "100%": 1.0,
}
