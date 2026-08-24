from __future__ import annotations

from fastapi import APIRouter

from .. import indices
from ..schemas import ZoneOut

router = APIRouter(prefix="/api/zones", tags=["zones"])


@router.get("", response_model=list[ZoneOut])
def get_zones() -> list[ZoneOut]:
    return [
        ZoneOut(
            zone_id=z["zone_id"],
            name=indices.zone_display_name(z["zone_id"]),
            latitude=z["latitude"],
            longitude=z["longitude"],
        )
        for z in indices.list_zones()
    ]
