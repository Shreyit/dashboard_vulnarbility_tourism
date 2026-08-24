from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from .. import indices, insights, resident_attitudes, worker_attitudes
from ..llm import get_llm_client
from ..schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _zone_summaries() -> list[dict]:
    """Every zone's own TVI, town-wide -- not just whichever one (if any) the caller
    has selected. PahadiBot is a single floating launcher with no per-zone selection
    of its own (workflow.md #8), so without this a question like "which zone is most
    vulnerable" had nothing to answer from."""
    return [
        {"zone_id": z["zone_id"], "name": indices.zone_display_name(z["zone_id"]), "tvi": indices.compute_tvi(z["zone_id"])["tvi"]}
        for z in indices.list_zones()
    ]


@router.post("", response_model=ChatResponse)
async def post_chat(body: ChatRequest) -> ChatResponse:
    context: dict = {
        "town": indices.compute_tvi(zone_id=None),
        "zones": _zone_summaries(),
        # The dashboard's narrative: per-stakeholder-group pillar profiles (Tourists/
        # Enterprises/Residents/Workers) and the two tourism-dependence comparisons --
        # everything the Tourists/Enterprises/Locals/Workers/Synthesis tabs surface.
        "sustainability_by_stakeholder": insights.compute_sustainability_by_stakeholder(),
        "town_insights": insights.compute_insights(),
        "resident_tourism_dependency_comparison": resident_attitudes.compute_resident_attitudes(),
        "worker_tourism_dependency_comparison": worker_attitudes.compute_worker_attitudes(),
    }
    if body.zone_id:
        known = {z["zone_id"] for z in indices.list_zones()}
        if body.zone_id not in known:
            raise HTTPException(status_code=404, detail=f"Unknown zone_id '{body.zone_id}'")
        context["selected_zone"] = indices.compute_tvi(zone_id=body.zone_id)

    client = get_llm_client()
    try:
        reply = await client.reply(body.message, context)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            reply = (
                "All of PahadiBot's configured Groq keys are rate-limited right now -- "
                "try again in a moment."
            )
        else:
            raise HTTPException(status_code=502, detail=f"Groq request failed: {exc}") from exc
    return ChatResponse(reply=reply, grounded=True, llm_configured=client.configured)
