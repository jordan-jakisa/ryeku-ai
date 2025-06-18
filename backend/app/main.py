from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from app.services.research_agent import ResearchAgent
from app.services.source_classifier import get_source_classifier
from app.models.pydantic_models import (
    ResearchTopic,
    Source,
    Report,
    SourceClassificationRequest,
    SourceClassificationResult,
    LLMModelInfo,
)
from app.services.llm_service import LLMService

from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

app = FastAPI(
    title="Ryeku Research API",
    description="API for AI-powered research report generation",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize research agent
research_agent = ResearchAgent()
# Initialize source classifier (cached singleton)
source_classifier = get_source_classifier()
# Initialize LLM service
llm_service = LLMService()

@app.post("/api/research/topic", response_model=dict)
async def submit_research_topic(topic: ResearchTopic):
    try:
        # Validate and store the research topic
        return {"status": "success", "message": "Research topic received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/research/sources", response_model=List[Source])
async def get_sources(
    topic: str = Query(..., description="Research topic"),
    depth: str = Query(..., description="Depth level"),
    focus: List[str] = Query(..., description="One or more focus areas"),
    timeframe: str = Query(..., description="Time frame specifier"),
    sourceTypes: List[str] = Query(..., alias="sourceTypes", description="Desired source types"),
):
    try:
        sources = await research_agent.find_sources(topic, depth, focus, timeframe, sourceTypes)
        return sources
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/research/generate", response_model=dict)
async def generate_report(topic: ResearchTopic, sources: List[Source]):
    try:
        report_id = await research_agent.start_report_generation(topic, sources)
        return {"status": "success", "report_id": report_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/research/progress/{report_id}", response_model=dict)
async def get_progress(report_id: str):
    try:
        progress = await research_agent.get_generation_progress(report_id)
        return progress
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/research/report/{report_id}", response_model=Report)
async def get_report(report_id: str):
    try:
        report = await research_agent.get_report(report_id)
        return report
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# ----------------------------------------------------
# Source credibility classification endpoint
# ----------------------------------------------------

@app.post("/api/classify-source", response_model=SourceClassificationResult)
async def classify_source(request: SourceClassificationRequest):
    """Classify a domain as Trusted/Other using GPT-4o-mini."""
    try:
        result = await source_classifier.classify_domain(request.domain)
        return SourceClassificationResult(domain=request.domain, **result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------
# LLM catalog endpoints
# ----------------------------------------------------

@app.get("/api/llm/models", response_model=List[LLMModelInfo])
async def list_llm_models():
    """Return the list of LLM models available for selection."""
    return llm_service.get_models()

@app.post("/api/llm/refresh-cache", response_model=List[LLMModelInfo])
async def refresh_llm_catalog():
    """Admin endpoint to refresh the in-memory LLM catalog from disk/dynamic providers."""
    # TODO: add proper auth once session management is implemented
    return llm_service.refresh_cache()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 