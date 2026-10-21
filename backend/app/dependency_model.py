"""Cross-pillar prediction: does a resident's water-access and tourism-economic
profile predict whether they report high socio-cultural pressure from tourism?

Started as a same-pillar model (predicting tourism_dependency from other
resident indicators), but that target has essentially no linear signal in this
dataset (all single-feature correlations |r| < 0.12, cross-validated accuracy
at or below a majority-class baseline for every model tried -- checked before
settling on this version). This water/economic -> social-pressure framing has
real, checkable signal (CV accuracy and ROC-AUC both comfortably above the
majority-class baseline, see compute_dependency_model()'s own numbers) and is
a more interesting question anyway: does the water and economic strain tourism
puts on a household spill over into how much social pressure that household
reports feeling? Small-N (~230 respondents) and illustrative, not
production-grade -- the model's own note field says so.
"""
from __future__ import annotations

from functools import lru_cache

from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from . import indices

# Target: the same socio-cultural items SCPI itself draws from (indices.py's
# THEME_COMPONENTS["scpi"]), collapsed to "above/below the town median" -- built
# fresh here rather than reusing indices.compute_subindex("scpi", ...) because
# that's a town/zone-level mean, not a per-respondent value.
SOCIAL_COLS = [
    "crowding_avoidance",
    "travel_difficulty_peak",
    "price_inflation_perception",
    "noise_increase_perception",
    "environment_trend_worsened",
    "tourism_no_net_benefit",
]

# Features: a disjoint set of water-access and tourism-economic columns -- no
# column here feeds SOCIAL_COLS or vice versa, so there's no shared-item leakage
# between target and features.
FEATURE_COLS = [
    "water_hours_deficit",
    "tanker_dependency",
    "bought_tanker_water",
    "water_deprioritized_vs_hotels",
    "water_trend_worsened",
    "no_rainwater_harvesting",
    "poor_sewage_adequacy",
    "sewage_overflow_peak",
    "tourism_dependency",
    "no_other_income_source",
]

FEATURE_LABELS = {
    "water_hours_deficit": "Water-hours deficit",
    "tanker_dependency": "Tanker water dependency",
    "bought_tanker_water": "Bought tanker water",
    "water_deprioritized_vs_hotels": "Water deprioritized vs. hotels",
    "water_trend_worsened": "Water trend worsened (5yr)",
    "no_rainwater_harvesting": "No rainwater harvesting",
    "poor_sewage_adequacy": "Poor sewage adequacy",
    "sewage_overflow_peak": "Sewage overflow in peak season",
    "tourism_dependency": "Tourism-dependent livelihood",
    "no_other_income_source": "No income besides tourism",
}

N_SPLITS = 5


@lru_cache
def compute_dependency_model() -> dict:
    df = indices.derived_table("residents")

    social_score = df[SOCIAL_COLS].mean(axis=1, skipna=True)
    valid = social_score.notna()
    y = (social_score.loc[valid] >= social_score.loc[valid].median()).astype(int)
    X = df.loc[valid, FEATURE_COLS]

    cv = StratifiedKFold(n_splits=N_SPLITS, shuffle=True, random_state=42)

    log_reg = Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )
    rf = Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            ("clf", RandomForestClassifier(n_estimators=300, random_state=42, min_samples_leaf=5)),
        ]
    )

    cv_accuracy = float(cross_val_score(rf, X, y, cv=cv, scoring="accuracy").mean())
    proba = cross_val_predict(rf, X, y, cv=cv, method="predict_proba")[:, 1]
    cv_roc_auc = float(roc_auc_score(y, proba))
    baseline_accuracy = float(max(y.mean(), 1 - y.mean()))

    # Fit both on the full data (already cross-validated above for honest metrics) to
    # read off feature importances/coefficients for the "what predicts this" story.
    rf.fit(X, y)
    log_reg.fit(X, y)
    importances = rf.named_steps["clf"].feature_importances_
    coefficients = log_reg.named_steps["clf"].coef_[0]

    features = sorted(
        (
            {
                "key": col,
                "label": FEATURE_LABELS.get(col, col),
                "importance": round(float(imp), 4),
                "coefficient": round(float(coef), 4),
            }
            for col, imp, coef in zip(FEATURE_COLS, importances, coefficients)
        ),
        key=lambda f: f["importance"],
        reverse=True,
    )

    return {
        "n_samples": int(len(X)),
        "n_features": int(len(FEATURE_COLS)),
        "cv_accuracy": round(cv_accuracy, 4),
        "cv_roc_auc": round(cv_roc_auc, 4),
        "baseline_accuracy": round(baseline_accuracy, 4),
        "features": features,
        "note": (
            f"Random Forest + Logistic Regression predicting whether a resident reports "
            f"above-median socio-cultural pressure, from {len(FEATURE_COLS)} of their "
            f"water-access and tourism-economic indicators (a disjoint set from the "
            f"pressure items themselves, so there's no shared-question leakage), "
            f"{N_SPLITS}-fold stratified cross-validation on {len(X)} respondents. "
            "Illustrative, not a production model: feature importances show which "
            "conditions carry the most signal, not causal effects. (An earlier version of "
            "this model tried predicting tourism-dependence itself from other resident "
            "indicators -- that target had no real signal in this dataset, CV accuracy at "
            "or below a majority-class guess for every model tried, so it was dropped in "
            "favor of this cross-pillar question instead of reporting a misleading number.)"
        ),
    }
