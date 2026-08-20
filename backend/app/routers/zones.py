from __future__ import annotations

from fastapi import APIRouter

from .. import indices
from ..schemas import ZoneOut

router = APIRouter(prefix="/api/zones", tags=["zones"])


def _placeholder_name(zone_id: str) -> str:
    # Real names (Mall Road, Tallital, Naini Lake foreshore, ...) need an OSM Nominatim
    # reverse-geocode pass + user confirmation before they're locked in -- workflow.md
    # SS3 "still open". Until then, a readable placeholder beats the raw "Z01" id.
    n = zone_id.lstrip("Z0") or zone_id
    return f"Site {n}"


@router.get("", response_model=list[ZoneOut])
def get_zones() -> list[ZoneOut]:
    return [
        ZoneOut(
            zone_id=z["zone_id"],
            name=_placeholder_name(z["zone_id"]),
            latitude=z["latitude"],
            longitude=z["longitude"],
        )
        for z in indices.list_zones()
    ]
