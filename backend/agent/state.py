"""Agent state definition for the LangGraph state graph."""

from __future__ import annotations

from typing import Annotated

from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """State that flows through the AniAsk agent graph.

    Attributes:
        messages: The conversation history. Uses the ``add_messages`` reducer
                  so new messages are appended, not replaced.
    """

    messages: Annotated[list, add_messages]
