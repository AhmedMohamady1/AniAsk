"""FastAPI route handlers for the chat API."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from backend.agent.graph import run_agent
from backend.schemas.chat import ChatRequest, ChatResponse, HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint — returns 200 if the server is running."""
    return HealthResponse()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a natural language question to the AniAsk agent.

    The agent will:
    1. Parse your question
    2. Query the AniList API using its tools
    3. Return a formatted natural language answer
    """
    logger.info("Chat request: %s", request.message[:100])

    try:
        history = [
            {"role": entry.role, "content": entry.content}
            for entry in request.history
        ]
        reply = await run_agent(request.message, history=history)
        return ChatResponse(reply=reply)
    except Exception as e:
        logger.exception("Agent error for message: %s", request.message[:100])
        raise HTTPException(
            status_code=500,
            detail=f"Agent encountered an error: {str(e)}",
        ) from e
