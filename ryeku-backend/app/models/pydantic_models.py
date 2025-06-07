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