"""
LangChain tools that wrap AniList's GraphQL API.

Each tool below should:
1. Accept natural-language-derived parameters (e.g. title, genre, season, sort field)
2. Build a valid AniList GraphQL query/variables payload
3. Execute the request against ANILIST_API_URL
4. Return a clean, structured result for the agent to reason over

Start simple: one or two tools covering your core query types
(e.g. "search anime by title/genre/season" and "get anime details by id"),
then expand as you cover more of your test query set.
"""

import os
import requests

ANILIST_API_URL = os.getenv("ANILIST_API_URL", "https://graphql.anilist.co")


def run_anilist_query(query: str, variables: dict) -> dict:
    """Execute a raw GraphQL query against AniList and return the JSON response."""
    response = requests.post(
        ANILIST_API_URL,
        json={"query": query, "variables": variables},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


# TODO: define your first tool, e.g. search_anime(title=None, genre=None, sort=None, ...)
