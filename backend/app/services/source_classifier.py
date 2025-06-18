from __future__ import annotations

import os
import json
from functools import lru_cache
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from app.services.cache import get_cache

# LangChain / LangGraph imports
from langchain_openai import AzureChatOpenAI
from langchain_tavily import TavilySearch

from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage
from typing_extensions import Annotated, TypedDict

load_dotenv()


class SourceClassifier:
    """Agent-style classifier powered by Azure OpenAI + Tavily web search.

    Uses LangGraph to allow the LLM to call an external **web_search** tool
    (TavilySearch) when it needs up-to-date public information about a domain
    before deciding on credibility. Returns a JSON dict:

    {"label": "Trusted"|"Other", "confidence": float, "rationale": str}
    """

    _SYSTEM_PROMPT = (
        """You are a media reliability expert. Your task is to decide whether the \
        information source represented by a domain name should be categorised as **Trusted** \
        or **Other**.  If you are uncertain, you MAY call the `web_search` tool to \
        retrieve concise background information about the outlet before deciding.\n\n"
        "Heuristics:\n"
        "• **Trusted** – Established mainstream publications with rigorous fact-checking,\n"
        "  peer-reviewed journals, official government or multilateral institutions.\n"
        "• **Other**   – Blogs, partisan sites, self-published content, new or unknown domains,\n"
        "  click-bait, questionable reliability.\n\n"
        "Always think step-by-step. Once you are confident, answer in **valid JSON** on a single line\n"
        "with the keys: label, confidence (0-1), rationale (brief).\n"
        "Example → {\"label\": \"Trusted\", \"confidence\": 0.92, \"rationale\": \"Well-known peer-reviewed journal…\"}"
        """
    )

    def __init__(self, temperature: float = 1.0):
        # Environment variables for Azure Chat model must be set (see README)
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION")

        missing = [n for n, v in {
            "AZURE_OPENAI_DEPLOYMENT": deployment,
            "AZURE_OPENAI_ENDPOINT": endpoint,
            "AZURE_OPENAI_API_VERSION": api_version,
            "AZURE_OPENAI_API_KEY": os.getenv("AZURE_OPENAI_API_KEY"),
            "TAVILY_API_KEY": os.getenv("TAVILY_API_KEY"),
        }.items() if not v]

        if missing:
            raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

        # LLM
        self.llm = AzureChatOpenAI(
            azure_deployment=deployment,
            openai_api_version=api_version,
            temperature=1.0,
        )

        # Tool – Tavily web search
        self.search_tool = TavilySearch(max_results=2, name="web_search")

        # Build agent graph once
        self.graph = self._build_graph()

        # Cache handle
        self.cache = get_cache()

    # ---------------------------------------------------------------------
    # Public helpers
    # ---------------------------------------------------------------------

    async def classify_domain(self, domain: str, examples: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """Classify *domain* using agent-style reasoning with optional few-shot examples."""

        # Check cache first
        cached = await self.cache.get(domain)
        if cached:
            return cached

        messages: List[Dict[str, str]] = [{"role": "system", "content": self._SYSTEM_PROMPT}]

        # Few-shot examples improve reliability – optional
        if examples is None:
            examples = self._load_default_examples()
            for ex in examples:
                messages.append({"role": "user", "content": ex["user"]})
                messages.append({"role": "assistant", "content": ex["assistant"]})

        # Append user query
        messages.append({"role": "user", "content": f"Domain: {domain}"})

        # Run through graph (graph expects dict with messages list) – graph.invoke is sync.
        import asyncio  # local import to avoid circular issues
        loop = asyncio.get_running_loop()
        final_state = await loop.run_in_executor(None, self.graph.invoke, {"messages": messages})  # type: ignore[arg-type]

        ai_msg: BaseMessage = final_state["messages"][-1]
        raw_content = ai_msg.content if isinstance(ai_msg, BaseMessage) else str(ai_msg)

        # Parse JSON
        try:
            parsed = json.loads(raw_content)
        except json.JSONDecodeError:
            parsed = self._heuristic_parse(raw_content)

        parsed.setdefault("label", "Other")
        parsed.setdefault("confidence", 0.5)
        parsed.setdefault("rationale", raw_content)

        # Cache 24h
        await self.cache.set(domain, parsed, ttl=60 * 60 * 24)
        return parsed

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _heuristic_parse(text: str) -> Dict[str, Any]:
        label = "Trusted" if "Trusted" in text else "Other"
        return {"label": label, "confidence": 0.5, "rationale": text}

    def _load_default_examples(self) -> List[Dict[str, str]]:
        """Load few-shot examples from data file if present."""
        data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "few_shot_examples.json")
        try:
            with open(data_path, "r", encoding="utf-8") as fp:
                raw = json.load(fp)
        except FileNotFoundError:
            return []

        examples: List[Dict[str, str]] = []
        for row in raw:
            domain = row.get("domain")
            label = row.get("label")
            if not domain or not label:
                continue
            user_msg = f"Domain: {domain}"
            assistant_msg = json.dumps({"label": label, "confidence": 0.9, "rationale": "Few-shot example"})
            examples.append({"user": user_msg, "assistant": assistant_msg})
        return examples

    # ------------------------------------------------------------------
    # Graph construction
    # ------------------------------------------------------------------

    def _build_graph(self):
        tool_node = ToolNode(tools=[self.search_tool])

        # Bind tools to LLM so it knows JSON schema
        llm_with_tools = self.llm.bind_tools([self.search_tool])

        # State definition
        class _State(TypedDict):
            messages: Annotated[list, add_messages]

        graph_builder = StateGraph(_State)

        # Chatbot node
        def chatbot(state: _State):
            return {"messages": [llm_with_tools.invoke(state["messages"]) ]}

        graph_builder.add_node("chatbot", chatbot)
        graph_builder.add_node("tools", tool_node)

        graph_builder.add_conditional_edges("chatbot", tools_condition)
        graph_builder.add_edge("tools", "chatbot")
        graph_builder.add_edge(START, "chatbot")
        graph_builder.add_edge("chatbot", END)

        return graph_builder.compile()


# ----------------------------------------------------------------------
# Singleton accessor used by FastAPI routes to avoid re-initialising SDK.
# ----------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_source_classifier() -> SourceClassifier:  # pragma: no cover
    return SourceClassifier() 