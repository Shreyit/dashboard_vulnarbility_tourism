"""Unsupervised zone archetypes -- do the 9 surveyed zones fall into a handful of
distinct "vulnerability profiles" rather than one undifferentiated town average?

Feature matrix: each zone's own 6 sub-index scores (indices.compute_subindex),
the same numbers the rest of the dashboard already shows per zone -- no new
aggregation, just a different read of it. k is chosen by silhouette score
across a small candidate range rather than fixed by hand, and every candidate's
score is reported so the choice is inspectable, not asserted.
"""
from __future__ import annotations

from functools import lru_cache

import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from . import indices

THEMES = list(indices.THEME_COMPONENTS.keys())

# Direction-aware "badness" adjective per theme, used to auto-label a cluster from
# whichever sub-index deviates most from the town-wide mean for that cluster.
# indices.INVERT_FOR_TVI themes (IAI/VEI) are "higher = better" in their natural
# form, so their badness runs the opposite way from the rest.
THEME_ADJECTIVES = {
    "wsi": "water-stressed",
    "wspi": "waste-pressured",
    "iai": "infrastructure-poor",
    "edpi": "economically precarious",
    "scpi": "socio-culturally strained",
    "vei": "visitor-experience-poor",
}

CANDIDATE_K = (2, 3, 4)


def _zone_feature_matrix() -> tuple[list[dict], np.ndarray]:
    zones = indices.list_zones()
    rows = []
    for z in zones:
        scores = [indices.compute_subindex(theme, z["zone_id"])[0] for theme in THEMES]
        rows.append(scores)
    return zones, np.array(rows, dtype=float)


def _badness(raw: np.ndarray) -> np.ndarray:
    """raw: (n_zones, n_themes) sub-index scores in their natural direction ->
    (n_zones, n_themes) "higher = worse" scores, matching THEME_ADJECTIVES."""
    out = raw.copy()
    for j, theme in enumerate(THEMES):
        if theme in indices.INVERT_FOR_TVI:
            out[:, j] = 1 - out[:, j]
    return out


def _cluster_label(cluster_badness: np.ndarray, town_badness: np.ndarray) -> str:
    deviation = cluster_badness - town_badness
    top = np.argsort(deviation)[::-1][:2]
    adjectives = [THEME_ADJECTIVES[THEMES[i]] for i in top if deviation[i] > 0]
    if not adjectives:
        return "Near town-average"
    return ", ".join(adjectives).capitalize()


@lru_cache
def compute_zone_clusters() -> dict:
    zones, raw = _zone_feature_matrix()
    names = [indices.zone_display_name(z["zone_id"]) for z in zones]

    scaled = StandardScaler().fit_transform(raw)

    silhouette_by_k: dict[int, float] = {}
    best_k, best_labels, best_score = None, None, -2.0
    for k in CANDIDATE_K:
        if k >= len(zones):
            continue
        try:
            labels = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(scaled)
            score = float(silhouette_score(scaled, labels))
        except ValueError:
            continue
        silhouette_by_k[k] = round(score, 4)
        if score > best_score:
            best_k, best_labels, best_score = k, labels, score

    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(scaled)

    badness = _badness(raw)
    town_badness = badness.mean(axis=0)

    profiles = []
    for c in sorted(set(best_labels.tolist())):
        mask = best_labels == c
        cluster_raw = raw[mask].mean(axis=0)
        cluster_badness = badness[mask].mean(axis=0)
        profiles.append(
            {
                "cluster": int(c),
                "label": _cluster_label(cluster_badness, town_badness),
                "size": int(mask.sum()),
                "sub_indices": {theme: round(float(v), 4) for theme, v in zip(THEMES, cluster_raw)},
            }
        )

    zone_out = [
        {
            "zone_id": z["zone_id"],
            "name": name,
            "cluster": int(cluster),
            "pca_x": round(float(x), 4),
            "pca_y": round(float(y), 4),
        }
        for z, name, cluster, (x, y) in zip(zones, names, best_labels, coords)
    ]

    return {
        "k": int(best_k),
        "silhouette": round(float(best_score), 4),
        "silhouette_by_k": silhouette_by_k,
        "explained_variance": [round(float(v), 4) for v in pca.explained_variance_ratio_],
        "zones": zone_out,
        "profiles": profiles,
        "note": (
            "K-means on the 9 zones' own 6 sub-index scores (standardized), k chosen by "
            "silhouette score across k=2..4. Visitor Experience Index (VEI) has no "
            "zone-tied survey component at all (the Tourist survey isn't GPS-tagged), so "
            "it is a constant town-wide value in every zone's feature vector here -- "
            "included for completeness, but it cannot itself separate zones."
        ),
    }
