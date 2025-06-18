"""Data validation and cleaning utilities for the research pipeline.

Implements Task 21.3 – Develop data validation and cleaning module.
"""
from __future__ import annotations

import html
import logging
import re
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Models (light-weight dataclasses – keep in sync with docs/ingestion_module_design.md)
# ---------------------------------------------------------------------------


@dataclass
class RawDocument:
    """A raw piece of content fetched by a Loader before chunking."""

    id: str
    title: str
    raw_format: str  # e.g. html, markdown, plaintext, pdf …
    text: str
    url: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CleanDocument(RawDocument):
    """A document that passed validation and had its text cleaned."""

    cleaned_text: str = ""


# ---------------------------------------------------------------------------
# Validator / Cleaner
# ---------------------------------------------------------------------------


SUPPORTED_FORMATS: List[str] = [
    "html",
    "markdown",
    "plaintext",
    "pdf",
    "csv",
    "json",
    "xml",
    "docx",
]


class DataValidatorCleaner:
    """Utility class housing validation and cleaning helpers."""

    MIN_TEXT_LENGTH = 100  # characters

    @classmethod
    def validate(cls, doc: RawDocument) -> Tuple[bool, List[str]]:
        """Validate mandatory fields & basic heuristics.

        Returns (is_valid, error_list)."""

        errors: List[str] = []

        if not doc.text or not doc.text.strip():
            errors.append("Empty text content")

        if len(doc.text or "") < cls.MIN_TEXT_LENGTH:
            errors.append(
                f"Text too short (<{cls.MIN_TEXT_LENGTH} chars): {len(doc.text)}"
            )

        if doc.raw_format not in SUPPORTED_FORMATS:
            errors.append(f"Unsupported format: {doc.raw_format}")

        # Example extra check: title presence
        if not doc.title:
            errors.append("Missing title")

        # Additional checks can be placed here (schema compliance, profanity etc.)

        return len(errors) == 0, errors

    # ---------------------------------------------------------------------
    # Cleaning helpers
    # ---------------------------------------------------------------------

    @staticmethod
    def clean_text(text: str) -> str:
        """Basic cleaning: HTML unescape, collapse whitespace, strip."""

        if text is None:
            return ""
        # Unescape HTML entities
        text = html.unescape(text)
        # Replace multiple whitespace (incl. newlines) with single space
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    # ---------------------------------------------------------------------
    # High-level pipeline helpers
    # ---------------------------------------------------------------------

    @classmethod
    def validate_and_clean(cls, doc: RawDocument) -> CleanDocument | None:
        """Run validation, clean text if valid, log results.

        Returns CleanDocument or None if invalid."""

        is_valid, errors = cls.validate(doc)
        if not is_valid:
            logger.warning(
                "Document %s failed validation: %s", doc.id, "; ".join(errors)
            )
            # Attach errors to metadata for upstream aggregation
            doc.metadata.setdefault("validation_errors", errors)
            return None

        cleaned_text = cls.clean_text(doc.text)
        cleaned_doc = CleanDocument(**doc.__dict__, cleaned_text=cleaned_text)
        logger.debug("Document %s cleaned (len=%d)", doc.id, len(cleaned_text))
        return cleaned_doc


# ---------------------------------------------------------------------------
# Convenience entry point
# ---------------------------------------------------------------------------


def validate_clean_bulk(docs: List[RawDocument]) -> List[CleanDocument]:
    """Validate & clean a list of documents, returning only valid ones."""

    cleaned: List[CleanDocument] = []
    for doc in docs:
        result = DataValidatorCleaner.validate_and_clean(doc)
        if result:
            cleaned.append(result)
    logger.info(
        "Validation complete – %d/%d documents passed",
        len(cleaned),
        len(docs),
    )
    return cleaned 