from __future__ import annotations

import json
from pathlib import Path
from typing import List
from datetime import datetime

from app.models.pydantic_models import LLMModelInfo, LLMProvider, TokenPricing


class LLMService:
    """Simple in-memory service exposing available LLM models.

    The first implementation uses a *static* catalog defined in JSON/YAML.
    A `refresh_cache` method is provided to reload the catalog which may be
    replaced by dynamic provider fetching in future iterations.
    """

    CATALOG_PATH = Path(__file__).parent.parent / "data" / "llm_catalog.json"

    def __init__(self) -> None:
        self._catalog: List[LLMModelInfo] = []
        self._last_refresh: datetime | None = None
        self._load_catalog()

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------

    def get_models(self) -> List[LLMModelInfo]:
        """Return the list of models currently available."""
        return self._catalog

    def refresh_cache(self) -> List[LLMModelInfo]:
        """Reload the catalog from disk.

        Returns the refreshed list so that callers can immediately use it.
        """
        self._load_catalog(force=True)
        return self._catalog

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _load_catalog(self, force: bool = False) -> None:
        if self._catalog and not force:
            return  # Already loaded

        if self.CATALOG_PATH.exists():
            with open(self.CATALOG_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self._catalog = [LLMModelInfo(**item) for item in raw]
        else:
            # Fallback to a hard-coded minimal catalog
            self._catalog = [
                LLMModelInfo(
                    id="openai:gpt-4o-mini",
                    provider=LLMProvider.OPENAI,
                    name="GPT-4o Mini",
                    context_window=128000,
                    pricing=TokenPricing(input=0.0005, output=0.0015),
                    modalities=["text", "vision"],
                    latency_ms_est=800,
                    tags=["chat", "vision", "state-of-the-art"],
                ),
                LLMModelInfo(
                    id="openai:gpt-3.5-turbo",
                    provider=LLMProvider.OPENAI,
                    name="GPT-3.5 Turbo",
                    context_window=16000,
                    pricing=TokenPricing(input=0.0005, output=0.0015),
                    modalities=["text"],
                    latency_ms_est=300,
                    tags=["chat", "cheap", "fast"],
                ),
            ]

        self._last_refresh = datetime.utcnow() 