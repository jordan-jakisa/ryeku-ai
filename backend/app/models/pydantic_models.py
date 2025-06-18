from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class ResearchDepth(str, Enum):
    BASIC = "basic"
    COMPREHENSIVE = "comprehensive"
    EXPERT = "expert"

class SourceType(str, Enum):
    AUTHORITATIVE = "authoritative"
    ACADEMIC = "academic"
    INDUSTRY = "industry"
    NEWS = "news"

class ResearchTopic(BaseModel):
    topic: str = Field(..., description="The main research topic")
    depth: ResearchDepth = Field(..., description="Research depth level")
    focus: List[str] = Field(..., description="Specific areas of focus")
    timeframe: str = Field(..., description="Time period for research")
    sourceTypes: List[SourceType] = Field(..., description="Types of sources to include")

class Source(BaseModel):
    id: str = Field(..., description="Unique identifier for the source")
    title: str = Field(..., description="Title of the source")
    url: str = Field(..., description="URL of the source")
    domain: str = Field(..., description="Domain of the source")
    type: SourceType = Field(..., description="Type of source")
    description: str = Field(..., description="Description of the source content")
    credibilityScore: float = Field(..., ge=0, le=100, description="Credibility score (0-100)")
    relevanceScore: float = Field(..., ge=0, le=100, description="Relevance score (0-100)")
    selected: bool = Field(default=True, description="Whether the source is selected")

class Report(BaseModel):
    id: str = Field(..., description="Unique identifier for the report")
    topic: ResearchTopic = Field(..., description="Research topic")
    content: str = Field(..., description="Generated report content")
    sources: List[Source] = Field(..., description="Sources used in the report")
    generated_at: str = Field(..., description="Timestamp of report generation")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")

# --- Source Credibility Classification ---

class SourceClassificationRequest(BaseModel):
    """Request body for /api/classify-source"""

    domain: str = Field(..., description="Domain name to classify, e.g., 'nytimes.com'")

class SourceClassificationResult(BaseModel):
    """Response schema for source classification"""

    domain: str = Field(..., description="Domain that was classified")
    label: str = Field(..., pattern="^(Trusted|Other)$", description="Classification label: 'Trusted' or 'Other'")
    confidence: float = Field(..., ge=0, le=1, description="Classifier confidence score between 0 and 1")
    rationale: str = Field(..., description="Brief explanation returned by the model")

# --- Large Language Model (LLM) Integration Schemas ---

class LLMProvider(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    AZURE_OPENAI = "azure_openai"
    GOOGLE = "google"
    MISTRAL = "mistral"
    OLLAMA = "ollama"


class TokenPricing(BaseModel):
    """Pricing information expressed in USD per-1K tokens."""

    input: float = Field(..., ge=0, description="Cost per 1K input tokens in USD")
    output: float = Field(..., ge=0, description="Cost per 1K output tokens in USD")


class LLMModelInfo(BaseModel):
    """Metadata for an available LLM model that can be surfaced to the UI."""

    id: str = Field(..., description="Internal slug identifier, e.g. 'openai:gpt-4o-mini'")
    provider: LLMProvider = Field(..., description="Provider of the model")
    name: str = Field(..., description="Human-readable model name for display")
    context_window: int = Field(..., ge=1, description="Maximum context window in tokens")
    pricing: TokenPricing = Field(..., description="Pricing information for the model")
    modalities: List[str] = Field(
        default_factory=lambda: ["text"],
        description="Modalities supported by the model (e.g. text, vision)"
    )
    latency_ms_est: Optional[int] = Field(
        None, description="Estimated average latency for a completion request in ms"
    )
    tags: List[str] = Field(default_factory=list, description="Tags such as 'chat', 'fast', 'cheap'")


class ExecuteRequest(BaseModel):
    """Request schema for executing a prompt against a selected LLM model."""

    model_id: str = Field(..., description="ID of the model to use (must exist in catalog)")
    prompt: str = Field(..., description="Prompt text to send to the model")
    temperature: float = Field(1.0, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: int = Field(512, ge=1, description="Maximum number of tokens to generate")
    stream: bool = Field(False, description="Whether to stream the response using SSE")


class ExecuteResponse(BaseModel):
    """Response schema for an LLM execution request."""

    id: str = Field(..., description="Request identifier")
    created_at: str = Field(..., description="ISO8601 timestamp of execution creation")
    output: Optional[str] = Field(None, description="Generated text (if not streaming)")
    stream_url: Optional[str] = Field(None, description="URL to consume SSE stream")
    usage: Optional[dict] = Field(None, description="Token usage details returned by provider") 