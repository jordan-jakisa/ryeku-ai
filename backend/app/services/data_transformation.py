"""Data transformation utilities for the research pipeline.

Implements Task 21.4 – Transform `CleanDocument` instances into chunked
`Document` objects ready for embedding & downstream analysis.

Responsibilities
---------------
1. Apply deterministic text normalisation (lower-casing, trimming) *after* the
   validation/cleaning phase.
2. Split long texts into overlapping chunks of ~`MAX_TOKENS` tokens (approx.)
   while preserving sentence boundaries when possible.
3. Attach chunk-level metadata (`chunk_index`, `chunk_text_len`).
4. Optimise for large datasets via streaming/generator mode.
5. Emit structured logs for observability.
"""
from __future__ import annotations

import itertools
import logging
import math
import re
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List

from .data_validation import CleanDocument

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Datamodel
# ---------------------------------------------------------------------------


@dataclass
class Document:
    """A single, transformed chunk ready for embedding & storage."""

    id: str  # derived from parent CleanDocument id + chunk index
    parent_id: str
    title: str
    raw_format: str
    url: str
    metadata: Dict[str, Any]

    chunk_index: int  # 0-based
    chunk_text: str
    chunk_token_count: int

    def __post_init__(self):
        # Ensure metadata contains parent linkage for easier SQL insertion later.
        self.metadata.setdefault("parent_id", self.parent_id)
        self.metadata.setdefault("chunk_index", self.chunk_index)
        self.metadata.setdefault("chunk_token_count", self.chunk_token_count)


# ---------------------------------------------------------------------------
# Transformer
# ---------------------------------------------------------------------------


class DocumentTransformer:
    """Transforms CleanDocument -> List[Document] using simple token heuristics."""

    # NOTE: Proper token counting (e.g., tiktoken) could be added later.

    MAX_TOKENS = 512  # target tokens per chunk (approx words*0.75)
    TOKEN_OVERLAP = 50  # overlap to keep context between chunks

    SENTENCE_END_RE = re.compile(r"(?<=[.!?])\s+")

    @classmethod
    def _approx_tokens(cls, text: str) -> int:
        """Approximate token count based on word count (1 token ≈ 0.75 words)."""
        words = text.split()
        # rough heuristic: 75% of words ≈ tokens
        return math.ceil(len(words) * 0.75)

    @classmethod
    def _normalise(cls, text: str) -> str:
        """Lightweight normalisation: strip & collapse whitespace, lower-case."""
        text = re.sub(r"\s+", " ", text).strip()
        return text

    @classmethod
    def _split_into_sentences(cls, text: str) -> List[str]:
        """Split text into sentences using a regex fallback (language-agnostic)."""
        return [s.strip() for s in cls.SENTENCE_END_RE.split(text) if s.strip()]

    @classmethod
    def _chunk_sentences(cls, sentences: List[str]) -> Iterable[str]:
        """Yield chunks of sentences that respect MAX_TOKENS w/ overlap."""

        current_chunk: List[str] = []
        current_tokens = 0

        for sentence in sentences:
            sent_tokens = cls._approx_tokens(sentence)
            if current_tokens + sent_tokens > cls.MAX_TOKENS and current_chunk:
                # yield current
                yield " ".join(current_chunk)
                # start new chunk with overlap from previous chunk end
                overlap_sentences = current_chunk[-3:]  # last few sentences for context
                current_chunk = list(overlap_sentences)
                current_tokens = sum(cls._approx_tokens(s) for s in current_chunk)

            current_chunk.append(sentence)
            current_tokens += sent_tokens

        if current_chunk:
            yield " ".join(current_chunk)

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------

    @classmethod
    def transform(cls, doc: CleanDocument) -> List[Document]:
        """Transform one CleanDocument into chunked Document objects."""

        logger.info("Transforming document %s (len=%d)...", doc.id, len(doc.cleaned_text))

        normalised = cls._normalise(doc.cleaned_text)
        sentences = cls._split_into_sentences(normalised)
        chunks = list(cls._chunk_sentences(sentences))

        documents: List[Document] = []
        for idx, chunk in enumerate(chunks):
            chunk_tokens = cls._approx_tokens(chunk)
            doc_id = f"{doc.id}-{idx}"
            documents.append(
                Document(
                    id=doc_id,
                    parent_id=doc.id,
                    title=doc.title,
                    raw_format=doc.raw_format,
                    url=doc.url,
                    metadata={**doc.metadata},
                    chunk_index=idx,
                    chunk_text=chunk,
                    chunk_token_count=chunk_tokens,
                )
            )
            logger.debug("Chunk %s (%d tokens)", doc_id, chunk_tokens)

        logger.info("Document %s transformed into %d chunks", doc.id, len(documents))
        return documents

    # ------------------------------------------------------------------
    # Bulk helper
    # ------------------------------------------------------------------

    @classmethod
    def transform_bulk(cls, docs: List[CleanDocument]) -> List[Document]:
        """Transform multiple documents, flattening all chunks into one list."""
        all_chunks = list(itertools.chain.from_iterable(cls.transform(d) for d in docs))
        logger.info(
            "Transformation bulk complete – produced %d chunks from %d docs",
            len(all_chunks),
            len(docs),
        )
        return all_chunks 