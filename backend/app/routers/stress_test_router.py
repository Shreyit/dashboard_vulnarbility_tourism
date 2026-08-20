from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import indices, stress_test
from ..schemas import StressTestOut, StressTestRequest

router = APIRouter(prefix="/api/stress-test", tags=["stress-test"])


@router.post("", response_model=StressTestOut)
def post_stress_test(body: StressTestRequest) -> StressTestOut:
    if body.footfall_multiplier < 1:
        raise HTTPException(status_code=422, detail="footfall_multiplier must be >= 1 (1.0 = current baseline)")
    if body.zone_id is not None:
        known = {z["zone_id"] for z in indices.list_zones()}
        if body.zone_id not in known:
            raise HTTPException(status_code=404, detail=f"Unknown zone_id '{body.zone_id}'")
    return StressTestOut(**stress_test.run_stress_test(body.footfall_multiplier, body.zone_id))
