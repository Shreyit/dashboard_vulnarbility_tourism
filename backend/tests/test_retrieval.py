"""The eval harness for PahadiBot's retrieval layer (knowledge_base.py): a
small hand-labeled (query, expected_topic) set, asserting recall@k -- does the
top-k retrieval actually surface a card from the topic the question is about.
Doubles as a regression test for the exact "which zone is most vulnerable"
retrieval fix (a query matching ZONE_QUERY_KEYWORDS must return every zone
card, not just the most textually-similar few)."""
from app.knowledge_base import LIMITATIONS_TOPIC, ZONE_TOPIC, retrieve

CASES = [
    ("Which zone is most vulnerable?", ZONE_TOPIC),
    ("What is the town-wide TVI?", "town"),
    ("What sub-indices make up the TVI?", "methodology"),
    ("How do tourists feel about their experience?", "stakeholders"),
    ("Are tourism-dependent residents worse off than non-dependent ones?", "dependency"),
    ("How does tourism income affect workers?", "stakeholders"),
    ("How much worse does peak season get?", "insights"),
    ("What is the host-visitor perception gap?", "insights"),
    ("What does this dashboard and the data lack?", LIMITATIONS_TOPIC),
    ("What are the limitations of this analysis?", LIMITATIONS_TOPIC),
]


def test_retrieval_recall_at_k():
    hits = 0
    for query, expected_topic in CASES:
        results = retrieve(query, k=8)
        if any(c.topic == expected_topic for c in results):
            hits += 1
    recall = hits / len(CASES)
    assert recall >= 0.75, f"retrieval recall@8 was only {recall:.2f} over {len(CASES)} labeled queries"


def test_zone_comparison_query_returns_every_zone_card():
    results = retrieve("Which zone is most vulnerable?", k=8)
    zone_cards = [c for c in results if c.topic == ZONE_TOPIC]
    assert len(zone_cards) == 9  # all 9 real zones, not just the top-k most textually similar


def test_limitation_query_returns_every_limitation_card():
    results = retrieve("What does this dashboard and the data lack?", k=8)
    limitation_cards = [c for c in results if c.topic == LIMITATIONS_TOPIC]
    assert len(limitation_cards) == 10  # every documented caveat, not just the top-k most similar
