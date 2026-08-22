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


class SustainabilityTriadOut(BaseModel):
    economic: float | None
    environmental: float | None
    social: float | None


class StakeholderMatrixOut(BaseModel):
    surveys: list[str]
    themes: list[str]
    matrix: dict[str, dict[str, float | None]]


class SeasonalityOut(BaseModel):
    value: float | None
    components: list[ComponentDetail]


class HostVisitorGapOut(BaseModel):
    visitor_satisfaction: float | None
    host_sentiment: float | None
    gap: float | None
    doxey_stage: str | None


class InsightsOut(BaseModel):
    sustainability: SustainabilityTriadOut
    stakeholder_matrix: StakeholderMatrixOut
    seasonality: SeasonalityOut
    host_visitor_gap: HostVisitorGapOut
