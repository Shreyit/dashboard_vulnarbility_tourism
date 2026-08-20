"""Peak-season stress/pressure-test simulator (workflow.md SS6).

A transparent, documented elasticity model, not a black-box forecast: each sub-index
moves linearly with `footfall_multiplier` at a rate set in weights.json's
`stress_test_elasticities`. WSI/WSPI/SCPI (higher = worse) scale up with footfall;
IAI/VEI (higher = better) scale down, since infrastructure capacity is fixed short-run
so per-visitor adequacy erodes as footfall rises; EDPI defaults to 0 elasticity because
worker income share from tourism is assumed structurally fixed in the short run.
"""
from __future__ import annotations

from .config import FOOTFALL_ANCHORS, get_weights_config
from .indices import INVERT_FOR_TVI, THEME_COMPONENTS, compute_tvi


def _scenario_subindex(theme: str, baseline: float | None, multiplier: float, elasticity: float) -> float | None:
    if baseline is None:
        return None
    delta = elasticity * (multiplier - 1)
    if theme in INVERT_FOR_TVI:
        value = baseline * (1 - delta)  # adequacy/experience erodes under load
    else:
        value = baseline * (1 + delta)  # pressure rises under load
    return max(0.0, min(1.0, value))


def run_stress_test(footfall_multiplier: float, zone_id: str | None = None) -> dict:
    baseline = compute_tvi(zone_id)
    elasticities = {
        k: v for k, v in get_weights_config()["stress_test_elasticities"].items() if not k.startswith("_")
    }
    weights_cfg = get_weights_config()["tvi_weights"]

    scenario_sub: dict[str, float | None] = {}
    for theme in THEME_COMPONENTS:
        base_score = baseline["sub_indices"][theme]
        scenario_sub[theme] = _scenario_subindex(theme, base_score, footfall_multiplier, elasticities.get(theme, 0.0))

    weighted_sum = 0.0
    weight_total = 0.0
    for theme, score in scenario_sub.items():
        if score is None:
            continue
        w = weights_cfg.get(theme, 1.0)
        value = (1 - score) if theme in INVERT_FOR_TVI else score
        weighted_sum += w * value
        weight_total += w
    scenario_tvi = round((weighted_sum / weight_total) * 100, 2) if weight_total > 0 else None

    return {
        "footfall_multiplier": footfall_multiplier,
        "zone_id": zone_id,
        "baseline": {"tvi": baseline["tvi"], "sub_indices": baseline["sub_indices"]},
        "scenario": {
            "tvi": scenario_tvi,
            "sub_indices": {k: (round(v, 4) if v is not None else None) for k, v in scenario_sub.items()},
        },
        "elasticities": elasticities,
        "footfall_anchors": FOOTFALL_ANCHORS,
        "note": (
            "Scenario calculator, not a forecast: each sub-index is scaled linearly from "
            "its computed baseline using the documented elasticity assumptions above -- "
            "workflow.md SS6."
        ),
    }
