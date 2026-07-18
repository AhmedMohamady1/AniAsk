"""
LangChain tool: get detailed information about a specific anime.

This handles deep-dive queries like:
  • "Who are the main voice actors in Steins;Gate?"
  • "Tell me more about anime ID 1234"
  • "What studio made Attack on Titan?"

The agent typically uses search_anime first to find the ID, then calls this
tool to get full details (characters, staff, studios, relations, etc.).
"""

from __future__ import annotations

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from backend.tools.anilist_client import execute_query


# ──────────────────────────────────────────────────────────────────────
# Input schema
# ──────────────────────────────────────────────────────────────────────


class GetAnimeDetailsInput(BaseModel):
    """Input schema for the get_anime_details tool."""

    anime_id: int = Field(
        description="The AniList ID of the anime to get details for. "
        "You can get this from the search_anime tool results."
    )


# ──────────────────────────────────────────────────────────────────────
# GraphQL query — requests a rich set of fields for deep-dive answers
# ──────────────────────────────────────────────────────────────────────

DETAILS_QUERY = """
query GetAnimeDetails($id: Int!) {
    Media(id: $id, type: ANIME) {
        id
        title {
            romaji
            english
            native
        }
        description(asHtml: false)
        format
        status
        season
        seasonYear
        episodes
        duration
        averageScore
        meanScore
        popularity
        favourites
        genres
        tags {
            name
            rank
        }
        studios(isMain: true) {
            nodes {
                name
                siteUrl
            }
        }
        staff(sort: RELEVANCE, perPage: 10) {
            edges {
                role
                node {
                    name {
                        full
                    }
                }
            }
        }
        characters(sort: ROLE, perPage: 15) {
            edges {
                role
                node {
                    name {
                        full
                    }
                }
                voiceActors(language: JAPANESE) {
                    name {
                        full
                    }
                }
            }
        }
        relations {
            edges {
                relationType
                node {
                    id
                    title {
                        romaji
                        english
                    }
                    type
                    format
                    status
                }
            }
        }
        startDate {
            year
            month
            day
        }
        endDate {
            year
            month
            day
        }
        source
        coverImage {
            large
        }
        siteUrl
    }
}
"""


# ──────────────────────────────────────────────────────────────────────
# Helper formatters
# ──────────────────────────────────────────────────────────────────────


def _format_date(date_obj: dict | None) -> str:
    """Format an AniList date object like { year, month, day } → '2023-01-15'."""
    if not date_obj or not date_obj.get("year"):
        return "Unknown"
    parts = [
        str(date_obj["year"]),
        str(date_obj.get("month", "?")).zfill(2),
        str(date_obj.get("day", "?")).zfill(2),
    ]
    return "-".join(parts)


def _format_characters(char_edges: list[dict]) -> str:
    """Format character + voice actor pairs into readable text."""
    if not char_edges:
        return "  No character data available."

    lines = []
    for edge in char_edges:
        char_name = edge.get("node", {}).get("name", {}).get("full", "Unknown")
        role = edge.get("role", "UNKNOWN")
        va_list = edge.get("voiceActors", [])
        va_name = va_list[0]["name"]["full"] if va_list else "N/A"
        lines.append(f"  • {char_name} ({role}) — VA: {va_name}")
    return "\n".join(lines)


def _format_staff(staff_edges: list[dict]) -> str:
    """Format staff entries into readable text."""
    if not staff_edges:
        return "  No staff data available."

    lines = []
    for edge in staff_edges:
        name = edge.get("node", {}).get("name", {}).get("full", "Unknown")
        role = edge.get("role", "Unknown role")
        lines.append(f"  • {name} — {role}")
    return "\n".join(lines)


def _format_relations(rel_edges: list[dict]) -> str:
    """Format related media into readable text."""
    if not rel_edges:
        return "  No related media."

    lines = []
    for edge in rel_edges:
        node = edge.get("node", {})
        title = node.get("title", {}).get("english") or node.get("title", {}).get("romaji", "Unknown")
        rel_type = edge.get("relationType", "UNKNOWN")
        media_type = node.get("type", "?")
        lines.append(f"  • {title} ({media_type}, {node.get('format', '?')}) — {rel_type}")
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────
# Tool definition
# ──────────────────────────────────────────────────────────────────────


@tool("get_anime_details", args_schema=GetAnimeDetailsInput)
def get_anime_details(anime_id: int) -> str:
    """Get detailed information about a specific anime by its AniList ID.

    Use this tool when you need in-depth information about a particular anime,
    such as its synopsis, characters, voice actors, staff, related anime,
    studios, or detailed stats. You should already have the anime's AniList ID
    from a previous search_anime call.
    """
    data = execute_query(DETAILS_QUERY, {"id": anime_id})
    anime = data.get("Media")

    if not anime:
        return f"No anime found with ID {anime_id}."

    title = anime["title"].get("english") or anime["title"].get("romaji", "Unknown")
    studio_names = [s["name"] for s in anime.get("studios", {}).get("nodes", [])]
    studio = studio_names[0] if studio_names else "Unknown studio"

    # Clean up description (AniList sometimes returns HTML even with asHtml: false)
    description = anime.get("description", "No description available.")
    if description:
        # Strip common HTML tags that slip through
        import re

        description = re.sub(r"<br\s*/?>", "\n", description)
        description = re.sub(r"<[^>]+>", "", description)

    # Top tags (ranked ≥ 60%)
    tags = anime.get("tags", [])
    top_tags = [t["name"] for t in tags if t.get("rank", 0) >= 60]

    result = f"""── {title} ──
Title (Romaji): {anime['title'].get('romaji', 'N/A')}
Title (Native): {anime['title'].get('native', 'N/A')}

Format: {anime.get('format', 'N/A')} | Status: {anime.get('status', 'N/A')}
Episodes: {anime.get('episodes', 'N/A')} | Duration: {anime.get('duration', 'N/A')} min/ep
Season: {anime.get('season', '?')} {anime.get('seasonYear', '?')}
Aired: {_format_date(anime.get('startDate'))} → {_format_date(anime.get('endDate'))}
Source: {anime.get('source', 'N/A')}

Score: {anime.get('averageScore', 'N/A')}/100 (Mean: {anime.get('meanScore', 'N/A')}/100)
Popularity: {anime.get('popularity', 'N/A')} | Favourites: {anime.get('favourites', 'N/A')}

Studio: {studio}
Genres: {', '.join(anime.get('genres', []))}
Tags: {', '.join(top_tags) if top_tags else 'N/A'}

Synopsis:
{description}

Characters & Voice Actors:
{_format_characters(anime.get('characters', {}).get('edges', []))}

Key Staff:
{_format_staff(anime.get('staff', {}).get('edges', []))}

Related Media:
{_format_relations(anime.get('relations', {}).get('edges', []))}

AniList URL: {anime.get('siteUrl', 'N/A')}"""

    return result
