"""Pydantic schemas for the chat API request and response models."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for POST /api/chat."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's natural language question about anime/manga.",
        examples=["What's the highest rated anime this season?"],
    )


class ChatResponse(BaseModel):
    """Response body for POST /api/chat."""

    reply: str = Field(
        description="The agent's natural language answer."
    )
    error: str | None = Field(
        default=None,
        description="Error message if something went wrong.",
    )


class HealthResponse(BaseModel):
    """Response body for GET /api/health."""

    status: str = "ok"
