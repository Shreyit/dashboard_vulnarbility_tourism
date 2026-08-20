from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from .. import indices
from ..schemas import VariablesOut

router = APIRouter(prefix="/api/variables", tags=["variables"])


@router.get("/{theme}", response_model=VariablesOut)
def get_theme_variables(theme: str, zone_id: str | None = Query(default=None)) -> VariablesOut:
    theme = theme.lower()
    if theme not in indices.THEME_COMPONENTS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown theme '{theme}'. Valid: {sorted(indices.THEME_COMPONENTS)}",
        )
    _, detail = indices.compute_subindex(theme, zone_id)
    return VariablesOut(theme=theme, label=indices.THEME_LABELS[theme], zone_id=zone_id, components=detail)
