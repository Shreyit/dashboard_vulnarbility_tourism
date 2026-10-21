"""Smoke tests: every route in every router, hit once via FastAPI's TestClient,
expecting 200 + a body. Not a substitute for the more targeted unit tests
elsewhere in this suite -- this is the cheap regression net that catches a
route wired up wrong (bad prefix, missing router registration in main.py,
a schema mismatch) across the whole API at once."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_zones():
    resp = client.get("/api/zones")
    assert resp.status_code == 200
    assert len(resp.json()) == 9


def test_indices_town():
    resp = client.get("/api/indices/town")
    assert resp.status_code == 200
    assert resp.json()["zone_id"] is None


def test_indices_zone():
    zone_id = client.get("/api/zones").json()[0]["zone_id"]
    resp = client.get(f"/api/indices/zone/{zone_id}")
    assert resp.status_code == 200
    assert resp.json()["zone_id"] == zone_id


def test_indices_zone_unknown_404():
    resp = client.get("/api/indices/zone/Z99")
    assert resp.status_code == 404


@pytest.mark.parametrize(
    "path",
    [
        "/api/insights/town",
        "/api/insights/esac",
        "/api/insights/resident-attitudes",
        "/api/insights/worker-dependency",
        "/api/insights/scenario-trend",
        "/api/insights/sustainability-by-stakeholder",
        "/api/insights/demographics",
        "/api/insights/resident-locations",
    ],
)
def test_insights_routes(path):
    resp = client.get(path)
    assert resp.status_code == 200


@pytest.mark.parametrize("theme", ["wsi", "wspi", "iai", "edpi", "scpi", "vei"])
def test_variables_routes(theme):
    resp = client.get(f"/api/variables/{theme}")
    assert resp.status_code == 200
    assert resp.json()["theme"] == theme


def test_variables_unknown_theme_404():
    resp = client.get("/api/variables/not-a-theme")
    assert resp.status_code == 404


def test_stress_test():
    resp = client.post("/api/stress-test", json={"footfall_multiplier": 1.5, "zone_id": None})
    assert resp.status_code == 200
    assert resp.json()["footfall_multiplier"] == 1.5


def test_chat_unconfigured_or_configured():
    resp = client.post("/api/chat", json={"message": "Which zone is most vulnerable?"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["grounded"] is True
    assert isinstance(body["reply"], str) and body["reply"]


@pytest.mark.parametrize(
    "path",
    ["/api/ml/zone-clusters", "/api/ml/dependency-model", "/api/ml/sensitivity"],
)
def test_ml_routes(path):
    resp = client.get(path)
    assert resp.status_code == 200
