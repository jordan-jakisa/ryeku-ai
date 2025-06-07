import os
from typing import List, Dict, Any
import uuid
from datetime import datetime
from langchain_azure_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from langchain.chains import LLMChain
from langgraph.graph import StateGraph, END
from app.models.pydantic_models import ResearchTopic, Source, Report

class ResearchAgent:
    def __init__(self):
        self.llm = AzureChatOpenAI(
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
            openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
            temperature=0.7
        )
        self.reports: Dict[str, Report] = {}
        self.progress: Dict[str, float] = {}

    async def find_sources(self, topic: str, depth: str, focus: List[str], 
                          timeframe: str, source_types: List[str]) -> List[Source]:
        source_finder_prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""You are a world-class research analyst. Your task is to identify the most credible and relevant sources for a given research topic. 
            Your analysis must be meticulous, ensuring that the selected sources are authoritative and directly aligned with the user's research goals.
            For each source, provide a concise summary, its type, and a relevance score.
            Present the output in a structured format."""),
            HumanMessage(content="""Please find the best sources for the following research inquiry:
            - **Research Topic:** "{topic}"
            - **Desired Depth:** {depth}
            - **Key Focus Areas:** {focus}
            - **Relevant Timeframe:** {timeframe}
            - **Preferred Source Types:** {source_types}
            
            Evaluate and list the top 5-7 sources that meet these criteria, providing the title, URL, a brief description, and a credibility/relevance assessment for each.""")
        ])

        chain = LLMChain(llm=self.llm, prompt=source_finder_prompt)
        response = await chain.arun(
            topic=topic,
            depth=depth,
            focus=", ".join(focus),
            timeframe=timeframe,
            source_types=", ".join(source_types)
        )

        # Parse response and create Source objects
        # This is a simplified version - you'd need to implement proper parsing
        sources = []
        # Add parsing logic here
        return sources

    async def start_report_generation(self, topic: ResearchTopic, sources: List[Source]) -> str:
        report_id = str(uuid.uuid4())
        self.progress[report_id] = 0.0
        
        # Create report generation graph
        workflow = self._create_report_workflow(topic, sources, report_id)
        
        # Start async execution
        # In a real implementation, you'd use a proper task queue
        import asyncio
        asyncio.create_task(self._execute_workflow(workflow, report_id))
        
        return report_id

    def _create_report_workflow(self, topic: ResearchTopic, sources: List[Source], report_id: str) -> StateGraph:
        # Define the nodes
        def analyze_sources(state):
            analysis_prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""As an expert research synthesizer, your role is to critically analyze a collection of sources and extract the most significant insights. 
                You must identify thematic connections, discrepancies, and emergent patterns across the provided materials. 
                Your output should be a structured synthesis of the key findings, which will serve as the foundation for a high-quality research report."""),
                HumanMessage(content="""Analyze the following sources to build a comprehensive understanding of the topic: '{topic}'.
                
                **Sources:**
                {sources}
                
                Your analysis should produce a structured summary of key insights, arguments, and evidence presented in these sources. 
                Organize the findings by theme and provide a clear, concise overview of the collective knowledge.""")
            ])
            
            chain = LLMChain(llm=self.llm, prompt=analysis_prompt)
            analysis = chain.run(topic=topic.topic, sources=sources)
            return {"analysis": analysis}

        def generate_report(state):
            report_prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""You are a distinguished research report author. Your task is to write a professional, in-depth research report.
                The report must be well-structured, evidence-based, and articulated with clarity and precision.
                It should include an executive summary, detailed analysis, and a concluding section with recommendations.
                The tone should be formal and objective."""),
                HumanMessage(content="""Construct a research report on the topic: '{topic}'.
                
                Utilize the following synthesized analysis and source materials to build your report:
                
                **Synthesized Analysis:**
                {analysis}
                
                **Referenced Sources:**
                {sources}
                
                The report should follow a logical structure:
                1.  **Executive Summary:** A concise overview of the key findings and conclusions.
                2.  **Introduction:** Background and context of the research topic.
                3.  **Detailed Findings:** A comprehensive presentation of the research, organized by theme.
                4.  **Conclusion & Recommendations:** A summary of the main points and actionable recommendations.
                
                Ensure that the report is coherent, well-supported by evidence from the sources, and professionally formatted.""")
            ])
            
            chain = LLMChain(llm=self.llm, prompt=report_prompt)
            report_content = chain.run(
                topic=topic.topic,
                analysis=state["analysis"],
                sources=sources
            )
            
            # Create and store the report
            report = Report(
                id=report_id,
                topic=topic,
                content=report_content,
                sources=sources,
                generated_at=datetime.utcnow().isoformat(),
                metadata={"depth": topic.depth, "focus": topic.focus}
            )
            self.reports[report_id] = report
            return {"report": report}

        # Create the graph
        workflow = StateGraph(StateGraph)
        
        # Add nodes
        workflow.add_node("analyze_sources", analyze_sources)
        workflow.add_node("generate_report", generate_report)
        
        # Add edges
        workflow.add_edge("analyze_sources", "generate_report")
        workflow.add_edge("generate_report", END)
        
        # Set entry point
        workflow.set_entry_point("analyze_sources")
        
        return workflow

    async def _execute_workflow(self, workflow: StateGraph, report_id: str):
        try:
            # Execute the workflow
            result = await workflow.arun()
            self.progress[report_id] = 100.0
        except Exception as e:
            # Handle errors
            self.progress[report_id] = -1.0
            raise e

    async def get_generation_progress(self, report_id: str) -> Dict[str, Any]:
        if report_id not in self.progress:
            raise ValueError("Report ID not found")
        return {
            "progress": self.progress[report_id],
            "status": "completed" if self.progress[report_id] == 100.0 else "failed" if self.progress[report_id] == -1.0 else "in_progress"
        }

    async def get_report(self, report_id: str) -> Report:
        if report_id not in self.reports:
            raise ValueError("Report not found")
        return self.reports[report_id] 