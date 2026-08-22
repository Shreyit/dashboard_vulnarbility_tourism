from __future__ import annotations

from fastapi import APIRouter

from .. import insights
from ..schemas import InsightsOut

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/town", response_model=InsightsOut)
def get_town_insights() -> InsightsOut:
    return InsightsOut(**insights.compute_insights())
