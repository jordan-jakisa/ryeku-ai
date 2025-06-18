"""Web ingestion & crawling utilities.

Implements the updated crawling stage for Task-21:
• Uses Google Custom Search API (via GoogleSearchClient) for discovery.
• Uses Tavily extract API to retrieve page text once URLs are discovered.
• Validates & cleans with built-in validation utilities to produce CleanDocument objects.
• Caches Google search results and Tavily extracts via Cache helper for performance.

NOTE: For PDF or binary links we skip download for now (future work).
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from typing import List

from .cache import get_cache
from .data_validation import RawDocument, validate_clean_bulk, CleanDocument
from .tavily_client import get_tavily_client, TavilyClient
from .google_search_client import get_google_search_client, GoogleSearchClient

logger = logging.getLogger(__name__)


class IngestionService:  # pragma: no cover – exercised indirectly
    """High-level helper that turns a topic string into CleanDocument list."""

    def __init__(
        self,
        google_search: GoogleSearchClient | None = None,
        tavily: TavilyClient | None = None,
    ):
        self.google = google_search or get_google_search_client()
        self.tavily = tavily or get_tavily_client()
        self.cache = get_cache()

    # --------------------------------------------------------------
    # Main public API
    # --------------------------------------------------------------

    async def ingest_topic(
        self,
        topic: str,
        *,
        max_links: int = 20,
        freshness: str | None = None,
    ) -> List[CleanDocument]:
        """Search Google & return validated, cleaned documents."""

        logger.info("Ingesting topic '%s' (max_links=%d)…", topic, max_links)

        # 1. Discover URLs using Google Custom Search
        results = await self.google.search(topic, max_results=max_links)

        # 2. Fetch in parallel
        raw_docs: List[RawDocument] = []
        tasks = [self._fetch_and_parse(res["url"], res.get("title")) for res in results]
        for doc in await asyncio.gather(*tasks, return_exceptions=True):
            if isinstance(doc, RawDocument):
                raw_docs.append(doc)
            else:
                logger.debug("Skipping result due to fetch error: %s", doc)

        # 3. Validate & clean
        cleaned = validate_clean_bulk(raw_docs)
        logger.info("Ingestion of '%s' produced %d cleaned docs", topic, len(cleaned))
        return cleaned

    # --------------------------------------------------------------
    # Internal helpers
    # --------------------------------------------------------------

    async def _fetch_and_parse(self, url: str, fallback_title: str | None = None) -> RawDocument | None:
        """Scrape page content using Tavily extract API."""
        try:
            result = await self.tavily.extract(url)
            text: str = result.get("text", "")  # type: ignore[assignment]
            title: str | None = result.get("title")  # type: ignore[assignment]
        except Exception as err:
            logger.warning("Tavily extract failed for %s – %s", url, err)
            return None

        if not text:
            return None

        doc = RawDocument(
            id=str(uuid.uuid4()),
            title=title or fallback_title or url,
            raw_format="html",
            text=text,
            url=url,
            metadata={"source": "google_cse+tavily"},
        )
        return doc

    # --------------------------------------------------------------
    # Cleanup
    # --------------------------------------------------------------

    async def __aexit__(self, exc_type, exc_val, exc_tb):  # noqa: D401
        # no persistent http client anymore
        pass 