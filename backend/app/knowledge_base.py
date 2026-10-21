"""PahadiBot's retrieval layer: turns "stuff the entire computed context into
every prompt" into an actual retrieval step. Every number the dashboard already
computes gets rendered once as a short natural-language "card"; a user's
question is matched against those cards by TF-IDF + cosine similarity, and only
the top-matching cards go into the LLM prompt.

Deliberately sparse/TF-IDF retrieval, not dense embeddings -- no model download
or embedding API call, which keeps the Render deploy light. A documented
choice, not a shortcut: with a few dozen short cards, classic IR keyword
overlap is plenty, and it's exactly reproducible (see tests/test_retrieval.py).
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from . import demographics, dependency_model, indices, insights, resident_attitudes, sensitivity, worker_attitudes, zone_clustering

# Queries mentioning any of these -- or whose single best-matching card is a zone
# card -- get ALL zone cards, not just the top-k most textually similar ones.
# "Which zone is most vulnerable" needs the full comparison set to answer
# correctly; TF-IDF similarity alone would only surface the zones whose card
# text happens to overlap the query's wording, not necessarily the most
# vulnerable one. This is the documented fix for exactly the bug this project
# hit earlier (PahadiBot couldn't answer "which zone is most vulnerable").
ZONE_QUERY_KEYWORDS = {"zone", "zones", "site", "sites", "vulnerable", "vulnerability", "location", "where"}
ZONE_TOPIC = "zones"

# Same fix, same reasoning, for "what's missing / what does this lack" questions:
# a single retrieved caveat reads as "the only gap," so a query like this one
# gets every limitation card, not just the top-k most textually similar.
LIMITATION_QUERY_KEYWORDS = {
    "lack", "lacks", "lacking", "missing", "limitation", "limitations", "caveat",
    "caveats", "gap", "gaps", "weakness", "weaknesses", "flaw", "flaws", "assumption",
    "assumptions", "wrong", "biased", "bias", "incomplete", "shortcoming", "shortcomings",
}
LIMITATIONS_TOPIC = "limitations"


@dataclass(frozen=True)
class Card:
    id: str
    topic: str
    text: str


def _zone_cards() -> list[Card]:
    cards = []
    for z in indices.list_zones():
        name = indices.zone_display_name(z["zone_id"])
        tvi = indices.compute_tvi(z["zone_id"])["tvi"]
        cards.append(
            Card(
                f"zone:{z['zone_id']}",
                ZONE_TOPIC,
                f"{name} (zone {z['zone_id']}) has a Tourism Vulnerability Index (TVI) of {tvi} "
                "out of 100 -- higher means more vulnerable.",
            )
        )
    return cards


def _town_card() -> Card:
    t = indices.compute_tvi(None)
    subs = ", ".join(f"{k.upper()}={v}" for k, v in t["sub_indices"].items() if v is not None)
    return Card(
        "town:tvi",
        "town",
        f"Town-wide Tourism Vulnerability Index (TVI) is {t['tvi']} out of 100. "
        f"Its six sub-indices (0-1 scale): {subs}.",
    )


def _methodology_card() -> Card:
    return Card(
        "meta:methodology",
        "methodology",
        "The TVI combines six sub-indices: Water Stress (WSI), Waste & Sanitation "
        "Pressure (WSPI), Infrastructure Adequacy (IAI), Economic Dependency & "
        "Precarity (EDPI), Socio-Cultural Pressure (SCPI), and Visitor Experience "
        "(VEI) -- equally weighted by default, following the OECD/JRC composite-"
        "indicator method. IAI and VEI are inverted before combining, since higher "
        "is naturally better for those two.",
    )


def _stakeholder_cards() -> list[Card]:
    data = insights.compute_sustainability_by_stakeholder()
    cards = []
    for group, triad in data.items():
        cards.append(
            Card(
                f"stakeholder:{group}",
                "stakeholders",
                f"{group.title()} pressure profile (0-100, higher = more pressure felt by that "
                f"group): economic={triad['economic']}, environmental={triad['environmental']}, "
                f"social={triad['social']}.",
            )
        )
    return cards


def _dependency_cards() -> list[Card]:
    cards = []
    for label, fn in [("residents", resident_attitudes.compute_resident_attitudes), ("workers", worker_attitudes.compute_worker_attitudes)]:
        d = fn()
        agg = d["aggregate"]
        if agg:
            cards.append(
                Card(
                    f"dependency:{label}",
                    "dependency",
                    f"Tourism-dependent {label} report a {agg['band']} difference in overall "
                    f"pressure compared to non-dependent {label} (mean {agg['mean_dependent']} vs. "
                    f"{agg['mean_non_dependent']}, p={agg['p_value']}).",
                )
            )
    return cards


def _town_insight_cards() -> list[Card]:
    d = insights.compute_insights()
    cards = [
        Card(
            "insight:seasonality",
            "insights",
            f"The Seasonality Amplification Index is {d['seasonality']['value']} -- how much worse "
            "respondents say things already get in peak season, on a 0-100 scale.",
        )
    ]
    hv = d["host_visitor_gap"]
    if hv["gap"] is not None:
        cards.append(
            Card(
                "insight:host_visitor",
                "insights",
                f"Host-visitor perception gap: tourist satisfaction is {hv['visitor_satisfaction']}, "
                f"host (resident) sentiment is {hv['host_sentiment']}, a gap of {hv['gap']}. "
                f"This places the town at the '{hv['doxey_stage']}' stage of Doxey's Irridex.",
            )
        )
    return cards


def _limitation_cards() -> list[Card]:
    """Every honest caveat this project already tracks in code, surfaced as
    retrievable facts instead of only living in comments/notes a chat user can't
    see. Nothing here is new -- each one reuses a `note` field a Model Insights
    endpoint already returns, or a structural fact already true of the pipeline
    (workers/tourist not GPS-tagged, Z02 excluded as a duplicate site, etc.)."""
    residents_geotagged = len(demographics.compute_resident_locations())
    residents_total = next(
        (b["count"] for b in demographics.compute_demographics()["respondent_mix"] if b["label"] == "Residents"), None
    )
    worker_env = worker_attitudes.compute_worker_attitudes()["pillars"].get("environmental")

    cards = [
        Card(
            "limitation:residents_geotag",
            LIMITATIONS_TOPIC,
            f"Only {residents_geotagged} of {residents_total} surveyed residents have a usable GPS "
            "fix; the rest are excluded from the resident-location map rather than plotted at a "
            "fabricated position.",
        ),
        Card(
            "limitation:not_geotagged_surveys",
            LIMITATIONS_TOPIC,
            "The Tourist and Worker surveys are not GPS-tagged at all, so neither group has a real "
            "zone-level breakdown -- their numbers are town-wide only, used as a proxy wherever a "
            "zone-level value is requested for them.",
        ),
        Card(
            "limitation:worker_environmental",
            LIMITATIONS_TOPIC,
            "Workers' Environmental pressure pillar is not measured at all in this survey (it is "
            f"{worker_env}, i.e. null) -- there is no environmental question in the Workers "
            "questionnaire this project's pipeline can draw on.",
        ),
        Card(
            "limitation:enterprise_no_split",
            LIMITATIONS_TOPIC,
            "There is no tourism-dependent vs. non-dependent comparison for Enterprises -- every "
            "surveyed enterprise already runs a tourism-related business, so that split doesn't "
            "exist in the data (unlike Residents and Workers, which do have it).",
        ),
        Card(
            "limitation:equal_weights",
            LIMITATIONS_TOPIC,
            "The TVI's six sub-indices are combined with equal weights by default -- a starting "
            "assumption flagged in the project's own config as the first thing to hand back to "
            "domain reviewers to retune, not a validated weighting.",
        ),
        Card(
            "limitation:zone_names",
            LIMITATIONS_TOPIC,
            "Zone names shown on the dashboard (e.g. 'Site 7') are placeholders, not real place "
            "names -- an OSM reverse-geocode pass plus manual confirmation is still needed before "
            "real names (Mall Road, Tallital, etc.) can be locked in.",
        ),
        Card(
            "limitation:stress_test_not_forecast",
            LIMITATIONS_TOPIC,
            "The peak-season stress test is a transparent linear-elasticity scenario calculator, "
            "not a forecast -- there is no historical year-by-year tourist-arrival time series in "
            "this project to forecast from.",
        ),
        Card("limitation:dependency_model", LIMITATIONS_TOPIC, dependency_model.compute_dependency_model()["note"]),
        Card("limitation:zone_clusters", LIMITATIONS_TOPIC, zone_clustering.compute_zone_clusters()["note"]),
        Card("limitation:sensitivity", LIMITATIONS_TOPIC, sensitivity.compute_sensitivity()["note"]),
    ]
    return cards


@lru_cache
def _cards() -> tuple[Card, ...]:
    return tuple(
        [
            _town_card(),
            _methodology_card(),
            *_zone_cards(),
            *_stakeholder_cards(),
            *_dependency_cards(),
            *_town_insight_cards(),
            *_limitation_cards(),
        ]
    )


@lru_cache
def _index():
    cards = _cards()
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([c.text for c in cards])
    return vectorizer, matrix


def retrieve(query: str, k: int = 8) -> list[Card]:
    vectorizer, matrix = _index()
    cards = _cards()
    q_vec = vectorizer.transform([query])
    sims = cosine_similarity(q_vec, matrix)[0]
    ranked = sorted(range(len(cards)), key=lambda i: sims[i], reverse=True)
    top = [cards[i] for i in ranked[:k]]

    lowered = query.lower()
    is_zone_query = any(w in lowered for w in ZONE_QUERY_KEYWORDS) or (top and top[0].topic == ZONE_TOPIC)
    if is_zone_query:
        zone_cards = [c for c in cards if c.topic == ZONE_TOPIC]
        non_zone_top = [c for c in top if c.topic != ZONE_TOPIC][:k]
        return zone_cards + non_zone_top

    is_limitation_query = any(w in lowered for w in LIMITATION_QUERY_KEYWORDS) or (top and top[0].topic == LIMITATIONS_TOPIC)
    if is_limitation_query:
        limitation_cards = [c for c in cards if c.topic == LIMITATIONS_TOPIC]
        non_limitation_top = [c for c in top if c.topic != LIMITATIONS_TOPIC][:k]
        return limitation_cards + non_limitation_top

    return top
