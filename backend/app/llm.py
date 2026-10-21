"""PahadiBot's chat provider (workflow.md SS8).

A small provider-swappable interface so plugging in the real Groq key later is a
one-file change. No raw respondent free-text is ever sent to the model -- only the
aggregated/derived index numbers already computed by indices.py.
"""
from __future__ import annotations

import json

import httpx

from .config import get_settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are PahadiBot, the assistant for the Nainital Tourism Vulnerability Dashboard. "
    "Answer questions using only the short factual statements retrieved for this "
    "specific question, given below as `retrieved` -- a list of plain-language facts "
    "about the town-wide Tourism Vulnerability Index (TVI) and its six sub-indices, "
    "every surveyed zone's own TVI (use these to answer 'which zone/site is most or "
    "least vulnerable' by comparing the TVI values yourself, don't say you can't), "
    "each stakeholder group's (Tourists/Enterprises/Residents/Workers) pressure "
    "profile, tourism-dependence comparisons, town-wide seasonality/host-visitor "
    "numbers, and the dashboard's own documented limitations (missing data, small "
    "sample sizes, unmeasured pillars, placeholder zone names, equal pillar "
    "weighting pending review, etc. -- answer 'what does this dashboard/data lack' "
    "questions directly from these, don't deflect). If `pinned_selected_zone` is "
    "present, it describes whatever zone the user currently has selected on the "
    "dashboard. Do not invent numbers not present "
    "in the retrieved facts. If the retrieved facts don't cover the question, say so "
    "plainly instead of guessing -- don't assume something is missing from the whole "
    "dashboard just because this particular retrieval didn't surface it."
)


class LLMClient:
    """Base interface. `configured` tells the chat route whether to attempt a real call."""

    configured: bool = False

    async def reply(self, message: str, context: dict) -> str:
        raise NotImplementedError


class UnconfiguredLLMClient(LLMClient):
    configured = False

    async def reply(self, message: str, context: dict) -> str:
        return (
            "PahadiBot isn't connected to a language model yet (no DASHBOARD_GROQ_API_KEY(S) "
            "set). Once it's added to .env, I'll be able to answer in plain language -- for "
            "now, here are the current numbers I'd have grounded my answer in: "
            f"{json.dumps(context, indent=2)}"
        )


class GroqLLMClient(LLMClient):
    """Tries each configured key in order, falling back to the next one only on a
    429 (rate limit) response -- any other error (bad request, auth failure, etc.)
    is raised immediately rather than masked by silently trying the next key."""

    configured = True

    def __init__(self, api_keys: list[str], model: str):
        self._api_keys = api_keys
        self._model = model

    async def reply(self, message: str, context: dict) -> str:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "system", "content": f"Current dashboard context:\n{json.dumps(context)}"},
                {"role": "user", "content": message},
            ],
            "temperature": 0.3,
        }
        last_rate_limit: httpx.HTTPStatusError | None = None
        async with httpx.AsyncClient(timeout=20) as client:
            for key in self._api_keys:
                headers = {"Authorization": f"Bearer {key}"}
                resp = await client.post(GROQ_URL, json=payload, headers=headers)
                if resp.status_code == 429:
                    last_rate_limit = httpx.HTTPStatusError(
                        f"Rate limited (429) on key ending ...{key[-4:]}", request=resp.request, response=resp
                    )
                    continue
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
        assert last_rate_limit is not None
        raise last_rate_limit


def get_llm_client() -> LLMClient:
    settings = get_settings()
    keys = settings.groq_keys()
    if keys:
        return GroqLLMClient(keys, settings.groq_model)
    return UnconfiguredLLMClient()
