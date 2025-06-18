import asyncio
import json

import httpx
import pytest

from app.services.tavily_client import TavilyClient


@pytest.mark.asyncio
async def test_search_returns_results_and_caches(monkeypatch):
    """TavilyClient.search should return parsed results and use in-memory cache on repeat."""

    # ---------------------------
    # Arrange – mock HTTP layer
    # ---------------------------
    dummy_payload = {
        "results": [
            {
                "title": "Example Domain",
                "url": "https://example.com",
                "snippet": "Example snippet",
            }
        ]
    }

    async def _handler(request: httpx.Request) -> httpx.Response:  # noqa: D401
        # Assert correct endpoint and query params for first call
        assert request.url.path.endswith("/search")
        assert request.url.params["query"] == "example query"
        return httpx.Response(status_code=200, json=dummy_payload)

    transport = httpx.MockTransport(_handler)

    client = TavilyClient(api_key="dummy", base_url="https://api.tavily.com")
    # Inject mocked transport
    client._client = httpx.AsyncClient(transport=transport)

    # ---------------------------
    # Act – first call (network)
    # ---------------------------
    results_1 = await client.search("example query", max_results=1)

    # ---------------------------
    # Act – second call (cached)
    # ---------------------------
    # Swap transport to raise if a network call is attempted – proves caching
    async def _fail_handler(request: httpx.Request):  # pragma: no cover
        raise AssertionError("Network call was made but should have been cached")

    client._client._transport = httpx.MockTransport(_fail_handler)
    results_2 = await client.search("example query", max_results=1)

    # ---------------------------
    # Assert
    # ---------------------------
    expected = dummy_payload["results"]
    assert results_1 == expected
    assert results_2 == expected

    # Ensure both results objects are equal (cache hit path)
    assert results_1 is results_2 or results_1 == results_2 