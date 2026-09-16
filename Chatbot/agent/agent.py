"""
AniAsk agent entry point.

Planned flow:
1. Take a natural language question
2. Agent decides which tool(s) to call and with what parameters
3. Tool executes an AniList GraphQL query
4. Agent turns the raw JSON result into a natural language answer

Start with LangChain's standard tool-calling agent (or LangGraph if you want
more explicit control over the loop), wired to the tools in tools/anilist_tools.py.
"""

# TODO: load env vars, initialize LLM, register tools, build agent executor
