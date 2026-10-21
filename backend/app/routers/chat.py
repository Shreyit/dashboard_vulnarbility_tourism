from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from .. import indices, knowledge_base
from ..llm import get_llm_client
from ..schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def post_chat(body: ChatRequest) -> ChatResponse:
    # Retrieval, not context-stuffing: only the cards TF-IDF ranks as relevant to
    # this specific question go into the prompt (knowledge_base.py has the full
    # design rationale, including the zone-query fix for "which zone is most
    # vulnerable"-style questions).
    context: dict = {"retrieved": [c.text for c in knowledge_base.retrieve(body.message, k=8)]}

    if body.zone_id:
        known = {z["zone_id"] for z in indices.list_zones()}
        if body.zone_id not in known:
            raise HTTPException(status_code=404, detail=f"Unknown zone_id '{body.zone_id}'")
        selected = indices.compute_tvi(zone_id=body.zone_id)
        context["pinned_selected_zone"] = (
            f"The user currently has {indices.zone_display_name(body.zone_id)} selected on the "
            f"dashboard: TVI={selected['tvi']}."
        )

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
