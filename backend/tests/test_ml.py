from app.dependency_model import compute_dependency_model
from app.sensitivity import compute_sensitivity
from app.zone_clustering import compute_zone_clusters


def test_zone_clusters_cover_every_zone_with_valid_silhouette():
    result = compute_zone_clusters()
    assert -1 <= result["silhouette"] <= 1
    assert len(result["zones"]) == 9  # 9 real surveyed zones (Z02 excluded as a duplicate site)
    clusters_used = {z["cluster"] for z in result["zones"]}
    assert clusters_used == {p["cluster"] for p in result["profiles"]}


def test_dependency_model_metrics_are_valid_probabilities():
    result = compute_dependency_model()
    assert 0 <= result["cv_accuracy"] <= 1
    assert 0 <= result["cv_roc_auc"] <= 1
    assert 0 <= result["baseline_accuracy"] <= 1
    assert result["n_samples"] > 0
    assert len(result["features"]) == result["n_features"]
    # sorted descending by importance
    importances = [f["importance"] for f in result["features"]]
    assert importances == sorted(importances, reverse=True)


def test_dependency_model_beats_the_majority_class_baseline():
    # This is the check that caught the first version of this model (predicting
    # tourism_dependency itself) performing at/below chance -- see
    # dependency_model.py's own module docstring for why the target changed.
    result = compute_dependency_model()
    assert result["cv_accuracy"] > result["baseline_accuracy"]


def test_sensitivity_percentiles_bracket_the_mean():
    result = compute_sensitivity()
    for zone in result["zones"]:
        assert zone["p5_tvi"] <= zone["mean_tvi"] <= zone["p95_tvi"]
        assert 0 <= zone["pct_most_vulnerable"] <= 100
    town = result["town"]
    assert town["p5_tvi"] <= town["mean_tvi"] <= town["p95_tvi"]
