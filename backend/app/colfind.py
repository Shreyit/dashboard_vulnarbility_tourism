"""Locate messy KoBo question-text columns by substring instead of exact string.

The processed CSVs keep the original survey question text as column headers (long,
sometimes multi-line, sometimes with stray whitespace). Matching by substring on a
normalized (lowercased, whitespace-collapsed) form is far less brittle than hardcoding
the exact raw strings.
"""
from __future__ import annotations

import re

import pandas as pd


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", str(s).replace("\n", " ")).strip().lower()


def find_col(df: pd.DataFrame, needles, exclude=None, required: bool = True) -> str | None:
    """Return the single column whose normalized header contains every needle substring.

    Raises KeyError if `required` and nothing matches. If several columns match, the
    shortest header wins (the base question, not a longer near-duplicate).
    """
    if isinstance(needles, str):
        needles = [needles]
    needles_n = [_norm(n) for n in needles]
    exclude_n = [_norm(e) for e in (exclude or [])]

    matches = [
        col
        for col in df.columns
        if all(n in _norm(col) for n in needles_n)
        and not any(e in _norm(col) for e in exclude_n)
    ]
    if not matches:
        if required:
            raise KeyError(f"No column found for needles={needles_n} exclude={exclude_n}")
        return None
    matches.sort(key=len)
    return matches[0]
