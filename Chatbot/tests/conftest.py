"""Pytest fixtures shared across all test modules."""

from __future__ import annotations

from unittest.mock import patch

import pytest


@pytest.fixture
def mock_anilist_search_response():
    """A sample AniList search response for testing."""
    return {
        "data": {
            "Page": {
                "pageInfo": {
                    "total": 1,
                    "currentPage": 1,
                    "lastPage": 1,
                    "hasNextPage": False,
                },
                "media": [
                    {
                        "id": 1,
                        "title": {
                            "romaji": "Cowboy Bebop",
                            "english": "Cowboy Bebop",
                            "native": "カウボーイビバップ",
                        },
                        "format": "TV",
                        "status": "FINISHED",
                        "season": "SPRING",
                        "seasonYear": 1998,
                        "episodes": 26,
                        "averageScore": 86,
                        "meanScore": 86,
                        "popularity": 200000,
                        "genres": ["Action", "Adventure", "Drama", "Sci-Fi"],
                        "studios": {"nodes": [{"name": "Sunrise"}]},
                        "coverImage": {"large": "https://example.com/cover.jpg"},
                        "siteUrl": "https://anilist.co/anime/1",
                    }
                ],
            }
        }
    }


@pytest.fixture
def mock_anilist_details_response():
    """A sample AniList anime details response for testing."""
    return {
        "data": {
            "Media": {
                "id": 1,
                "title": {
                    "romaji": "Cowboy Bebop",
                    "english": "Cowboy Bebop",
                    "native": "カウボーイビバップ",
                },
                "description": "A story about bounty hunters in space.",
                "format": "TV",
                "status": "FINISHED",
                "season": "SPRING",
                "seasonYear": 1998,
                "episodes": 26,
                "duration": 24,
                "averageScore": 86,
                "meanScore": 86,
                "popularity": 200000,
                "favourites": 50000,
                "genres": ["Action", "Adventure", "Drama", "Sci-Fi"],
                "tags": [
                    {"name": "Space", "rank": 95},
                    {"name": "Ensemble Cast", "rank": 88},
                ],
                "studios": {
                    "nodes": [
                        {"name": "Sunrise", "siteUrl": "https://anilist.co/studio/14"}
                    ]
                },
                "staff": {
                    "edges": [
                        {
                            "role": "Director",
                            "node": {"name": {"full": "Shinichiro Watanabe"}},
                        }
                    ]
                },
                "characters": {
                    "edges": [
                        {
                            "role": "MAIN",
                            "node": {"name": {"full": "Spike Spiegel"}},
                            "voiceActors": [
                                {"name": {"full": "Kouichi Yamadera"}}
                            ],
                        }
                    ]
                },
                "relations": {"edges": []},
                "startDate": {"year": 1998, "month": 4, "day": 3},
                "endDate": {"year": 1999, "month": 4, "day": 24},
                "source": "ORIGINAL",
                "coverImage": {"large": "https://example.com/cover.jpg"},
                "siteUrl": "https://anilist.co/anime/1",
            }
        }
    }


@pytest.fixture
def mock_settings():
    """Patch settings to avoid needing a real .env file during tests."""
    with patch("backend.config.get_settings") as mock:
        settings = mock.return_value
        settings.google_api_key = "test-key"
        settings.anilist_api_url = "https://graphql.anilist.co"
        settings.gemini_model = "gemini-3.1-flash-lite"
        yield settings
