"""
Shared GraphQL client for the AniList API.

Why a separate client module?
─────────────────────────────
Every tool needs to POST a GraphQL query to the same endpoint. Instead of
duplicating requests.post() in each tool, we centralise it here. This gives
us a single place to:
  • configure timeouts and retries
  • handle HTTP/GraphQL errors consistently
  • swap the HTTP library later (e.g. httpx for async) without touching tools
"""

from __future__ import annotations

import logging
from typing import Any

import requests

from backend.config import get_settings

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────


class AniListError(Exception):
    """Raised when the AniList API returns an error response."""

    def __init__(self, message: str, errors: list[dict] | None = None):
        super().__init__(message)
        self.errors = errors or []


def execute_query(query: str, variables: dict[str, Any] | None = None) -> dict:
    """
    Execute a GraphQL query against the AniList API.

    Args:
        query: A valid AniList GraphQL query string.
        variables: Optional dict of GraphQL variables.

    Returns:
        The ``data`` portion of the JSON response.

    Raises:
        AniListError: If the API returns GraphQL-level errors.
        requests.HTTPError: If the HTTP request itself fails (4xx/5xx).
        requests.Timeout: If the request exceeds the timeout.
    """
    settings = get_settings()
    payload: dict[str, Any] = {"query": query}
    if variables:
        payload["variables"] = variables

    logger.debug("AniList query: %s | variables: %s", query[:120], variables)

    response = requests.post(
        settings.anilist_api_url,
        json=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        timeout=15,
    )
    response.raise_for_status()

    body = response.json()

    # GraphQL APIs return 200 even on query errors — check the body.
    if "errors" in body:
        error_msgs = [e.get("message", "Unknown error") for e in body["errors"]]
        raise AniListError(
            f"AniList GraphQL errors: {'; '.join(error_msgs)}",
            errors=body["errors"],
        )

    return body.get("data", {})
