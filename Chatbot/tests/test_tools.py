"""Unit tests for the AniList tools."""

from __future__ import annotations

from unittest.mock import patch


class TestSearchAnime:
    """Tests for the search_anime tool."""

    @patch("backend.tools.search_anime.execute_query")
    def test_search_by_title(self, mock_query, mock_anilist_search_response):
        """Searching by title passes the search term to GraphQL variables."""
        mock_query.return_value = mock_anilist_search_response["data"]

        from backend.tools.search_anime import search_anime

        result = search_anime.invoke({"search": "Cowboy Bebop"})

        # Verify execute_query was called
        mock_query.assert_called_once()
        call_args = mock_query.call_args
        variables = call_args[0][1]  # Second positional arg
        assert variables["search"] == "Cowboy Bebop"

        # Verify the result contains expected info
        assert "Cowboy Bebop" in result
        assert "86" in result  # Score
        assert "Sunrise" in result  # Studio

    @patch("backend.tools.search_anime.execute_query")
    def test_search_no_results(self, mock_query):
        """When no anime match, a clear message is returned."""
        mock_query.return_value = {
            "Page": {"pageInfo": {}, "media": []}
        }

        from backend.tools.search_anime import search_anime

        result = search_anime.invoke({"search": "xyznonexistent"})
        assert "No anime found" in result

    @patch("backend.tools.search_anime.execute_query")
    def test_search_with_filters(self, mock_query, mock_anilist_search_response):
        """Multiple filters are passed correctly to GraphQL."""
        mock_query.return_value = mock_anilist_search_response["data"]

        from backend.tools.search_anime import search_anime

        search_anime.invoke({
            "genre": "Sci-Fi",
            "season": "SPRING",
            "season_year": 2024,
            "sort": "SCORE_DESC",
        })

        call_args = mock_query.call_args
        variables = call_args[0][1]
        assert variables["genre"] == "Sci-Fi"
        assert variables["season"] == "SPRING"
        assert variables["seasonYear"] == 2024
        assert variables["sort"] == ["SCORE_DESC"]


class TestGetAnimeDetails:
    """Tests for the get_anime_details tool."""

    @patch("backend.tools.get_anime_details.execute_query")
    def test_get_details_success(self, mock_query, mock_anilist_details_response):
        """Getting details returns formatted info with characters and staff."""
        mock_query.return_value = mock_anilist_details_response["data"]

        from backend.tools.get_anime_details import get_anime_details

        result = get_anime_details.invoke({"anime_id": 1})

        # Verify key information is present
        assert "Cowboy Bebop" in result
        assert "Spike Spiegel" in result
        assert "Kouichi Yamadera" in result
        assert "Shinichiro Watanabe" in result
        assert "Director" in result
        assert "Sunrise" in result
        assert "86" in result

    @patch("backend.tools.get_anime_details.execute_query")
    def test_get_details_not_found(self, mock_query):
        """When anime ID doesn't exist, a clear message is returned."""
        mock_query.return_value = {"Media": None}

        from backend.tools.get_anime_details import get_anime_details

        result = get_anime_details.invoke({"anime_id": 999999})
        assert "No anime found" in result
