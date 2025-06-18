"""Feature extraction utilities for the research pipeline.

Implements **Task 21.5 – Develop feature extraction module**.

This module converts the chunked `Document` objects produced by
`data_transformation.DocumentTransformer` into dense vector
representations that can be persisted to a vector store (pgvector) and
used for similarity search or analytical tasks.

For now we provide a thin wrapper around `AzureOpenAIEmbeddings`, but
this class is designed so that additional embedding back-ends (e.g.
Sentence-Transformers, Cohere, Mistral, etc.) can be registered with
minimal code changes.
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Sequence

from langchain_openai import AzureOpenAIEmbeddings
from langchain_core.embeddings import Embeddings

from .data_transformation import Document

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Datamodel
# ---------------------------------------------------------------------------


@dataclass
class VectorDocument(Document):
    """Document chunk augmented with vector representation."""

    embedding: List[float]

    # Preserve backwards-compatibility for code that may still expect
    # `metadata` but not `embedding`. `dataclasses` will append new field at
    # the end by default which is fine for our purposes.


# ---------------------------------------------------------------------------
# Extractor
# ---------------------------------------------------------------------------


class FeatureExtractor:
    """Thin wrapper around Embedding models to vectorise text chunks."""

    def __init__(self, embedder: Embeddings | None = None) -> None:
        # Lazily create default embedder to avoid import overhead if caller
        # injects a custom one.
        self.embedder = embedder or AzureOpenAIEmbeddings(
            azure_deployment="text-embedding-ada-002",
            openai_api_version="2023-06-01-preview",
        )
        logger.info("FeatureExtractor initialised with %s", self.embedder.__class__.__name__)

    # -------------------------- Sync API ----------------------------------

    def extract(self, docs: Sequence[Document]) -> List[VectorDocument]:
        """Synchronous feature extraction (blocking).

        Each chunk is embedded independently using the underlying
        `Embeddings` implementation.
        """
        logger.info("Starting embedding of %d chunks", len(docs))
        texts = [d.chunk_text for d in docs]
        embeddings = self.embedder.embed_documents(texts)

        vector_docs: List[VectorDocument] = []
        for d, vec in zip(docs, embeddings):
            vector_docs.append(VectorDocument(**d.__dict__, embedding=vec))  # type: ignore[arg-type]

        logger.info("Completed embeddings – produced %d vectors", len(vector_docs))
        return vector_docs

    # -------------------------- Async helper ------------------------------

    async def aextract(self, docs: Sequence[Document]) -> List[VectorDocument]:
        """Async wrapper that delegates to the threadpool to avoid blocking."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self.extract, list(docs)) 