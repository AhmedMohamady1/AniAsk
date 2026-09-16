"""FastAPI route handler for conversation title summarization."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.config import get_settings
from backend.schemas.chat import SummarizeTitleRequest, SummarizeTitleResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["summarize"])

_TITLE_PROMPT = (
    "Generate a short, concise title (3-6 words) that summarizes this conversation. "
    "Return ONLY the title text, nothing else. No quotes, no punctuation at the end.\n\n"
)


@router.post("/summarize-title", response_model=SummarizeTitleResponse)
async def summarize_title(request: SummarizeTitleRequest):
    """Generate a short summary title for a conversation from its first messages."""
    settings = get_settings()

    # Build a compact transcript for the LLM
    transcript = "\n".join(
        f"{msg.role.capitalize()}: {msg.content}" for msg in request.messages
    )

    try:
        llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key,
            temperature=0.3,
        )

        response = await llm.ainvoke(_TITLE_PROMPT + transcript)

        # Extract text from the response
        title = response.content
        if isinstance(title, list):
            title = " ".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in title
            )

        # Clean up: strip quotes and trailing punctuation
        title = title.strip().strip('"\'').strip(".")

        # Fallback if LLM returns empty
        if not title:
            title = request.messages[0].content[:50]

        return SummarizeTitleResponse(title=title)

    except Exception as e:
        logger.exception("Title summarization error")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate title: {str(e)}",
        ) from e
