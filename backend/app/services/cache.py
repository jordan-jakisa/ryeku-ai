"""Simple async caching helper.

If REDIS_URL is configured and Redis server is reachable, uses aioredis
for get/set with JSON serialization. Otherwise falls back to an in-process
LRU cache (not shared across workers).
"""
from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any, Optional

import logging

try:
    import aioredis
except ImportError:  # pragma: no cover
    aioredis = None  # type: ignore

logger = logging.getLogger(__name__)


class Cache:
    def __init__(self):
        self._use_redis = False
        self._redis = None

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        if aioredis is not None:
            try:
                self._redis = aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True)
                self._use_redis = True
            except Exception as err:  # pragma: no cover
                logger.warning("Could not connect to Redis (%s). Falling back to local cache.", err)

        # In-process fallback cache
        self._mem_cache: dict[str, Any] = {}

    # ------------------------------------------------------------------
    # API
    # ------------------------------------------------------------------

    async def get(self, key: str) -> Optional[Any]:
        if self._use_redis and self._redis:
            value = await self._redis.get(key)
            return json.loads(value) if value else None
        return self._mem_cache.get(key)

    async def set(self, key: str, value: Any, ttl: int = 60 * 60):
        if self._use_redis and self._redis:
            await self._redis.set(key, json.dumps(value), ex=ttl)
        else:
            self._mem_cache[key] = value


# Singleton accessor
@lru_cache(maxsize=1)
def get_cache() -> Cache:  # pragma: no cover
    return Cache() 