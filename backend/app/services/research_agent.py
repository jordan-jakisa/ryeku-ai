import os
import uuid
import asyncio
from datetime import datetime
from typing import List, Dict, Any, TypedDict, Optional
from langchain_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage, BaseMessage
from langgraph.graph import StateGraph, END
from app.models.pydantic_models import ResearchTopic, Source, Report
from app.services.source_classifier import get_source_classifier
import logging

logger = logging.getLogger(__name__)

class GraphState(TypedDict):
    analysis: Optional[str]
    report: Optional[Report]

class ResearchAgent:
    def __init__(self):
        # ------------------------------------------------------------------
        # Validate required Azure OpenAI environment configuration.
        # ------------------------------------------------------------------
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION")

        missing = [name for name, val in {
            "AZURE_OPENAI_DEPLOYMENT": deployment,
            "AZURE_OPENAI_ENDPOINT": endpoint,
            "AZURE_OPENAI_API_VERSION": api_version,
            "AZURE_OPENAI_API_KEY": os.getenv("AZURE_OPENAI_API_KEY"),
        }.items() if not val]

        if missing:
            raise RuntimeError(
                "Missing required Azure OpenAI environment variables: " + ", ".join(missing)
            )

        # ------------------------------------------------------------------
        # Initialise LLM – use AzureChatOpenAI so LangChain constructs the
        # proper Azure-specific request path ( /openai/deployments/<name>/ … ).
        # ------------------------------------------------------------------
        self.llm = AzureChatOpenAI(
            azure_deployment=deployment,
            azure_endpoint=endpoint,
            openai_api_version=api_version,
            temperature=1.0,
        )
        self.reports: Dict[str, Report] = {}
        self.progress: Dict[str, float] = {}

        # Ensure a default handler is present if the application didn't configure logging yet.
        if not logging.getLogger().handlers:
            logging.basicConfig(level=logging.INFO,
                                format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")

        logger.info("ResearchAgent initialised – Azure deployment: %s", os.getenv("AZURE_OPENAI_DEPLOYMENT"))

    async def find_sources(self, topic: str, depth: str, focus: List[str],
                          timeframe: str, sourceTypes: List[str]) -> List[Source]:
        """Discover potential sources for a research topic via Tavily search.

        This replaces the earlier LLM-only discovery step to comply with the new
        requirement that *all* internet search rely on the Tavily API.
        """
        from urllib.parse import urlparse

        # --------------------------------------------------
        # 1. Query Tavily Search API
        # --------------------------------------------------
        from app.services.tavily_client import get_tavily_client

        tavily = get_tavily_client()

        # Map timeframe → Tavily freshness param (very loose mapping)
        freshness_map = {
            "last-year": "year",
            "last-2-years": "year",
            "last-5-years": "year",
        }
        freshness = freshness_map.get(timeframe)

        logger.info("[find_sources] Searching Tavily – query='%s'", topic)
        tavily_results = await tavily.search(topic, max_results=10, freshness=freshness)

        if not tavily_results:
            logger.warning("[find_sources] Tavily returned no results for '%s'", topic)
            return []

        # --------------------------------------------------
        # 2. Classify credibility & build Source objects
        # --------------------------------------------------
        classifier = get_source_classifier()

        async def build_source(entry):
            domain = urlparse(entry.get("url", "")).netloc or ""
            # Credibility classification via GPT-4o-mini / SourceClassifier
            try:
                classification = await classifier.classify_domain(domain)
                label = classification.get("label", "Other")
                confidence = float(classification.get("confidence", 0.5))
                credibility_score = int(90 * confidence) if label == "Trusted" else int(40 * confidence)
            except Exception as exc:  # noqa: BLE001
                logger.debug("[find_sources] classify_domain failed for %s – %s", domain, exc)
                credibility_score = 50

            # Simple heuristic relevance: Tavily provides a position order; higher rank = more relevant
            # Map rank (1-based) to 100-(rank*5)
            rank = tavily_results.index(entry) + 1
            relevance_score = max(100 - rank * 5, 50)

            return Source(
                id=str(uuid.uuid4()),
                title=entry.get("title"),
                url=entry.get("url"),
                domain=domain,
                type="news",  # default – could refine later
                description=entry.get("content") or entry.get("snippet", ""),
                credibilityScore=credibility_score,
                relevanceScore=relevance_score,
                selected=True,
            )

        sources = await asyncio.gather(*(build_source(r) for r in tavily_results))
        return list(sources)

    async def start_report_generation(self, topic: ResearchTopic, sources: List[Source]) -> str:
        report_id = str(uuid.uuid4())
        self.progress[report_id] = 0.0
        
        # Create report generation graph
        workflow = self._create_report_workflow(topic, sources, report_id)
        
        # Start async execution
        # In a real implementation, you'd use a proper task queue
        asyncio.create_task(self._execute_workflow(workflow, report_id))
        
        return report_id

    def _create_report_workflow(self, topic: ResearchTopic, sources: List[Source], report_id: str) -> Any:
        # Define the nodes
        async def analyze_sources(state):
            self.progress[report_id] = 10.0
            analysis_prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""As an expert research synthesizer, your role is to critically analyze a collection of sources and extract the most significant insights. 
                You must identify thematic connections, discrepancies, and emergent patterns across the provided materials. 
                Your analysis should produce a structured summary of key insights, arguments, and evidence presented in these sources. 
                Organize the findings by theme and provide a clear, concise overview of the collective knowledge."""),
                HumanMessage(content="""Analyze the following sources to build a comprehensive understanding of the topic: '{topic}'.
                
                **Sources:**
                {sources}
                
                Your analysis should produce a structured summary of key insights, arguments, and evidence presented in these sources. 
                Organize the findings by theme and provide a clear, concise overview of the collective knowledge.""")
            ])
            
            # LCEL chain: prompt | llm
            chain = analysis_prompt | self.llm
            logger.info("[analysis] Generating synthesized analysis for report '%s'", report_id)
            self.progress[report_id] = 25.0
            analysis_response = await chain.ainvoke({
                "topic": topic.topic,
                "sources": "\n".join([f"- {source.title} ({source.url})" for source in sources]),
            })
            analysis = analysis_response.content
            logger.debug("[analysis] Analysis generated (first 400 chars): %s", analysis[:400])
            return {"analysis": analysis}

        def generate_report(state):
            self.progress[report_id] = 60.0
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
            
            # LCEL chain: prompt | llm
            chain = report_prompt | self.llm
            logger.info("[generate_report] Creating report '%s'", report_id)
            self.progress[report_id] = 75.0
            # Convert Source objects to a human-readable bullet list so the LLM can actually
            # reference them. Passing the raw pydantic objects results in a Python repr that
            # confuses the model and leads to an un-filled template.

            sources_markdown = "\n".join(
                f"- {s.title} ({s.url})" for s in sources
            )

            report_response: BaseMessage = chain.invoke({
                "topic": topic.topic,
                "analysis": state["analysis"],
                "sources": sources_markdown,
            })
            report_content = report_response.content
            logger.debug("[generate_report] Report content length: %d characters", len(report_content))
            
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
            self.progress[report_id] = 100.0
            logger.info("[generate_report] Report '%s' generation completed", report_id)
            return {"report": report}

        # Create the graph
        workflow = StateGraph(GraphState)
        
        # Add nodes
        workflow.add_node("analyze_sources", analyze_sources)
        workflow.add_node("generate_report", generate_report)
        
        # Add edges
        workflow.add_edge("analyze_sources", "generate_report")
        workflow.add_edge("generate_report", END)
        
        # Set entry point
        workflow.set_entry_point("analyze_sources")
        
        # Return the *compiled* graph so callers can execute it directly.
        return workflow.compile()

    async def _execute_workflow(self, workflow: Any, report_id: str):
        try:
            # The runnable workflow expects an initial state dict (can be empty)
            result = await workflow.ainvoke({})
        except Exception as e:
            # Handle errors
            self.progress[report_id] = -1.0
            logger.exception("[workflow] Report '%s' generation failed", report_id)
            raise e

    async def get_generation_progress(self, report_id: str) -> Dict[str, Any]:
        if report_id not in self.progress:
            raise ValueError("Report ID not found")
        status = "completed" if self.progress[report_id] == 100.0 else "failed" if self.progress[report_id] == -1.0 else "in_progress"
        logger.debug("[progress] Report '%s' status=%s progress=%.2f%%", report_id, status, self.progress[report_id])
        return {
            "progress": self.progress[report_id],
            "status": status
        }

    async def get_report(self, report_id: str) -> Report:
        if report_id not in self.reports:
            raise ValueError("Report not found")
        logger.info("[get_report] Returning report '%s'", report_id)
        return self.reports[report_id] 