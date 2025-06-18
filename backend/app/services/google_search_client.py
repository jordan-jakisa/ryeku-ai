"""Google Custom Search client integration.

Wrapper around Google Custom Search JSON API that provides an async interface
with retries and optional in-memory / Redis caching (via get_cache helper).

Environment variables expected:
• GOOGLE_CSE_API_KEY – API key string.
• GOOGLE_CSE_ID – Search engine ID (CX).
• Optional GOOGLE_CSE_BASE_URL – override base URL (defaults to official endpoint).

Only minimal fields are returned for each search result to keep the interface
consistent with TavilyClient.search():
[
  {
    "url": str,
    "title": str,
    "description": str,
    "source": "google_cse"
  },
  ...
]
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
from typing import Any, Dict, List, Optional

import httpx
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential  # type: ignore

from .cache import get_cache

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = "https://customsearch.googleapis.com/customsearch/v1"


class GoogleSearchError(RuntimeError):
    """Raised when Google CSE API returns an error response"""


class GoogleSearchClient:
    """Async wrapper for Google Custom Search JSON API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        cse_id: Optional[str] = None,
        http: Optional[httpx.AsyncClient] = None,
        *,
        base_url: Optional[str] = None,
        cache_ttl: int = 60 * 60,  # 1 hour
    ) -> None:
        self.api_key = api_key or os.getenv("GOOGLE_CSE_API_KEY")
        self.cse_id = cse_id or os.getenv("GOOGLE_CSE_ID")
        if not self.api_key or not self.cse_id:
            raise ValueError(
                "GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID environment variables must be set"
            )
        self.base_url = base_url or os.getenv("GOOGLE_CSE_BASE_URL", DEFAULT_BASE_URL)
        self._http = http or httpx.AsyncClient(timeout=15)
        self._cache = get_cache()
        self._cache_ttl = cache_ttl

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------

    async def search(
        self,
        query: str,
        *,
        max_results: int = 10,
        start: int = 1,
        safe: str = "off",
        lang: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Return list of search result dicts limited to max_results items.

        Google CSE returns at most 10 items per request. We paginate if needed.
        """
        if max_results <= 0:
            return []

        tasks: List[asyncio.Task[List[Dict[str, Any]]]] = []
        remaining = max_results
        current_start = start
        while remaining > 0:
            batch_size = min(10, remaining)
            tasks.append(
                asyncio.create_task(
                    self._search_page(query, start=current_start, num=batch_size, safe=safe, lang=lang)
                )
            )
            remaining -= batch_size
            current_start += batch_size

        results: List[Dict[str, Any]] = []
        for task in tasks:
            try:
                results.extend(await task)
            except Exception as err:
                logger.warning("Google CSE page error: %s", err)
        return results[:max_results]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _search_page(
        self,
        query: str,
        *,
        start: int = 1,
        num: int = 10,
        safe: str = "off",
        lang: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        cache_key = self._make_cache_key(query, start, num, safe, lang)
        if cached := await self._cache.get(cache_key):  # type: ignore[func-returns-value]
            return json.loads(cached)

        params = {
            "key": self.api_key,
            "cx": self.cse_id,
            "q": query,
            "start": start,
            "num": num,
            "safe": safe,
        }
        if lang:
            params["lr"] = f"lang_{lang}"

        async for attempt in AsyncRetrying(
            retry=retry_if_exception_type((httpx.HTTPError, GoogleSearchError)),
            wait=wait_exponential(multiplier=1, min=2, max=10),
            stop=stop_after_attempt(3),
            reraise=True,
        ):
            with attempt:
                resp = await self._http.get(self.base_url, params=params, follow_redirects=True)
                if resp.status_code != 200:
                    raise GoogleSearchError(f"Google CSE error {resp.status_code}: {resp.text}")
                data = resp.json()
                items = data.get("items", [])
                results = [
                    {
                        "url": item.get("link"),
                        "title": item.get("title"),
                        "description": item.get("snippet"),
                        "source": "google_cse",
                    }
                    for item in items
                    if item.get("link")
                ]
                # cache
                await self._cache.set(cache_key, json.dumps(results), ex=self._cache_ttl)  # type: ignore[func-returns-value]
                return results
        return []  # pragma: no cover  # Should not reach here

    @staticmethod
    def _make_cache_key(*parts: Any) -> str:  # type: ignore[override]
        m = hashlib.sha256()
        m.update("|".join(map(str, parts)).encode())
        return f"google_cse:{m.hexdigest()}"

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------

    async def aclose(self):  # noqa: D401
        await self._http.aclose()


# Helper singleton
_client: Optional[GoogleSearchClient] = None

def get_google_search_client() -> GoogleSearchClient:
    global _client
    if _client is None:
        _client = GoogleSearchClient()
    return _client 