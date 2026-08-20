from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import indices
from ..schemas import IndexBundle

router = APIRouter(prefix="/api/indices", tags=["indices"])


@router.get("/town", response_model=IndexBundle)
def get_town_indices() -> IndexBundle:
    return IndexBundle(**indices.compute_tvi(zone_id=None))


@router.get("/zone/{zone_id}", response_model=IndexBundle)
def get_zone_indices(zone_id: str) -> IndexBundle:
    known = {z["zone_id"] for z in indices.list_zones()}
    if zone_id not in known:
        raise HTTPException(status_code=404, detail=f"Unknown zone_id '{zone_id}'")
    return IndexBundle(**indices.compute_tvi(zone_id=zone_id))
