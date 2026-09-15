"""LangGraph state graph for the AniAsk agent."""

from __future__ import annotations

import logging

from langchain_core.messages import SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from backend.agent.prompts import get_system_prompt
from backend.agent.state import AgentState
from backend.config import get_settings
from backend.tools.get_anime_details import get_anime_details
from backend.tools.search_anime import search_anime
from backend.tools.search_studio import search_studio

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────
# Tools registry
# ──────────────────────────────────────────────────────────────────────

TOOLS = [search_anime, get_anime_details, search_studio]


# ──────────────────────────────────────────────────────────────────────
# Graph construction
# ──────────────────────────────────────────────────────────────────────


def _build_graph() -> StateGraph:
    """Build the LangGraph state graph (not yet compiled)."""
    settings = get_settings()

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.3,
        convert_system_message_to_human=False,
    )

    llm_with_tools = llm.bind_tools(TOOLS)

    # ── Node: call_model ──────────────────────────────────────────────
    def call_model(state: AgentState) -> dict:
        """Invoke the LLM with the current conversation + system prompt."""
        messages = state["messages"]

        # Prepend the system prompt (with current date/season) if not present
        if not messages or not isinstance(messages[0], SystemMessage):
            messages = [SystemMessage(content=get_system_prompt())] + messages

        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    # ── Node: call_tools ──────────────────────────────────────────────
    tool_node = ToolNode(TOOLS)

    # ── Conditional edge ──────────────────────────────────────────────
    def should_continue(state: AgentState) -> str:
        """Route to 'tools' if the LLM made tool calls, else 'end'."""
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return "end"

    # ── Assemble the graph ────────────────────────────────────────────
    graph = StateGraph(AgentState)
    graph.add_node("call_model", call_model)
    graph.add_node("call_tools", tool_node)
    graph.set_entry_point("call_model")
    graph.add_conditional_edges(
        "call_model",
        should_continue,
        {"tools": "call_tools", "end": END},
    )
    graph.add_edge("call_tools", "call_model")

    return graph


# ──────────────────────────────────────────────────────────────────────
# Compiled graph (lazy singleton)
# ──────────────────────────────────────────────────────────────────────

_compiled_graph = None


def get_graph():
    """Return the compiled agent graph (lazy singleton)."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = _build_graph().compile()
    return _compiled_graph


# ──────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────


def _extract_text(content) -> str:
    """Extract plain text from Gemini response content.

    Gemini sometimes returns content as a list of dicts like
    [{'type': 'text', 'text': '...'}] instead of a plain string.
    This normalises it to always return a string.
    """
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict) and "text" in part:
                parts.append(part["text"])
            elif isinstance(part, str):
                parts.append(part)
        return "\n".join(parts)
    return str(content)


async def run_agent(user_message: str, history: list[dict] | None = None) -> str:
    """Run the AniAsk agent with a user message and return the final response.

    Args:
        user_message: The current user message.
        history: Optional list of previous messages as dicts with 'role' and
                 'content' keys.  These are prepended to give the agent
                 conversational context.
    """
    from langchain_core.messages import AIMessage, HumanMessage

    graph = get_graph()

    # Build the message list: history first, then the current message.
    messages: list = []
    if history:
        for entry in history:
            if entry["role"] == "user":
                messages.append(HumanMessage(content=entry["content"]))
            else:
                messages.append(AIMessage(content=entry["content"]))
    messages.append(HumanMessage(content=user_message))

    result = await graph.ainvoke({"messages": messages})

    final_message = result["messages"][-1]
    return _extract_text(final_message.content)
