"""Monte Carlo weight-sensitivity analysis: weights.json's equal 1/6 weighting is
explicitly flagged there as "first thing to hand back to domain reviewers to
retune" -- this asks how much the town-wide and per-zone Tourism Vulnerability
Index rankings would actually move if those weights were off by up to +/-30%,
the standard robustness check the OECD/JRC composite-indicator handbook
(cited throughout this project's docs) recommends for exactly this situation.

Sub-index scores don't depend on the weights at all, so they're computed once;
only the cheap weighted-sum aggregation is redone per Monte Carlo draw.
"""
from __future__ import annotations

from functools import lru_cache

import numpy as np

from . import indices
from .config import get_weights_config

THEMES = list(indices.THEME_COMPONENTS.keys())
TOWN_KEY = "town"
N_ITERATIONS = 1000
PERTURBATION = 0.3  # +/-30% multiplicative noise per weight, then renormalized
SEED = 42


def _baseline_sub_scores() -> dict[str, dict[str, float | None]]:
    zone_ids = [z["zone_id"] for z in indices.list_zones()]
    out: dict[str, dict[str, float | None]] = {
        TOWN_KEY: {theme: indices.compute_subindex(theme, None)[0] for theme in THEMES}
    }
    for zid in zone_ids:
        out[zid] = {theme: indices.compute_subindex(theme, zid)[0] for theme in THEMES}
    return out


def _weighted_tvi(sub_scores: dict[str, float | None], weights: dict[str, float]) -> float | None:
    weighted_sum = 0.0
    weight_total = 0.0
    for theme, score in sub_scores.items():
        if score is None:
            continue
        w = weights.get(theme, 1.0)
        value = (1 - score) if theme in indices.INVERT_FOR_TVI else score
        weighted_sum += w * value
        weight_total += w
    return (weighted_sum / weight_total) * 100 if weight_total > 0 else None


@lru_cache
def compute_sensitivity() -> dict:
    base_weights = get_weights_config()["tvi_weights"]
    sub_scores_by_key = _baseline_sub_scores()
    baseline_weight_vec = np.array([base_weights.get(t, 1.0) for t in THEMES])

    baseline_tvi = {key: _weighted_tvi(scores, base_weights) for key, scores in sub_scores_by_key.items()}

    zone_keys = [k for k in sub_scores_by_key if k != TOWN_KEY]
    samples: dict[str, list[float]] = {k: [] for k in sub_scores_by_key}
    most_vulnerable_counts = {k: 0 for k in zone_keys}

    rng = np.random.default_rng(SEED)
    for _ in range(N_ITERATIONS):
        noise = rng.uniform(1 - PERTURBATION, 1 + PERTURBATION, size=len(THEMES))
        draw_weights = dict(zip(THEMES, baseline_weight_vec * noise))

        draw_tvis: dict[str, float] = {}
        for key, scores in sub_scores_by_key.items():
            tvi = _weighted_tvi(scores, draw_weights)
            if tvi is not None:
                samples[key].append(tvi)
                draw_tvis[key] = tvi

        zone_tvis = {k: v for k, v in draw_tvis.items() if k != TOWN_KEY}
        if zone_tvis:
            most_vulnerable_counts[max(zone_tvis, key=zone_tvis.get)] += 1

    def _stats(key: str) -> dict:
        arr = np.array(samples[key])
        return {
            "baseline_tvi": round(baseline_tvi[key], 2) if baseline_tvi[key] is not None else None,
            "mean_tvi": round(float(arr.mean()), 2),
            "p5_tvi": round(float(np.percentile(arr, 5)), 2),
            "p95_tvi": round(float(np.percentile(arr, 95)), 2),
        }

    zones_out = []
    for z in indices.list_zones():
        zid = z["zone_id"]
        stat = _stats(zid)
        zones_out.append(
            {
                "zone_id": zid,
                "name": indices.zone_display_name(zid),
                **stat,
                "pct_most_vulnerable": round(most_vulnerable_counts[zid] / N_ITERATIONS * 100, 1),
            }
        )
    zones_out.sort(key=lambda z: z["baseline_tvi"] or 0, reverse=True)

    top_zone = max(most_vulnerable_counts, key=most_vulnerable_counts.get)
    top_share = most_vulnerable_counts[top_zone] / N_ITERATIONS * 100

    return {
        "n_iterations": N_ITERATIONS,
        "perturbation_pct": int(PERTURBATION * 100),
        "zones": zones_out,
        "town": _stats(TOWN_KEY),
        "rank_stability_note": (
            f"{indices.zone_display_name(top_zone)} was the single most-vulnerable zone in "
            f"{top_share:.0f}% of {N_ITERATIONS} random re-weightings -- the ranking is "
            + ("stable" if top_share >= 60 else "sensitive to how the six pillars are weighted")
            + " under this perturbation range."
        ),
        "note": (
            f"Each of weights.json's six equal weights is randomly perturbed +/-{int(PERTURBATION * 100)}% "
            f"and renormalized, {N_ITERATIONS} times; sub-index scores themselves are fixed "
            "(the weights only change how the six are combined). p5/p95 show the resulting "
            "TVI range per zone -- a standard OECD/JRC composite-indicator robustness check, "
            "not a forecast."
        ),
    }
