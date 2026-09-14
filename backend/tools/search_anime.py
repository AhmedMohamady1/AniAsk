"""
LangChain tool: search for anime on AniList.

This is the agent's primary discovery tool — it handles questions like:
  • "What's the highest rated anime this season?"
  • "Find me isekai anime from the 2020s"
  • "Search for anime about time travel"
"""

from __future__ import annotations

from typing import Optional

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from backend.tools.anilist_client import execute_query


# ──────────────────────────────────────────────────────────────────────
# Input schema — Pydantic model gives the LLM structured parameter info
# ──────────────────────────────────────────────────────────────────────


class SearchAnimeInput(BaseModel):
    """Input schema for the search_anime tool."""

    search: Optional[str] = Field(
        default=None,
        description="Search term to find anime by title (e.g. 'Steins;Gate', 'Attack on Titan').",
    )
    genre: Optional[str] = Field(
        default=None,
        description="Filter by genre. Must be one of: Action, Adventure, Comedy, Drama, "
        "Ecchi, Fantasy, Horror, Mahou Shoujo, Mecha, Music, Mystery, "
        "Psychological, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Thriller.",
    )
    season: Optional[str] = Field(
        default=None,
        description="Filter by season. Must be one of: WINTER, SPRING, SUMMER, FALL.",
    )
    season_year: Optional[int] = Field(
        default=None,
        description="Filter by the year of the season (e.g. 2024).",
    )
    sort: Optional[str] = Field(
        default=None,
        description="How to sort results. Must be one of: SCORE_DESC (highest rated), "
        "POPULARITY_DESC (most popular), TRENDING_DESC (trending now), "
        "START_DATE_DESC (newest first), FAVOURITES_DESC (most favourited).",
    )
    status: Optional[str] = Field(
        default=None,
        description="Filter by airing status. Must be one of: FINISHED, RELEASING, "
        "NOT_YET_RELEASED, CANCELLED, HIATUS.",
    )
    format: Optional[str] = Field(
        default=None,
        description="Filter by format. Must be one of: TV, TV_SHORT, MOVIE, SPECIAL, "
        "OVA, ONA, MUSIC, MANGA, NOVEL, ONE_SHOT.",
    )
    page: int = Field(
        default=1,
        description="Page number for pagination (starts at 1).",
    )
    per_page: int = Field(
        default=10,
        description="Number of results per page (max 50).",
    )


# ──────────────────────────────────────────────────────────────────────
# GraphQL query template
# ──────────────────────────────────────────────────────────────────────

SEARCH_QUERY = """
query SearchAnime(
    $search: String,
    $genre: String,
    $season: MediaSeason,
    $seasonYear: Int,
    $sort: [MediaSort],
    $status: MediaStatus,
    $format: MediaFormat,
    $page: Int,
    $perPage: Int
) {
    Page(page: $page, perPage: $perPage) {
        pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
        }
        media(
            search: $search,
            genre: $genre,
            season: $season,
            seasonYear: $seasonYear,
            sort: $sort,
            status: $status,
            format: $format,
            type: ANIME
        ) {
            id
            title {
                romaji
                english
                native
            }
            format
            status
            season
            seasonYear
            episodes
            averageScore
            meanScore
            popularity
            genres
            studios(isMain: true) {
                nodes {
                    name
                }
            }
            coverImage {
                large
            }
            siteUrl
        }
    }
}
"""


# ──────────────────────────────────────────────────────────────────────
# Tool definition
# ──────────────────────────────────────────────────────────────────────


@tool("search_anime", args_schema=SearchAnimeInput)
def search_anime(
    search: str | None = None,
    genre: str | None = None,
    season: str | None = None,
    season_year: int | None = None,
    sort: str | None = None,
    status: str | None = None,
    format: str | None = None,
    page: int = 1,
    per_page: int = 10,
) -> str:
    """Search for anime on AniList by title, genre, season, year, or sorting criteria.

    Use this tool when the user wants to discover, find, or list anime based on
    search criteria. Returns a list of matching anime with titles, scores, genres,
    and other metadata.
    """
    # Build variables dict — only include non-None values so AniList ignores
    # filters the user didn't specify.
    variables: dict = {"page": page, "perPage": min(per_page, 50)}

    if search:
        variables["search"] = search
    if genre:
        variables["genre"] = genre
    if season:
        variables["season"] = season.upper()
    if season_year:
        variables["seasonYear"] = season_year
    if sort:
        variables["sort"] = [sort.upper()]
    if status:
        variables["status"] = status.upper()
    if format:
        variables["format"] = format.upper()

    data = execute_query(SEARCH_QUERY, variables)
    page_data = data.get("Page", {})
    media_list = page_data.get("media", [])
    page_info = page_data.get("pageInfo", {})

    if not media_list:
        return "No anime found matching the given criteria."

    # Format results as a readable string for the LLM to interpret.
    results = []
    for anime in media_list:
        title = anime["title"].get("english") or anime["title"].get("romaji", "Unknown")
        studio_names = [s["name"] for s in anime.get("studios", {}).get("nodes", [])]
        studio = studio_names[0] if studio_names else "Unknown studio"

        cover = anime.get("coverImage", {}).get("large", "")

        entry = (
            f"• {title}\n"
            f"  ID: {anime['id']} | Score: {anime.get('averageScore', 'N/A')}/100 | "
            f"Format: {anime.get('format', 'N/A')} | Status: {anime.get('status', 'N/A')}\n"
            f"  Episodes: {anime.get('episodes', 'N/A')} | "
            f"Season: {anime.get('season', '?')} {anime.get('seasonYear', '?')}\n"
            f"  Genres: {', '.join(anime.get('genres', []))}\n"
            f"  Studio: {studio}\n"
            f"  Cover: {cover}\n"
            f"  URL: {anime.get('siteUrl', 'N/A')}"
        )
        results.append(entry)

    header = (
        f"Found {page_info.get('total', '?')} results "
        f"(page {page_info.get('currentPage', '?')}/{page_info.get('lastPage', '?')}):\n\n"
    )
    return header + "\n\n".join(results)
