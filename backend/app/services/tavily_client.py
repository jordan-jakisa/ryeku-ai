"""Tavily Search API wrapper.

Provides a thin async client around Tavily's `/search` endpoint with:
• Automatic retries with exponential back-off.
• Optional Redis/in-process caching via `Cache` helper.
• Normalised response schema for downstream services.

Environment variables recognised:
TAVILY_API_KEY          – required
TAVILY_API_BASE_URL     – optional (default: https://api.tavily.com)

Usage
-----
client = get_tavily_client()
results = await client.search("impact of ai on healthcare", max_results=10)
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
from typing import Any, Dict, List, Optional, Callable

# Official Tavily Python SDK
from tavily import TavilyClient as _TavilySyncClient  # type: ignore

from .cache import get_cache

# NOTE: We keep httpx import only for type hints of test mocks.
import httpx  # type: ignore  # noqa: F401

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = "https://api.tavily.com"  # Unused with official SDK but retained for env override
SEARCH_ENDPOINT = "/search"  # retained for tests that monkeypatch HTTP layer

# ---------------------------------------------
# Helper – back-off retry decorator
# ---------------------------------------------

def _retry(max_attempts: int = 3, base_delay: float = 0.5):
    """Simple async retry decorator with exponential back-off."""

    def decorator(func):
        async def wrapper(*args, **kwargs):
            attempt = 0
            while True:
                try:
                    return await func(*args, **kwargs)
                except Exception as exc:  # noqa: BLE001
                    attempt += 1
                    if attempt >= max_attempts:
                        logger.error("[tavily] giving up after %d attempts – %s", attempt, exc)
                        raise
                    sleep_for = base_delay * 2 ** (attempt - 1)
                    logger.warning(
                        "[tavily] request failed (%s) – retrying in %.1fs (attempt %d/%d)",
                        exc,
                        sleep_for,
                        attempt,
                        max_attempts,
                    )
                    await asyncio.sleep(sleep_for)

        return wrapper

    return decorator


class TavilyClient:
    """Async wrapper around the official synchronous `tavily-python` client.

    The public interface remains `await TavilyClient.search(...)` returning a list
    of result dictionaries, but the actual HTTP requests are delegated to the
    official SDK executed in a thread via `asyncio.to_thread` to avoid blocking
    the event loop.
    """

    def __init__(self, api_key: str, base_url: str = DEFAULT_BASE_URL):
        self.api_key = api_key
        # The SDK currently does not expose a base_url override, but we keep
        # the variable to preserve backwards-compatibility with unit tests that
        # monkey-patch HTTP transports.
        self.base_url = base_url.rstrip("/")

        # Underlying synchronous client from tavily-python SDK
        self._sync_client = _TavilySyncClient(api_key=api_key)

        # Simple in-process or Redis cache helper shared across app
        self._cache = get_cache()

        # For backwards-compatibility with existing unit tests that patch
        # `._client`, we lazily create an AsyncClient the first time the attr is
        # accessed. New code paths should never touch it.
        self._client: Optional[httpx.AsyncClient] = None

    # --------------------------------------------------
    # Public API
    # --------------------------------------------------

    @_retry()
    async def search(
        self,
        query: str,
        *,
        max_results: int = 10,
        freshness: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Run a Tavily search.

        Parameters
        ----------
        query       – free-text search query.
        max_results – how many results to return (Tavily `num_results`).
        freshness   – optional freshness filter (e.g. "month", "year").

        Returns a list of JSON result dictionaries as returned by Tavily.
        """
        # Build cache key independently of the SDK (order-independent)
        params: Dict[str, Any] = {
            "query": query,
            "max_results": max_results,
            "freshness": freshness,
        }

        cache_key = self._cache_key("search", params)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            logger.debug("[tavily] cache hit for '%s'", query)
            return cached  # type: ignore[return-value]

        # Legacy path: if an `httpx.AsyncClient` has been injected (e.g. by unit
        # tests), use it instead of the SDK. This preserves test mocks without
        # requiring major changes.

        if self._client is not None:
            url = f"{self.base_url}{SEARCH_ENDPOINT}"
            logger.info("[tavily] HTTP GET %s", url)

            http_params = {
                "query": query,
                "num_results": max_results,
            }
            if freshness:
                http_params["freshness"] = freshness

            resp = await self._client.get(url, params=http_params)
            resp.raise_for_status()
            data = resp.json()

            results = data.get("results") or data
            if not isinstance(results, list):
                raise ValueError("Unexpected Tavily API response format")
        else:
            # ---------------------------------------------
            # Call blocking SDK in a thread to avoid I/O lock
            # ---------------------------------------------

            def _call_sync() -> List[Dict[str, Any]]:
                # The official SDK uses `search(query, max_results=10, **kwargs)`
                result = self._sync_client.search(
                    query, max_results=max_results, freshness=freshness  # type: ignore[arg-type]
                )
                # Ensure we always return list (SDK returns dict with 'results')
                if isinstance(result, dict) and "results" in result:
                    return result["results"]  # type: ignore[index]
                if isinstance(result, list):
                    return result
                raise ValueError("Unexpected Tavily SDK response format")

            results = await asyncio.to_thread(_call_sync)

        # Cache for 6h
        await self._cache.set(cache_key, results, ttl=6 * 60 * 60)
        return results

    @_retry()
    async def extract(
        self,
        url: str,
        *,
        text_format: str = "text",
        cache_ttl: int = 60 * 60 * 6,
    ) -> Dict[str, Any]:
        """Extract page content using Tavily SDK and cache result."""

        cache_key = f"tavily:extract:{hashlib.sha1(url.encode()).hexdigest()}:{text_format}"
        if cached := await self._cache.get(cache_key):  # type: ignore[func-returns-value]
            return json.loads(cached)

        def _call_extract() -> Dict[str, Any]:
            # tavily-python provides .extract(url, text_format="text")
            return self._sync_client.extract(url=url, text_format=text_format)  # type: ignore[attr-defined]

        try:
            content: Dict[str, Any] = await asyncio.to_thread(_call_extract)
        except Exception as err:
            logger.error("Tavily extract failed for %s – %s", url, err)
            raise

        # cache
        await self._cache.set(cache_key, json.dumps(content), ex=cache_ttl)  # type: ignore[func-returns-value]
        return content

    # --------------------------------------------------
    # Internal helpers
    # --------------------------------------------------

    @staticmethod
    def _cache_key(endpoint: str, params: Dict[str, Any]) -> str:
        # Remove None values so cache keys are stable
        clean_params = {k: v for k, v in params.items() if v is not None}
        key_raw = json.dumps({"endpoint": endpoint, **clean_params}, sort_keys=True)
        key_hash = hashlib.sha256(key_raw.encode()).hexdigest()
        return f"tavily:{key_hash}"


# Singleton accessor ---------------------------------------------------

_tavily_client: Optional[TavilyClient] = None

def get_tavily_client() -> TavilyClient:  # pragma: no cover
    global _tavily_client  # noqa: PLW0603
    if _tavily_client is None:
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise RuntimeError("TAVILY_API_KEY environment variable is not set")
        base_url = os.getenv("TAVILY_API_BASE_URL", DEFAULT_BASE_URL)
        _tavily_client = TavilyClient(api_key=api_key, base_url=base_url)
    return _tavily_client 