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
    "Answer questions about the dashboard's own computed numbers -- the Tourism "
    "Vulnerability Index (TVI) and its six sub-indices (water stress, waste & "
    "sanitation, infrastructure adequacy, economic precarity, socio-cultural pressure, "
    "visitor experience) -- grounded in the JSON context provided below. Do not invent "
    "numbers not present in the context. If asked something the context can't answer, "
    "say so plainly instead of guessing."
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
            "PahadiBot isn't connected to a language model yet (no GROQ_API_KEY set). "
            "Once it's added to backend/.env, I'll be able to answer in plain language -- "
            "for now, here are the current numbers I'd have grounded my answer in: "
            f"{json.dumps(context, indent=2)}"
        )


class GroqLLMClient(LLMClient):
    configured = True

    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
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
        headers = {"Authorization": f"Bearer {self._api_key}"}
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(GROQ_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"]


def get_llm_client() -> LLMClient:
    settings = get_settings()
    if settings.groq_api_key:
        return GroqLLMClient(settings.groq_api_key, settings.groq_model)
    return UnconfiguredLLMClient()
