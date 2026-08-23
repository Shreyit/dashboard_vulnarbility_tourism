from __future__ import annotations

from fastapi import APIRouter

from .. import framework_esac, insights, resident_attitudes
from ..schemas import EsacOut, InsightsOut, ResidentAttitudesOut

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
