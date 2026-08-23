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


class EsacZoneOut(BaseModel):
    zone_id: str
    composite: float | None
    band: str | None


class EsacOut(BaseModel):
    exposure: float | None
    sensitivity: float | None
    adaptive_capacity: float | None
    composite: float | None
    band: str | None
    zones: list[EsacZoneOut]


class GroupComparisonOut(BaseModel):
    n_dependent: int
    n_non_dependent: int
    mean_dependent: float
    mean_non_dependent: float
    median_dependent: float
    median_non_dependent: float
    p_value: float
    rank_biserial: float
    band: str


class ResidentAttitudesOut(BaseModel):
    group_sizes: dict[str, int]
    aggregate: GroupComparisonOut | None
    pillars: dict[str, GroupComparisonOut | None]


class ScenarioTrendPoint(BaseModel):
    label: str
    multiplier: float
    tvi: float | None


class StakeholderTriadOut(BaseModel):
    economic: float | None
    environmental: float | None
    social: float | None


class DemographicBar(BaseModel):
    label: str
    value: float
    count: int


class DemographicsOut(BaseModel):
    respondent_mix: list[DemographicBar]
    zones_surveyed: int
    tourist_age_group: list[DemographicBar]
    tourist_gender: list[DemographicBar]
    tourist_first_visit: list[DemographicBar]
    tourist_accommodation: list[DemographicBar]
    enterprise_type: list[DemographicBar]
    worker_sector: list[DemographicBar]
