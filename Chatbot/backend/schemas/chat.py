"""Pydantic schemas for the chat API request and response models."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MessageEntry(BaseModel):
    """A single message in the conversation history."""

    role: str = Field(
        description="The role of the message sender: 'user' or 'assistant'.",
    )
    content: str = Field(
        description="The text content of the message.",
    )


class ChatRequest(BaseModel):
    """Request body for POST /api/chat."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's natural language question about anime/manga.",
        examples=["What's the highest rated anime this season?"],
    )
    history: list[MessageEntry] = Field(
        default_factory=list,
        description="Previous messages in the conversation for context (max ~20).",
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


class SummarizeTitleRequest(BaseModel):
    """Request body for POST /api/summarize-title."""

    messages: list[MessageEntry] = Field(
        ...,
        min_length=1,
        max_length=6,
        description="The first few messages of a conversation to summarize.",
    )


class SummarizeTitleResponse(BaseModel):
    """Response body for POST /api/summarize-title."""

    title: str = Field(
        description="A short 3-6 word summary title for the conversation.",
    )
