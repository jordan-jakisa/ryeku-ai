from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from app.services.research_agent import ResearchAgent
from app.models.pydantic_models import ResearchTopic, Source, Report

load_dotenv()

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

@app.post("/api/research/topic", response_model=dict)
async def submit_research_topic(topic: ResearchTopic):
    try:
        # Validate and store the research topic
        return {"status": "success", "message": "Research topic received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/research/sources", response_model=List[Source])
async def get_sources(topic: str, depth: str, focus: List[str], timeframe: str, source_types: List[str]):
    try:
        sources = await research_agent.find_sources(topic, depth, focus, timeframe, source_types)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 