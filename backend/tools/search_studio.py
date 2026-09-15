"""
LangChain tool: search for an animation studio and its produced anime on AniList.

This handles studio queries like:
  • "What anime has Studio MAPPA produced?"
  • "What shows did Kyoto Animation make?"
  • "Tell me about ufotable anime"
"""

from __future__ import annotations

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from backend.tools.anilist_client import execute_query


class SearchStudioInput(BaseModel):
    """Input schema for the search_studio tool."""

    studio_name: str = Field(
        description="The name of the animation studio (e.g. 'MAPPA', 'Kyoto Animation', 'ufotable', 'Bones', 'Madhouse', 'Wit Studio')."
    )
    per_page: int = Field(
        default=12,
        description="Number of top anime works to retrieve for this studio (max 25).",
    )


STUDIO_QUERY = """
query SearchStudio($search: String!, $perPage: Int!) {
    Studio(search: $search) {
        id
        name
        siteUrl
        favourites
        media(sort: POPULARITY_DESC, perPage: $perPage) {
            nodes {
                id
                title {
                    english
                    romaji
                }
                format
                episodes
                averageScore
                seasonYear
                genres
                coverImage {
                    large
                }
                siteUrl
            }
        }
    }
}
"""


@tool("search_studio", args_schema=SearchStudioInput)
def search_studio(studio_name: str, per_page: int = 12) -> str:
    """Search for an animation studio and get its most popular produced anime works.

    Use this tool whenever the user asks about an animation studio or what anime
    a studio has created or animated. Returns the studio profile along with its
    top works, their cover images, scores, and AniList URLs.
    """
    limit = max(1, min(per_page, 25))
    variables = {"search": studio_name.strip(), "perPage": limit}

    data = execute_query(STUDIO_QUERY, variables)
    studio = data.get("Studio")

    if not studio:
        return f"No animation studio found matching '{studio_name}'."

    name = studio.get("name", studio_name)
    site_url = studio.get("siteUrl", "")
    media_nodes = studio.get("media", {}).get("nodes", [])

    header = f"Studio: {name} | URL: {site_url}\n"
    header += f"Top {len(media_nodes)} anime produced by {name} (sorted by popularity):\n\n"

    # Deduplicate in case AniList returns duplicate entries for multi-part releases
    seen_ids = set()
    entries = []

    for anime in media_nodes:
        anime_id = anime.get("id")
        if anime_id in seen_ids:
            continue
        seen_ids.add(anime_id)

        title = anime["title"].get("english") or anime["title"].get("romaji", "Unknown")
        romaji = anime["title"].get("romaji")
        score = anime.get("averageScore")
        score_str = f"{score}/100" if score is not None else "N/A"
        format_val = anime.get("format", "TV")
        episodes = anime.get("episodes", "N/A")
        year = anime.get("seasonYear", "?")
        genres = ", ".join(anime.get("genres", [])[:3])
        cover = anime.get("coverImage", {}).get("large", "")
        url = anime.get("siteUrl", "")

        entry = (
            f"• {title}\n"
            f"  Romaji: {romaji}\n"
            f"  Format: {format_val} | Episodes: {episodes} | Year: {year} | Score: {score_str}\n"
            f"  Genres: {genres}\n"
            f"  Cover: {cover}\n"
            f"  URL: {url}"
        )
        entries.append(entry)

    return header + "\n\n".join(entries)
