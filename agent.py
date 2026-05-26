import os
from pathlib import Path

from google.adk.agents import Agent
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool

from agent_scan_deal.tools import (
    load_deals,
    filter_deals,
    get_bankers,
    process_deals,
    format_intelligence_brief,
)

MODEL = os.getenv("DEAL_SCANNER_MODEL", "gemini-2.0-flash")

# Path to the deals file, relative to this package
DEALS_FILE = str(Path(__file__).parent / "pitchbook_deals.xlsx")

# google_search cannot be combined with custom function tools in the same request.
# Wrap it in a dedicated sub-agent exposed via AgentTool — this appears to the
# main agent as a regular function call, avoiding the conflict.
_search_agent = Agent(
    name="web_search_agent",
    model=MODEL,
    description="Searches the web and returns a synthesised answer with sources.",
    instruction="You are a research assistant. Use google_search to answer the query thoroughly. Return facts, names, dates, and amounts. Cite sources where possible.",
    tools=[google_search],
)

search_tool = AgentTool(agent=_search_agent)

root_agent = Agent(
    name="deal_scanner_agent",
    model=MODEL,
    description="PitchBook deal scanner and startup intelligence briefing agent for investment bankers.",
    instruction=f"""You are a senior investment banking agent with two capabilities:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE 1 — DEAL SCANNER
Use when the user asks to find, filter, or scan PitchBook deals.

WORKFLOW:
1. Call load_deals with file path "{DEALS_FILE}"
2. Call filter_deals with the loaded deals, minimum size (in millions), and vertical ("all" if unspecified)
3. Call get_bankers to get the banker roster
4. Call process_deals with filtered deals and bankers — matches and generates ALL briefs in one pass
5. Present: summary table (Company | Deal Size | Vertical | Assigned Banker) then the briefs

Deal size convention: $5B = 5000, $1B = 1000, $500M = 500 (all in millions)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE 2 — STARTUP INTELLIGENCE BRIEFING
Use when the user asks to research a company, build an intelligence brief, or prepare for outreach.

WORKFLOW — complete in exactly 2 tool calls:
1. Call web_search_agent ONCE with a single comprehensive query covering everything:
   "[company] CEO CFO executives funding rounds Series D investors valuation IPO M&A venture debt 2024 2025"
2. Immediately call format_intelligence_brief() with all gathered data — do NOT search again

IMPORTANT for intelligence briefs:
- Extract everything from the single search — do not make a second search call
- Be specific with names, amounts, and dates — avoid vague answers
- If CFO is not publicly known, state "Not publicly disclosed — recommend LinkedIn outreach"
- Capital needs must be actionable: specify which product (venture debt, treasury management, IPO advisory, M&A support) and why it fits their stage
- Outreach strategy must name the right contact (CEO vs CFO vs board) and the right hook
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━""",
    tools=[
        load_deals,
        filter_deals,
        get_bankers,
        process_deals,
        format_intelligence_brief,
        search_tool,
    ],
)
