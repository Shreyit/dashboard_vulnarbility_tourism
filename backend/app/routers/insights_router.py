from __future__ import annotations

from fastapi import APIRouter

from .. import demographics, framework_esac, insights, resident_attitudes, stress_test, worker_attitudes
from ..schemas import (
    DemographicsOut,
    EsacOut,
    InsightsOut,
    ResidentAttitudesOut,
    ResidentLocationOut,
    ScenarioTrendPoint,
    StakeholderTriadOut,
)

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/town", response_model=InsightsOut)
def get_town_insights() -> InsightsOut:
    return InsightsOut(**insights.compute_insights())


@router.get("/esac", response_model=EsacOut)
def get_esac_framework() -> EsacOut:
    return EsacOut(**framework_esac.compute_esac_full())


@router.get("/resident-attitudes", response_model=ResidentAttitudesOut)
def get_resident_attitudes() -> ResidentAttitudesOut:
    return ResidentAttitudesOut(**resident_attitudes.compute_resident_attitudes())


@router.get("/worker-dependency", response_model=ResidentAttitudesOut)
def get_worker_dependency() -> ResidentAttitudesOut:
    return ResidentAttitudesOut(**worker_attitudes.compute_worker_attitudes())


@router.get("/scenario-trend", response_model=list[ScenarioTrendPoint])
def get_scenario_trend() -> list[ScenarioTrendPoint]:
    return [ScenarioTrendPoint(**p) for p in stress_test.compute_scenario_trend()]


@router.get("/sustainability-by-stakeholder", response_model=dict[str, StakeholderTriadOut])
def get_sustainability_by_stakeholder() -> dict[str, StakeholderTriadOut]:
    return {k: StakeholderTriadOut(**v) for k, v in insights.compute_sustainability_by_stakeholder().items()}


@router.get("/demographics", response_model=DemographicsOut)
def get_demographics() -> DemographicsOut:
    return DemographicsOut(**demographics.compute_demographics())


@router.get("/resident-locations", response_model=list[ResidentLocationOut])
def get_resident_locations() -> list[ResidentLocationOut]:
    return [ResidentLocationOut(**r) for r in demographics.compute_resident_locations()]
