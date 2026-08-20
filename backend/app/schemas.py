from __future__ import annotations

from pydantic import BaseModel


class ZoneOut(BaseModel):
    zone_id: str
    name: str
    latitude: float | None
    longitude: float | None


class ComponentDetail(BaseModel):
    component: str
    value: float
    town_wide_proxy: bool


class IndexBundle(BaseModel):
    zone_id: str | None
    tvi: float | None
    sub_indices: dict[str, float | None]
    details: dict[str, list[ComponentDetail]]


class VariablesOut(BaseModel):
    theme: str
    label: str
    zone_id: str | None
    components: list[ComponentDetail]


class StressTestRequest(BaseModel):
    footfall_multiplier: float = 1.0
    zone_id: str | None = None


class StressTestOut(BaseModel):
    footfall_multiplier: float
    zone_id: str | None
    baseline: dict
    scenario: dict
    elasticities: dict[str, float]
    footfall_anchors: dict
    note: str


class ChatRequest(BaseModel):
    message: str
    zone_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    grounded: bool
    llm_configured: bool
