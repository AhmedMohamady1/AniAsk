"""
Integration tests for the FastAPI endpoints.

These tests use FastAPI's TestClient (built on httpx) to make real HTTP
requests to the app without needing a running server.

We mock the agent's run_agent function to avoid needing a real Gemini
API key during tests.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(mock_settings):
    """Create a test client with mocked settings."""
    from backend.main import app

    return TestClient(app)


class TestHealthEndpoint:
    """Tests for GET /api/health."""

    def test_health_check(self, client):
        """Health endpoint returns 200 with status ok."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestChatEndpoint:
    """Tests for POST /api/chat."""

    @patch("backend.routers.chat.run_agent", new_callable=AsyncMock)
    def test_chat_success(self, mock_agent, client):
        """Successful chat request returns the agent's reply."""
        mock_agent.return_value = "Cowboy Bebop is a classic anime!"

        response = client.post(
            "/api/chat",
            json={"message": "Tell me about Cowboy Bebop"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "Cowboy Bebop" in data["reply"]
        assert data["error"] is None

    def test_chat_empty_message(self, client):
        """Empty message returns 422 validation error."""
        response = client.post("/api/chat", json={"message": ""})
        assert response.status_code == 422

    def test_chat_missing_message(self, client):
        """Missing message field returns 422 validation error."""
        response = client.post("/api/chat", json={})
        assert response.status_code == 422
